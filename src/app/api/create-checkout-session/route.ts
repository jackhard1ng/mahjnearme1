import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, PRICE_IDS } from "@/lib/stripe";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { plan, firebaseUid, email, referralCode } = await request.json();

    if (!plan || !["monthly", "annual"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!firebaseUid || !email) {
      return NextResponse.json({ error: "Missing user info" }, { status: 400 });
    }

    const priceId = plan === "monthly" ? PRICE_IDS.monthly : PRICE_IDS.annual;
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    // Validate referral code if provided
    let validatedReferralCode: string | null = null;
    if (referralCode) {
      try {
        const db = getAdminDb();
        const snap = await db.collection("users")
          .where("referralCode", "==", referralCode.toUpperCase())
          .where("isContributor", "==", true)
          .limit(1)
          .get();

        if (!snap.empty) {
          validatedReferralCode = referralCode.toUpperCase();
        }
      } catch {
        // Referral validation failed — proceed without it
      }
    }

    // Build Stripe checkout session options
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      customer_email: email,
      mode: "subscription" as const,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
      },
      allow_promotion_codes: !validatedReferralCode, // Don't allow promo codes if referral is applied
      success_url: `${baseUrl}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        firebaseUid,
        ...(validatedReferralCode ? { referralCode: validatedReferralCode } : {}),
      },
    };

    // If referral code is valid, apply the 15% discount via a coupon
    if (validatedReferralCode) {
      try {
        // Try to find or create the referral coupon
        const stripe = getStripe();
        let coupon;
        try {
          coupon = await stripe.coupons.retrieve("REFERRAL_15_OFF");
        } catch {
          coupon = await stripe.coupons.create({
            id: "REFERRAL_15_OFF",
            percent_off: 15,
            duration: "forever",
            name: "Referral 15% Off",
          });
        }
        sessionOptions.discounts = [{ coupon: coupon.id }];
      } catch {
        // If coupon creation fails, proceed without discount
      }
    }

    const session = await getStripe().checkout.sessions.create(sessionOptions);

    return NextResponse.json({ url: session.url, referralApplied: !!validatedReferralCode });
  } catch (error) {
    console.error("Checkout session error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
