import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import METRO_REGIONS from "@/lib/metro-regions";

/**
 * POST: Seed general discussion posts for all metro boards.
 * Creates a pinned "[City] General Discussion" post for each metro
 * that doesn't already have one.
 *
 * This is an admin-only endpoint. Call once to seed, safe to re-run.
 */
export async function POST() {
  try {
    const db = getAdminDb();
    let created = 0;
    let skipped = 0;

    for (const metro of METRO_REGIONS) {
      // Check if a general discussion post already exists for this metro
      const existingSnap = await db
        .collection("forumPosts")
        .where("metroSlug", "==", metro.abbreviation)
        .where("isSticky", "==", true)
        .where("isGeneralDiscussion", "==", true)
        .limit(1)
        .get();

      if (!existingSnap.empty) {
        skipped++;
        continue;
      }

      // Create pinned general discussion post
      await db.collection("forumPosts").add({
        postType: "full",
        metroSlug: metro.abbreviation,
        authorId: "system",
        authorName: "MahjNearMe",
        authorPhotoURL: null,
        authorIsContributor: false,
        title: `${metro.metro} General Discussion`,
        body: `Talk about anything mahjong-related in the ${metro.metro} area. New to the scene? Say hi. Looking for a game? Ask here. Have news to share? This is the place.`,
        isSticky: true,
        isGeneralDiscussion: true,
        isPinned: true,
        upvotes: 0,
        upvotedBy: [],
        flagCount: 0,
        flaggedBy: [],
        replyCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      created++;
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      total: METRO_REGIONS.length,
    });
  } catch (err) {
    console.error("Forum seed error:", err);
    return NextResponse.json(
      { error: "Failed to seed forum posts" },
      { status: 500 }
    );
  }
}
