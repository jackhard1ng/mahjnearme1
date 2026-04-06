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

    // 3. Ensure organizer doc is marked verified
    if (isActive && !orgData.verified) {
      await orgDoc.ref.update({ verified: true, updatedAt: new Date().toISOString() });
    }

    // 4. Update all listings for this organizer
    const listingsSnap = await db
      .collection("listings")
      .where("organizerId", "==", orgDoc.id)
      .get();

    const batch = db.batch();
    let changed = false;
    for (const listingDoc of listingsSnap.docs) {
      const current = listingDoc.data().promoted || false;
      if (current !== isActive) {
        batch.update(listingDoc.ref, { promoted: isActive, updatedAt: new Date().toISOString() });
        changed = true;
        if (isActive) promoted++; else unpromoted++;
      }
    }
    if (changed) await batch.commit();
  }

  return NextResponse.json({
    success: true,
    organizersChecked: orgSnap.size,
    listingsPromoted: promoted,
    listingsUnpromoted: unpromoted,
    skipped,
  });
}
