import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

/**
 * GET /api/subscriber-count
 * Returns: { count, totalEntries }
 * - count: active paid subscribers
 * - totalEntries: total giveaway entries including loyalty bonuses,
 *   free entries, and mail-in entries
 *
 * Uses Firestore as source of truth (same as admin giveaway view).
 */
export async function GET() {
  try {
    const db = getAdminDb();
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Count active subscribers and their entries
    const usersSnap = await db.collection("users").get();
    let subscriberCount = 0;
    let totalEntries = 0;

    // Check exclusions
    const exclusionsSnap = await db.collection("giveawayExclusions")
      .where("month", "==", currentMonth)
      .get();
    const excludedUserIds = new Set(exclusionsSnap.docs.map((d) => d.data().userId));

    for (const doc of usersSnap.docs) {
      const data = doc.data();
      const isActive = data.subscriptionStatus === "active" && (
        data.accountType === "subscriber" ||
        data.accountType === "contributor" ||
        data.accountType === "admin"
      );

      if (isActive) {
        subscriberCount++;
        if (excludedUserIds.has(doc.id)) continue;

        let entries = data.plan === "annual" ? 2 : 1;
        // Loyalty bonus
        if (data.subscribedDate) {
          const subDate = new Date(data.subscribedDate);
          const monthsSubscribed = Math.floor((now.getTime() - subDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
          const loyaltyBonus = Math.min(Math.floor(monthsSubscribed / 6), 6);
          entries += loyaltyBonus;
        }
        totalEntries += entries;
      }
    }

    // Add free entries for current month
    const freeSnap = await db.collection("giveawayFreeEntries")
      .where("month", "==", currentMonth)
      .get();
    totalEntries += freeSnap.size;

    // Add mail-in entries for current month
    const mailSnap = await db.collection("giveawayManualEntries")
      .where("month", "==", currentMonth)
      .get();
    totalEntries += mailSnap.size;

    const res = NextResponse.json({ count: subscriberCount, totalEntries });
    res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return res;
  } catch (err) {
    console.error("Subscriber count error:", err);
    return NextResponse.json({ count: 0, totalEntries: 0 });
  }
}
