import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAdminDb } from "@/lib/firebase-admin";

/**
 * GET /api/subscriber-count
 * Returns: { count, freeEntries, totalEntries }
 * - count: active paid subscribers (from Stripe)
 * - freeEntries: free giveaway entries this month (from Firestore)
 * - totalEntries: count + freeEntries
 */
export async function GET() {
  let subscriberCount = 0;
  let freeEntryCount = 0;

  // Count active subscriptions from Stripe
  try {
    const stripe = getStripe();
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const params: { status: "active"; limit: number; starting_after?: string } = {
        status: "active",
        limit: 100,
      };
      if (startingAfter) params.starting_after = startingAfter;

      const subscriptions = await stripe.subscriptions.list(params);
      subscriberCount += subscriptions.data.length;
      hasMore = subscriptions.has_more;
      if (subscriptions.data.length > 0) {
        startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
      }
    }
  } catch (err) {
    console.error("Stripe subscriber count error:", err);
  }

  // Count free entries for current month from Firestore
  try {
    const db = getAdminDb();
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const snap = await db.collection("giveawayFreeEntries")
      .where("month", "==", currentMonth)
      .get();
    freeEntryCount = snap.size;
  } catch (err) {
    console.error("Free entry count error:", err);
  }

  return NextResponse.json({
    count: subscriberCount,
    freeEntries: freeEntryCount,
    totalEntries: subscriberCount + freeEntryCount,
  });
}
