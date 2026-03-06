import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

// GET: Return the count of active paying subscribers from Stripe
export async function GET() {
  try {
    const stripe = getStripe();

    // Count active subscriptions only (not trialing, canceled, etc.)
    let count = 0;
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const params: { status: "active"; limit: number; starting_after?: string } = {
        status: "active",
        limit: 100,
      };
      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      const subscriptions = await stripe.subscriptions.list(params);
      count += subscriptions.data.length;
      hasMore = subscriptions.has_more;

      if (subscriptions.data.length > 0) {
        startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
      }
    }

    return NextResponse.json({ count });
  } catch (err) {
    console.error("Subscriber count error:", err);
    // Return 0 on error rather than failing - honest count
    return NextResponse.json({ count: 0 });
  }
}
