import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

/**
 * POST /api/admin-sync-promoted
 * One-time (or periodic) admin endpoint that syncs promoted status on all
 * organizer listings based on whether the linked user has an active subscription.
 *
 * Protected by x-admin-key header (CRON_SECRET).
 */
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const adminKey = req.headers.get("x-admin-key");

  if (!cronSecret || adminKey !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();

  // 1. Get all organizers that have a linked userId
  const orgSnap = await db.collection("organizers").where("userId", "!=", "").get();

  let promoted = 0;
  let unpromoted = 0;
  let skipped = 0;

  for (const orgDoc of orgSnap.docs) {
    const orgData = orgDoc.data();
    const userId = orgData.userId;
    if (!userId) { skipped++; continue; }

    // 2. Check if the linked user is a subscriber
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) { skipped++; continue; }

    const userData = userDoc.data()!;
    const isActive =
      userData.accountType === "subscriber" ||
      userData.accountType === "admin" ||
      userData.subscriptionStatus === "active";

    // 3. Sync organizer doc: approved + active sub = verified + featured
    const orgUpdates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (isActive && !orgData.verified) orgUpdates.verified = true;
    if ((orgData.featured || false) !== isActive) orgUpdates.featured = isActive;
    if (Object.keys(orgUpdates).length > 1) {
      await orgDoc.ref.update(orgUpdates);
    }

    // 4. Update all listings for this organizer (match by ID and by name)
    const organizerName = orgData.organizerName as string || "";
    const updatedListingIds = new Set<string>();
    const batch = db.batch();

    const byIdSnap = await db
      .collection("listings")
      .where("organizerId", "==", orgDoc.id)
      .get();
    for (const listingDoc of byIdSnap.docs) {
      const current = listingDoc.data().promoted || false;
      if (current !== isActive) {
        batch.update(listingDoc.ref, { promoted: isActive, updatedAt: new Date().toISOString() });
        updatedListingIds.add(listingDoc.id);
        if (isActive) promoted++; else unpromoted++;
      }
    }

    if (organizerName) {
      const byNameSnap = await db
        .collection("listings")
        .where("organizerName", "==", organizerName)
        .get();
      for (const listingDoc of byNameSnap.docs) {
        if (updatedListingIds.has(listingDoc.id)) continue;
        const current = listingDoc.data().promoted || false;
        if (current !== isActive) {
          batch.update(listingDoc.ref, { promoted: isActive, updatedAt: new Date().toISOString() });
          updatedListingIds.add(listingDoc.id);
          if (isActive) promoted++; else unpromoted++;
        }
      }
    }

    if (updatedListingIds.size > 0) await batch.commit();
  }

  return NextResponse.json({
    success: true,
    organizersChecked: orgSnap.size,
    listingsPromoted: promoted,
    listingsUnpromoted: unpromoted,
    skipped,
  });
}
