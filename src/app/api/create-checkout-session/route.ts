import { NextResponse } from "next/server";
import { getStripe, PRICE_IDS } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const { plan, firebaseUid, email } = await request.json();

    if (!plan || !["monthly", "annual"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!firebaseUid || !email) {
      return NextResponse.json({ error: "Missing user info" }, { status: 400 });
    }

    const priceId = plan === "monthly" ? PRICE_IDS.monthly : PRICE_IDS.annual;
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    const session = await getStripe().checkout.sessions.create({
      customer_email: email,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
      },
      allow_promotion_codes: true,
      success_url: `${baseUrl}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        firebaseUid,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout session error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
