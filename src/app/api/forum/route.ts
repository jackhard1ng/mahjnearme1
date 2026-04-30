import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/api-auth";

// GET: List posts (by metro or general) or get single post with replies
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    const metro = searchParams.get("metro");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    if (postId) {
      // Get single post with replies
      const postDoc = await db.collection("forumPosts").doc(postId).get();
      if (!postDoc.exists) {
        return NextResponse.json({ post: null, replies: [] });
      }

      const repliesSnap = await db
        .collection("forumReplies")
        .where("postId", "==", postId)
        .orderBy("createdAt", "asc")
        .get();

      const replies = repliesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      return NextResponse.json({
        post: { id: postDoc.id, ...postDoc.data() },
        replies,
      });
    }

    // List posts for a metro region (or general discussion)
    let query;

    if (metro) {
      query = db
        .collection("forumPosts")
        .where("metroSlug", "==", metro)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .offset(offset);
    } else {
      query = db
        .collection("forumPosts")
        .where("metroSlug", "==", null)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .offset(offset);
    }

    const snap = await query.get();
    const allPosts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Sort sticky posts to top
    const stickyPosts = allPosts.filter((p: Record<string, unknown>) => p.isSticky);
    const regularPosts = allPosts.filter((p: Record<string, unknown>) => !p.isSticky);
    const posts = [...stickyPosts, ...regularPosts];

    return NextResponse.json({ posts });
  } catch (err) {
    console.error("Forum GET error:", err);
    return NextResponse.json({ posts: [], error: "Failed to load posts" });
  }
}

// POST: Create a new forum post
export async function POST(request: NextRequest) {
  const authResult = await requireUser(request);
  if (authResult instanceof NextResponse) return authResult;
  const authorId = authResult.uid;

  try {
    const db = getAdminDb();
    const body = await request.json();
    const {
      metroSlug,
      authorName,
      authorPhotoURL,
      title,
      body: postBody,
      linkedGameId,
      postType,
    } = body;

    // authorIsContributor must come from the user record, not the request body
    const userDoc = await db.collection("users").doc(authorId).get();
    const userData = userDoc.data() || {};
    const authorIsContributor = !!(userData.isContributor || userData.accountType === "contributor");

    const isQuickNote = postType === "quick_note";

    if ((!isQuickNote && !title) || !postBody) {
      return NextResponse.json(
        { error: isQuickNote ? "Body is required." : "Title and body are required." },
        { status: 400 }
      );
    }

    // Quick notes have a 280 character limit
    if (isQuickNote && postBody.length > 280) {
      return NextResponse.json(
        { error: "Quick notes are limited to 280 characters." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const postData = {
      postType: isQuickNote ? "quick_note" : "full",
      metroSlug: metroSlug || null,
      authorId,
      authorName: authorName || "Anonymous",
      authorPhotoURL: authorPhotoURL || null,
      authorIsContributor: authorIsContributor || false,
      title: isQuickNote ? "" : title,
      body: postBody,
      isSticky: false,
      linkedGameId: linkedGameId || null,
      upvotes: 0,
      upvotedBy: [],
      flagCount: 0,
      flaggedBy: [],
      createdAt: now,
      updatedAt: now,
    };

    const ref = await db.collection("forumPosts").add(postData);

    // Track contributor activity when posting in their metro
    if (authorIsContributor && metroSlug && userData.contributorMetro === metroSlug) {
      await db.collection("users").doc(authorId).set(
        { lastActivityDate: now, updatedAt: now },
        { merge: true }
      );
    }

    return NextResponse.json({ id: ref.id, ...postData });
  } catch (err) {
    console.error("Forum POST error:", err);
    return NextResponse.json(
      { error: "Failed to create post." },
      { status: 500 }
    );
  }
}

// PUT: Create a reply to a post
export async function PUT(request: NextRequest) {
  const authResult = await requireUser(request);
  if (authResult instanceof NextResponse) return authResult;
  const authorId = authResult.uid;

  try {
    const db = getAdminDb();
    const body = await request.json();
    const {
      postId,
      authorName,
      authorPhotoURL,
      body: replyBody,
    } = body;

    const userDoc = await db.collection("users").doc(authorId).get();
    const userData = userDoc.data() || {};
    const authorIsContributor = !!(userData.isContributor || userData.accountType === "contributor");

    if (!postId || !replyBody) {
      return NextResponse.json(
        { error: "Post ID and body are required." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const replyData = {
      postId,
      authorId,
      authorName: authorName || "Anonymous",
      authorPhotoURL: authorPhotoURL || null,
      authorIsContributor: authorIsContributor || false,
      body: replyBody,
      upvotes: 0,
      upvotedBy: [],
      flagCount: 0,
      flaggedBy: [],
      createdAt: now,
    };

    const ref = await db.collection("forumReplies").add(replyData);

    return NextResponse.json({ id: ref.id, ...replyData });
  } catch (err) {
    console.error("Forum PUT error:", err);
    return NextResponse.json(
      { error: "Failed to create reply." },
      { status: 500 }
    );
  }
}

// PATCH: Upvote or flag a post
export async function PATCH(request: NextRequest) {
  const authResult = await requireUser(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.uid;

  try {
    const db = getAdminDb();
    const body = await request.json();
    const { postId, action } = body;

    if (!postId || !action) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const postRef = db.collection("forumPosts").doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const data = postDoc.data()!;

    if (action === "upvote") {
      const upvotedBy: string[] = data.upvotedBy || [];
      if (upvotedBy.includes(userId)) {
        // Remove upvote
        await postRef.update({
          upvotes: Math.max(0, (data.upvotes || 0) - 1),
          upvotedBy: upvotedBy.filter((id: string) => id !== userId),
        });
      } else {
        await postRef.update({
          upvotes: (data.upvotes || 0) + 1,
          upvotedBy: [...upvotedBy, userId],
        });
      }
    } else if (action === "flag") {
      const flaggedBy: string[] = data.flaggedBy || [];
      if (!flaggedBy.includes(userId)) {
        await postRef.update({
          flagCount: (data.flagCount || 0) + 1,
          flaggedBy: [...flaggedBy, userId],
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Forum PATCH error:", err);
    return NextResponse.json(
      { error: "Failed to update post." },
      { status: 500 }
    );
  }
}
