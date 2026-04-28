import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";
import { requireUser } from "@/lib/api-auth";

/**
 * POST /api/organizer-referral - Create or update a referral code for a paid organizer
 * GET /api/organizer-referral?userId=xxx - Get referral stats for an organizer
 * PUT /api/organizer-referral - Request a payout
 */

// Commission rates by tier
const PAID_MONTHLY_COMMISSION = 1.50;
const PAID_ANNUAL_COMMISSION = 7.50;
const FREE_MONTHLY_COMMISSION = 1.00;
const FREE_ANNUAL_COMMISSION = 5.00;
const PAYOUT_THRESHOLD = 10;
const VESTING_DAYS = 60;
const COUPON_ID = "REFERRAL_15_OFF";

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

    // Validate code format: 3-20 chars, alphanumeric only
    const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (cleanCode.length < 3 || cleanCode.length > 20) {
      return NextResponse.json({ error: "Code must be 3-20 characters, letters and numbers only" }, { status: 400 });
    }

    // Check user is a paid organizer
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const userData = userDoc.data()!;
    if (!userData.isOrganizer) {
      return NextResponse.json({ error: "Must be an organizer" }, { status: 403 });
    }

    // Check code isn't already taken by another organizer
    const existingCode = await db.collection("organizers")
      .where("referralCode", "==", cleanCode)
      .limit(1)
      .get();
    if (!existingCode.empty) {
      const existingOrg = existingCode.docs[0].data();
      if (existingOrg.userId !== userId) {
        return NextResponse.json({ error: "This code is already taken. Try another one." }, { status: 409 });
      }
    }

    // Also check the old user-level referral codes
    const existingUserCode = await db.collection("users")
      .where("referralCode", "==", cleanCode)
      .limit(1)
      .get();
    if (!existingUserCode.empty && existingUserCode.docs[0].id !== userId) {
      return NextResponse.json({ error: "This code is already taken. Try another one." }, { status: 409 });
    }

    // Create Stripe promotion code linked to the referral coupon
    let stripePromoId: string | null = null;
    try {
      const promo = await stripe.promotionCodes.create({
        promotion: { coupon: COUPON_ID, type: "coupon" },
        code: cleanCode,
        active: true,
        metadata: {
          organizerUserId: userId,
          type: "organizer_referral",
        },
      });
      stripePromoId = promo.id;
    } catch (err: unknown) {
      const stripeErr = err as { code?: string; message?: string };
      if (stripeErr.code === "resource_already_exists") {
        // Code already exists in Stripe, that's fine if it's ours
        const existing = await stripe.promotionCodes.list({ code: cleanCode, limit: 1 });
        if (existing.data.length > 0) {
          stripePromoId = existing.data[0].id;
        }
      } else {
        return NextResponse.json({ error: `Failed to create code: ${stripeErr.message || "Unknown error"}` }, { status: 500 });
      }
    }

    // Save on organizer profile
    const orgProfileId = userData.organizerProfileId;
    if (orgProfileId) {
      await db.collection("organizers").doc(orgProfileId).update({
        referralCode: cleanCode,
        stripePromoId: stripePromoId,
        updatedAt: new Date().toISOString(),
      });
    }

    // Also save on user doc for backwards compat
    await db.collection("users").doc(userId).update({
      referralCode: cleanCode,
      referralLink: `${process.env.NEXT_PUBLIC_URL || "https://www.mahjnearme.com"}/pricing?ref=${cleanCode}`,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      code: cleanCode,
      shareLink: `${process.env.NEXT_PUBLIC_URL || "https://www.mahjnearme.com"}/pricing?ref=${cleanCode}`,
      stripePromoId,
    });
  } catch (err) {
    console.error("Organizer referral POST error:", err);
    return NextResponse.json({ error: "Failed to create referral code" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Allow GET without auth ONLY when called server-to-server from PUT
  // (which validates the requester first). External GET callers must
  // authenticate so they can't enumerate other users' referral stats.
  const internalCall = request.headers.get("x-internal-referral") === "1";
  let userId: string | null;
  if (internalCall) {
    userId = new URL(request.url).searchParams.get("userId");
  } else {
    const authResult = await requireUser(request);
    if (authResult instanceof NextResponse) return authResult;
    userId = authResult.uid;
  }

  try {
    const db = getAdminDb();

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Get user data
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const userData = userDoc.data()!;
    const referralCode = userData.referralCode;
    const isPaid = userData.accountType === "subscriber" || userData.accountType === "admin" || userData.subscriptionStatus === "active";
    const monthlyRate = isPaid ? PAID_MONTHLY_COMMISSION : FREE_MONTHLY_COMMISSION;
    const annualRate = isPaid ? PAID_ANNUAL_COMMISSION : FREE_ANNUAL_COMMISSION;

    if (!referralCode) {
      return NextResponse.json({
        hasCode: false,
        code: null,
        shareLink: null,
        referrals: [],
        activeCount: 0,
        monthlyEarnings: 0,
        totalEarned: 0,
        pendingPayout: 0,
        canRequestPayout: false,
      });
    }

    // Get all referrals for this code
    const referralsSnap = await db.collection("referrals")
      .where("referralCode", "==", referralCode)
      .get();

    const now = new Date();
    const referrals = referralsSnap.docs.map((doc) => {
      const d = doc.data();
      const vestingDate = new Date(d.vestingDate);
      const isVested = now >= vestingDate;
      return {
        id: doc.id,
        plan: d.plan,
        status: d.status,
        isVested,
        subscriberSignupDate: d.subscriberSignupDate || d.createdAt,
      };
    });

    const activeReferrals = referrals.filter((r) => r.status === "active");
    const vestedActive = activeReferrals.filter((r) => r.isVested);

    // Calculate earnings
    let monthlyEarnings = 0;
    for (const r of vestedActive) {
      if (r.plan === "monthly") {
        monthlyEarnings += monthlyRate;
      } else if (r.plan === "annual") {
        monthlyEarnings += annualRate / 12;
      }
    }

    // Get past payouts
    const payoutsSnap = await db.collection("commissionPayouts")
      .where("contributorId", "==", userId)
      .get();
    const totalPaid = payoutsSnap.docs.reduce((sum, doc) => {
      const d = doc.data();
      return d.status === "paid" ? sum + (d.amount || 0) : sum;
    }, 0);

    // Calculate total earned (all time)
    let totalEarned = 0;
    for (const r of referrals.filter((r) => r.isVested)) {
      if (r.plan === "monthly") {
        // Monthly earnings since signup
        const signup = new Date(r.subscriberSignupDate);
        const months = Math.max(1, Math.floor((now.getTime() - signup.getTime()) / (30 * 24 * 60 * 60 * 1000)));
        totalEarned += r.status === "active" ? months * monthlyRate : monthlyRate;
      } else {
        totalEarned += annualRate;
      }
    }

    const pendingPayout = Math.round((totalEarned - totalPaid) * 100) / 100;

    return NextResponse.json({
      hasCode: true,
      code: referralCode,
      shareLink: `${process.env.NEXT_PUBLIC_URL || "https://www.mahjnearme.com"}/pricing?ref=${referralCode}`,
      referrals: referrals.map((r) => ({
        plan: r.plan,
        status: r.status,
        isVested: r.isVested,
        signupDate: r.subscriberSignupDate,
      })),
      activeCount: activeReferrals.length,
      vestedCount: vestedActive.length,
      monthlyEarnings: Math.round(monthlyEarnings * 100) / 100,
      totalEarned: Math.round(totalEarned * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      pendingPayout,
      canRequestPayout: pendingPayout >= PAYOUT_THRESHOLD,
      payoutThreshold: PAYOUT_THRESHOLD,
      isPaid,
      monthlyRate,
      annualRate,
    });
  } catch (err) {
    console.error("Organizer referral GET error:", err);
    return NextResponse.json({ error: "Failed to load referral data" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await requireUser(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.uid;

  try {
    const db = getAdminDb();

    // Verify they have enough for payout — pass internal header so the
    // GET handler trusts the userId we already verified.
    const statsRes = await GET(new NextRequest(
      new URL(`/api/organizer-referral?userId=${userId}`, request.url),
      { headers: { "x-internal-referral": "1" } }
    ));
    const stats = await statsRes.json();

    if (!stats.canRequestPayout) {
      return NextResponse.json({
        error: `Minimum payout is $${PAYOUT_THRESHOLD}. Current balance: $${stats.pendingPayout?.toFixed(2)}`
      }, { status: 400 });
    }

    // Create payout request
    const now = new Date().toISOString();
    await db.collection("commissionPayouts").add({
      contributorId: userId,
      amount: stats.pendingPayout,
      referralCount: stats.vestedCount,
      period: new Date().toISOString().slice(0, 7),
      status: "pending",
      paidAt: null,
      createdAt: now,
    });

    // Notify admin
    try {
      const { notifyAdmin } = await import("@/lib/admin-notify");
      const userDoc = await db.collection("users").doc(userId).get();
      const userName = userDoc.data()?.displayName || userDoc.data()?.email || userId;
      notifyAdmin(
        `[Payout Request] ${userName} requested $${stats.pendingPayout.toFixed(2)}`,
        `Organizer: ${userName}\nReferral code: ${stats.code}\nActive referrals: ${stats.activeCount}\nVested: ${stats.vestedCount}\nAmount: $${stats.pendingPayout.toFixed(2)}\n\nPlease process this payout.`
      ).catch(() => {});
    } catch { /* ok */ }

    return NextResponse.json({ success: true, amount: stats.pendingPayout });
  } catch (err) {
    console.error("Organizer referral PUT error:", err);
    return NextResponse.json({ error: "Failed to request payout" }, { status: 500 });
  }
}
