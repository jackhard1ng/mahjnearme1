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
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.mahjnearme.com";

    // Validate referral code if provided (check both old contributors and new organizer codes)
    let validatedReferralCode: string | null = null;
    if (referralCode) {
      try {
        const db = getAdminDb();
        const code = referralCode.toUpperCase();

        // Check old contributor codes
        const contribSnap = await db.collection("users")
          .where("referralCode", "==", code)
          .where("isContributor", "==", true)
          .limit(1)
          .get();

        if (!contribSnap.empty) {
          validatedReferralCode = code;
        } else {
          // Check new organizer referral codes
          const orgSnap = await db.collection("organizers")
            .where("referralCode", "==", code)
            .limit(1)
            .get();

          if (!orgSnap.empty) {
            validatedReferralCode = code;
          } else {
            // Also check user-level referral codes for organizers
            const userSnap = await db.collection("users")
              .where("referralCode", "==", code)
              .where("isOrganizer", "==", true)
              .limit(1)
              .get();

            if (!userSnap.empty) {
              validatedReferralCode = code;
            }
          }
        }
      } catch {
        // Referral validation failed, proceed without it
      }
    }

    // Build Stripe checkout session options
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      customer_email: email,
      mode: "subscription" as const,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {},
      allow_promotion_codes: !validatedReferralCode, // Cannot combine with discounts array
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
