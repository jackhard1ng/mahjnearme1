import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/api-auth";

/**
 * POST /api/create-portal-session
 * Open the Stripe billing portal for the calling user's own Stripe customer.
 *
 * Auth: Authorization: Bearer <Firebase ID token>. The Stripe customer ID
 * is read from the user's Firestore record, NEVER from the request body —
 * otherwise anyone could open another subscriber's billing portal and
 * change/cancel their subscription.
 */
export async function POST(request: Request) {
  const authResult = await requireUser(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(authResult.uid).get();
    const stripeCustomerId = userDoc.data()?.stripeCustomerId;

    if (!stripeCustomerId) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.mahjnearme.com";

    const session = await getStripe().billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${baseUrl}/account`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Portal session error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
