import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

/**
 * GET /api/subscriber-count
 * Returns: { count, totalEntries }
 * - count: active paid subscribers (from Stripe)
 * - totalEntries: same as count (only paid subscribers enter the giveaway)
 */
export async function GET() {
  let subscriberCount = 0;

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

  return NextResponse.json({
    count: subscriberCount,
    totalEntries: subscriberCount,
  });
}
