// This route has been replaced by:
// - /api/create-checkout-session: creates Stripe Checkout sessions
// - /api/create-portal-session: creates Stripe Customer Portal sessions
// - /api/webhooks/stripe: handles Stripe webhook events
//
// Keeping this file to avoid 404s during transition.
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Use /api/create-checkout-session instead" },
    { status: 410 }
  );
}
