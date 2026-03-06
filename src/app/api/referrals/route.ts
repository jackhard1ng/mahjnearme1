import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { MONTHLY_REFERRAL_COMMISSION, ANNUAL_REFERRAL_COMMISSION } from "@/lib/constants";

// GET: Fetch referral dashboard data for a contributor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contributorId = searchParams.get("contributorId");
    const adminView = searchParams.get("admin") === "true";

    const db = getAdminDb();

    if (adminView) {
      // Admin view: all contributors with referral stats
      const contributorsSnap = await db.collection("users")
        .where("isContributor", "==", true)
        .get();

      const contributors = [];
      for (const doc of contributorsSnap.docs) {
        const data = doc.data();
        const referralsSnap = await db.collection("referrals")
          .where("contributorId", "==", doc.id)
          .get();

        const activeReferrals = referralsSnap.docs.filter(
          (r) => r.data().status === "active"
        );
        const totalCommission = activeReferrals.reduce((sum, r) => {
          const ref = r.data();
          if (!ref.isVested) return sum;
          return sum + (ref.plan === "monthly" ? MONTHLY_REFERRAL_COMMISSION : ANNUAL_REFERRAL_COMMISSION);
        }, 0);

        contributors.push({
          id: doc.id,
          name: data.displayName || data.email,
          referralCode: data.referralCode,
          metro: data.contributorMetro,
          activeReferrals: activeReferrals.length,
          totalReferrals: referralsSnap.size,
          commissionOwed: totalCommission,
          lastActivityDate: data.lastActivityDate,
        });
      }

      // Totals
      const allReferralsSnap = await db.collection("referrals").get();
      const totalCommissionsOwed = allReferralsSnap.docs
        .filter((r) => r.data().status === "active" && r.data().isVested)
        .reduce((sum, r) => {
          const ref = r.data();
          return sum + (ref.plan === "monthly" ? MONTHLY_REFERRAL_COMMISSION : ANNUAL_REFERRAL_COMMISSION);
        }, 0);

      return NextResponse.json({
        contributors,
        totalCommissionsOwed,
        totalReferrals: allReferralsSnap.size,
      });
    }

    // Contributor dashboard view
    if (!contributorId) {
      return NextResponse.json({ error: "Missing contributorId" }, { status: 400 });
    }

    const referralsSnap = await db.collection("referrals")
      .where("contributorId", "==", contributorId)
      .get();

    const referrals = referralsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const activeReferrals = referrals.filter((r: Record<string, unknown>) => r.status === "active");
    const now = new Date();

    const monthlyEarnings = activeReferrals
      .filter((r: Record<string, unknown>) => r.isVested)
      .reduce((sum: number, r: Record<string, unknown>) => {
        return sum + (r.plan === "monthly" ? MONTHLY_REFERRAL_COMMISSION : ANNUAL_REFERRAL_COMMISSION / 12);
      }, 0);

    const pendingEarnings = activeReferrals
      .filter((r: Record<string, unknown>) => !r.isVested)
      .reduce((sum: number, r: Record<string, unknown>) => {
        return sum + (r.plan === "monthly" ? MONTHLY_REFERRAL_COMMISSION : ANNUAL_REFERRAL_COMMISSION / 12);
      }, 0);

    // Payout history
    const payoutsSnap = await db.collection("commissionPayouts")
      .where("contributorId", "==", contributorId)
      .orderBy("createdAt", "desc")
      .limit(12)
      .get();

    const payouts = payoutsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const lifetimeEarnings = payouts
      .filter((p: Record<string, unknown>) => p.status === "paid")
      .reduce((sum: number, p: Record<string, unknown>) => sum + (p.amount as number), 0);

    // Get user's referral code
    const userDoc = await db.collection("users").doc(contributorId).get();
    const userData = userDoc.data();

    return NextResponse.json({
      referralCode: userData?.referralCode || null,
      referralLink: userData?.referralLink || null,
      activeReferralsCount: activeReferrals.length,
      monthlyEarnings,
      pendingEarnings,
      lifetimeEarnings: lifetimeEarnings + monthlyEarnings,
      payouts,
      // Anonymized referral list: signup date and status only
      referralList: referrals.map((r: Record<string, unknown>) => ({
        signupDate: r.subscriberSignupDate,
        status: r.status,
        plan: r.plan,
        isVested: r.isVested,
      })),
    });
  } catch (err) {
    console.error("Referral API error:", err);
    return NextResponse.json({ error: "Failed to fetch referral data" }, { status: 500 });
  }
}

// POST: Validate a referral code
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ valid: false });
    }

    const db = getAdminDb();
    const snap = await db.collection("users")
      .where("referralCode", "==", code.toUpperCase())
      .where("isContributor", "==", true)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ valid: false });
    }

    const data = snap.docs[0].data();
    return NextResponse.json({
      valid: true,
      contributorName: data.displayName || "Community Contributor",
    });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
