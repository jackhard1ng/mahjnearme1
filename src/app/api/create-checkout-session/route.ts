import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, PRICE_IDS } from "@/lib/stripe";
import { getAdminDb } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const { limited } = rateLimit(request, { key: "checkout", limit: 5, windowSeconds: 60 });
  if (limited) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const { plan, firebaseUid, email, referralCode } = await request.json();

    if (!plan || !["monthly", "annual"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!firebaseUid || !email) {
      return NextResponse.json({ error: "Missing user info" }, { status: 400 });
    }

    const db = getAdminDb();
    const stripe = getStripe();

    // ---------------------------------------------------------------------
    // Preflight: refuse to create a second subscription for a user who
    // already has an active one. Without this check a user who lands on
    // /pricing while already subscribed (e.g. because their userProfile
    // hadn't finished loading on first paint, so the "Your Current Plan"
    // button was briefly rendered as an active "Subscribe Monthly") can
    // silently create a duplicate Stripe subscription and get charged twice.
    // ---------------------------------------------------------------------

    // Layer 1 — Firestore. Fast and cheap; catches the common case.
    let storedStripeCustomerId: string | null = null;
    try {
      const userDoc = await db.collection("users").doc(firebaseUid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        storedStripeCustomerId =
          typeof userData?.stripeCustomerId === "string" ? userData.stripeCustomerId : null;

        const activeStatuses = new Set(["active", "trialing", "past_due"]);
        const alreadyActive =
          (userData?.accountType === "subscriber" || userData?.accountType === "admin") &&
          typeof userData?.subscriptionStatus === "string" &&
          activeStatuses.has(userData.subscriptionStatus);

        if (alreadyActive) {
          return NextResponse.json(
            {
              error: "You already have an active subscription. Manage it from your account page.",
              alreadySubscribed: true,
            },
            { status: 409 }
          );
        }
      }
    } catch (err) {
      // Don't fail the whole request on a Firestore blip — fall through to
      // the Stripe check below, which is the real source of truth.
      console.error("[checkout] Firestore preflight failed:", err);
    }

    // Layer 2 — Stripe. Authoritative source of billing truth, in case
    // Firestore is stale (e.g. webhook hasn't landed yet). We check both the
    // stored stripeCustomerId (if any) and every customer matching this email
    // so we catch historical customers too.
    try {
      const customerIdsToCheck = new Set<string>();
      if (storedStripeCustomerId) customerIdsToCheck.add(storedStripeCustomerId);

      const customers = await stripe.customers.list({ email, limit: 10 });
      for (const customer of customers.data) {
        customerIdsToCheck.add(customer.id);
      }

      for (const customerId of customerIdsToCheck) {
        const subs = await stripe.subscriptions.list({
          customer: customerId,
          status: "active",
          limit: 1,
        });
        if (subs.data.length > 0) {
          return NextResponse.json(
            {
              error: "You already have an active subscription. Manage it from your account page.",
              alreadySubscribed: true,
            },
            { status: 409 }
          );
        }
      }
    } catch (err) {
      // Stripe is down or slow — log and proceed. Refusing all new signups
      // on a transient Stripe error is worse than a very rare duplicate
      // charge (which can be refunded), and the Firestore check above will
      // have caught the normal case.
      console.error("[checkout] Stripe preflight failed:", err);
    }

    const priceId = plan === "monthly" ? PRICE_IDS.monthly : PRICE_IDS.annual;
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.mahjnearme.com";

    // Validate referral code if provided (check both old contributors and new organizer codes)
    let validatedReferralCode: string | null = null;
    if (referralCode) {
      try {
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
      allow_promotion_codes: true, // Always show Stripe's code field (organizer promo codes work here)
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

    const session = await stripe.checkout.sessions.create(sessionOptions);

    return NextResponse.json({ url: session.url, referralApplied: !!validatedReferralCode });
  } catch (error) {
    console.error("Checkout session error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
