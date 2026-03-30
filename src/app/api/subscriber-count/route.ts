import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

/**
 * GET /api/subscriber-count
 * Returns: { count, totalEntries }
 * - count: active paid subscribers (from Stripe)
 * - totalEntries: total giveaway entries (annual subs = 2, monthly = 1)
 */
export async function GET() {
  let subscriberCount = 0;
  let totalEntries = 0;

  try {
    const stripe = getStripe();
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const params: { status: "active"; limit: number; starting_after?: string; expand: string[] } = {
        status: "active",
        limit: 100,
        expand: ["data.items"],
      };
      if (startingAfter) params.starting_after = startingAfter;

      const subscriptions = await stripe.subscriptions.list(params);
      for (const sub of subscriptions.data) {
        subscriberCount++;
        const interval = sub.items.data[0]?.price?.recurring?.interval;
        totalEntries += interval === "year" ? 2 : 1;
      }
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
    totalEntries,
  });
}
