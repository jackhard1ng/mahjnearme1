import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";
import { requireUser } from "@/lib/api-auth";

/**
 * POST /api/apply-code
 * Apply a referral/promo code to the calling user's own subscription.
 * Replaces any existing coupon. Applied starting next billing cycle.
 *
 * Auth: Authorization: Bearer <Firebase ID token>. The user is identified
 * from the verified token, NOT the request body, so callers cannot apply
 * codes to other users' subscriptions.
 */
export async function POST(request: NextRequest) {
  const authResult = await requireUser(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.uid;

  try {
    const db = getAdminDb();
    const stripe = getStripe();
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().trim();

    // Get user
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const userData = userDoc.data()!;

    if (!userData.stripeCustomerId) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
    }

    // Validate the code exists (check organizers and users)
    let codeValid = false;
    let referrerUserId: string | null = null;

    // Check organizer referral codes
    const orgSnap = await db.collection("organizers")
      .where("referralCode", "==", cleanCode)
      .limit(1)
      .get();
    if (!orgSnap.empty) {
      codeValid = true;
      referrerUserId = (orgSnap.docs[0].data().userId as string) || null;
    }

    // Check user-level referral codes
    if (!codeValid) {
      const userSnap = await db.collection("users")
        .where("referralCode", "==", cleanCode)
        .limit(1)
        .get();
      if (!userSnap.empty) {
        codeValid = true;
        referrerUserId = userSnap.docs[0].id;
      }
    }

    if (!codeValid) {
      return NextResponse.json({ error: "Invalid code. Please check and try again." }, { status: 400 });
    }

    // Don't let someone use their own code
    if (referrerUserId === userId) {
      return NextResponse.json({ error: "You cannot use your own referral code." }, { status: 400 });
    }

    // Check if they already have this code applied
    if (userData.referredByCode === cleanCode) {
      return NextResponse.json({ error: "This code is already applied to your subscription." }, { status: 409 });
    }

    // Find their active subscription in Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: userData.stripeCustomerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
    }

    const subscription = subscriptions.data[0];

    // Apply the REFERRAL_15_OFF coupon to their subscription
    // This replaces any existing coupon and applies from next billing cycle
    await stripe.subscriptions.update(subscription.id, {
      discounts: [{ coupon: "REFERRAL_15_OFF" }],
    });

    // Track the referral in Firestore
    const now = new Date();
    const vestingDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days

    // Update user with referred-by info
    await db.collection("users").doc(userId).update({
      referredByCode: cleanCode,
      updatedAt: now.toISOString(),
    });

    // Create referral record if we have a referrer
    if (referrerUserId) {
      await db.collection("referrals").add({
        referralCode: cleanCode,
        contributorId: referrerUserId,
        subscriberId: userId,
        subscriberSignupDate: now.toISOString(),
        plan: subscription.items.data[0]?.price?.recurring?.interval === "year" ? "annual" : "monthly",
        status: "active",
        vestingDate: vestingDate.toISOString(),
        isVested: false,
        createdAt: now.toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "15% discount applied! It will take effect on your next billing cycle.",
    });
  } catch (err) {
    console.error("Apply code error:", err);
    return NextResponse.json({ error: "Failed to apply code" }, { status: 500 });
  }
}
