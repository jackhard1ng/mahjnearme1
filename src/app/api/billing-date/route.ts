import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

/**
 * GET /api/billing-date?customerId=cus_xxx
 * Returns the next billing date from Stripe for a customer.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const customerId = url.searchParams.get("customerId");

  if (!customerId) {
    return NextResponse.json({ nextBillingDate: null });
  }

  try {
    const stripe = getStripe();
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      const sub = subscriptions.data[0] as unknown as { current_period_end: number };
      const periodEnd = sub.current_period_end;
      return NextResponse.json({
        nextBillingDate: new Date(periodEnd * 1000).toISOString(),
      });
    }

    return NextResponse.json({ nextBillingDate: null });
  } catch (err) {
    console.error("[Billing Date] Error:", err);
    return NextResponse.json({ nextBillingDate: null });
  }
}
