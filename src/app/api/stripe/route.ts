import { NextResponse } from "next/server";

// Stripe Checkout session creation
export async function POST(request: Request) {
  try {
    const { priceId, userId } = await request.json();

    // In production, create a Stripe Checkout session:
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const session = await stripe.checkout.sessions.create({
    //   mode: 'subscription',
    //   payment_method_types: ['card'],
    //   line_items: [{ price: priceId, quantity: 1 }],
    //   success_url: `${process.env.NEXT_PUBLIC_URL}/account?session_id={CHECKOUT_SESSION_ID}`,
    //   cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
    //   client_reference_id: userId,
    //   subscription_data: { trial_period_days: 14 },
    // });

    return NextResponse.json({
      message: "Stripe integration ready. Add STRIPE_SECRET_KEY to enable.",
      // url: session.url,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
