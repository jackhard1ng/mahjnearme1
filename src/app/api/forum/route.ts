import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

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
    const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ posts });
  } catch (err) {
    console.error("Forum GET error:", err);
    return NextResponse.json({ posts: [], error: "Failed to load posts" });
  }
}

// POST: Create a new forum post
export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb();
    const body = await request.json();
    const {
      metroSlug,
      authorId,
      authorName,
      authorPhotoURL,
      authorIsContributor,
      title,
      body: postBody,
      linkedGameId,
    } = body;

    if (!authorId || !title || !postBody) {
      return NextResponse.json(
        { error: "Title and body are required." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const postData = {
      metroSlug: metroSlug || null,
      authorId,
      authorName: authorName || "Anonymous",
      authorPhotoURL: authorPhotoURL || null,
      authorIsContributor: authorIsContributor || false,
      title,
      body: postBody,
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
    if (authorIsContributor && metroSlug) {
      const userDoc = await db.collection("users").doc(authorId).get();
      if (userDoc.exists && userDoc.data()?.contributorMetro === metroSlug) {
        await db.collection("users").doc(authorId).set(
          { lastActivityDate: now, updatedAt: now },
          { merge: true }
        );
      }
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
  try {
    const db = getAdminDb();
    const body = await request.json();
    const {
      postId,
      authorId,
      authorName,
      authorPhotoURL,
      authorIsContributor,
      body: replyBody,
    } = body;

    if (!postId || !authorId || !replyBody) {
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
  try {
    const db = getAdminDb();
    const body = await request.json();
    const { postId, userId, action } = body;

    if (!postId || !userId || !action) {
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
