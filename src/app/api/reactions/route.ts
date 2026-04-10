import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/api-auth";

// GET: Get reaction counts and user's reactions for a game
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");
    const userId = searchParams.get("userId");

    if (!gameId) {
      return NextResponse.json({ error: "gameId required" }, { status: 400 });
    }

    const snap = await db.collection("listingReactions")
      .where("gameId", "==", gameId)
      .get();

    const reactions = snap.docs.map((doc) => doc.data());

    const counts = {
      going: reactions.filter((r) => r.reactionType === "going").length,
      been_here: reactions.filter((r) => r.reactionType === "been_here").length,
      heads_up: reactions.filter((r) => r.reactionType === "heads_up").length,
    };

    let userReactions: string[] = [];
    if (userId) {
      userReactions = reactions
        .filter((r) => r.userId === userId)
        .map((r) => r.reactionType as string);
    }

    const headsUpNotes = reactions
      .filter((r) => r.reactionType === "heads_up" && r.note)
      .map((r) => r.note as string);

    return NextResponse.json({ counts, userReactions, headsUpNotes });
  } catch (err) {
    console.error("Reactions GET error:", err);
    return NextResponse.json({ error: "Failed to load reactions" }, { status: 500 });
  }
}

// POST: Add or toggle a reaction
export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb();
    const { gameId, userId, reactionType, note } = await request.json();

    if (!gameId || !userId || !reactionType) {
      return NextResponse.json({ error: "gameId, userId, and reactionType required" }, { status: 400 });
    }

    // Verify the caller owns this userId
    const denied = await requireUser(request, userId);
    if (denied) return denied;

    const validTypes = ["going", "been_here", "heads_up"];
    if (!validTypes.includes(reactionType)) {
      return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
    }

    // Check if user already has this reaction
    const existing = await db.collection("listingReactions")
      .where("gameId", "==", gameId)
      .where("userId", "==", userId)
      .where("reactionType", "==", reactionType)
      .limit(1)
      .get();

    if (!existing.empty) {
      // Toggle off: remove the reaction
      await existing.docs[0].ref.delete();
      return NextResponse.json({ action: "removed" });
    }

    // Add the reaction
    const now = new Date().toISOString();
    await db.collection("listingReactions").add({
      gameId,
      userId,
      reactionType,
      note: reactionType === "heads_up" ? (note || null) : null,
      createdAt: now,
    });

    return NextResponse.json({ action: "added" });
  } catch (err) {
    console.error("Reactions POST error:", err);
    return NextResponse.json({ error: "Failed to save reaction" }, { status: 500 });
  }
}
