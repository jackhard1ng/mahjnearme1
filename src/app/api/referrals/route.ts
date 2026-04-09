import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { MONTHLY_REFERRAL_COMMISSION, ANNUAL_REFERRAL_COMMISSION } from "@/lib/constants";
import { requireAdmin } from "@/lib/api-auth";

// GET: Fetch referral dashboard data for a contributor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contributorId = searchParams.get("contributorId");
    const adminView = searchParams.get("admin") === "true";

    const db = getAdminDb();

    if (adminView) {
      const denied = requireAdmin(request);
      if (denied) return denied;

      // 1. Legacy contributors (isContributor=true)
      const contributorsSnap = await db.collection("users")
        .where("isContributor", "==", true)
        .get();

      // 2. Organizers with referral codes
      const organizersSnap = await db.collection("organizers")
        .where("referralCode", "!=", null)
        .get();

      // Build a map of userId → organizer data
      const orgByUserId: Record<string, { organizerName: string; referralCode: string; stripePromoId?: string }> = {};
      for (const doc of organizersSnap.docs) {
        const d = doc.data();
        if (d.referralCode && d.userId) {
          orgByUserId[d.userId as string] = {
            organizerName: (d.organizerName as string) || "",
            referralCode: d.referralCode as string,
            stripePromoId: d.stripePromoId as string | undefined,
          };
        }
      }

      // Collect all unique user IDs (contributors + organizers)
      const allUserIds = new Set<string>([
        ...contributorsSnap.docs.map((d) => d.id),
        ...Object.keys(orgByUserId),
      ]);

      const contributors = [];
      for (const userId of allUserIds) {
        // Get user doc (may already be loaded for contributors)
        const userDoc = contributorsSnap.docs.find((d) => d.id === userId)
          || await db.collection("users").doc(userId).get();
        const data = (userDoc as FirebaseFirestore.DocumentSnapshot).data?.() || {};

        const orgData = orgByUserId[userId] || null;
        const referralCode = orgData?.referralCode || (data.referralCode as string) || null;
        if (!referralCode) continue;

        const referralsSnap = await db.collection("referrals")
          .where("referralCode", "==", referralCode)
          .get();

        const now = new Date();
        const activeReferrals = referralsSnap.docs.filter((r) => r.data().status === "active");
        const vestedActive = activeReferrals.filter((r) => {
          const d = r.data();
          return d.isVested || (d.vestingDate && new Date(d.vestingDate as string) <= now);
        });

        const isPaid = data.accountType === "subscriber" || data.subscriptionStatus === "active" || data.accountType === "admin";
        const monthlyRate = isPaid ? 1.50 : 1.00;
        const annualRate = isPaid ? 7.50 : 5.00;

        let monthlyEarnings = 0;
        for (const r of vestedActive) {
          const rd = r.data();
          monthlyEarnings += rd.plan === "monthly" ? monthlyRate : annualRate / 12;
        }

        // Total paid out
        const payoutsSnap = await db.collection("commissionPayouts")
          .where("contributorId", "==", userId)
          .get();
        const totalPaid = payoutsSnap.docs
          .filter((d) => d.data().status === "paid")
          .reduce((sum, d) => sum + ((d.data().amount as number) || 0), 0);

        contributors.push({
          id: userId,
          name: orgData?.organizerName || (data.displayName as string) || (data.email as string) || userId,
          email: (data.email as string) || "",
          referralCode,
          shareLink: `${process.env.NEXT_PUBLIC_URL || "https://www.mahjnearme.com"}/pricing?ref=${referralCode}`,
          metro: (data.contributorMetro as string) || "",
          isOrganizer: !!(data.isOrganizer),
          isContributor: !!(data.isContributor),
          isPaid,
          tier: isPaid ? "paid" : "free",
          activeReferrals: activeReferrals.length,
          vestedReferrals: vestedActive.length,
          totalReferrals: referralsSnap.size,
          monthlyEarnings: Math.round(monthlyEarnings * 100) / 100,
          commissionOwed: Math.round(monthlyEarnings * 100) / 100,
          totalPaid: Math.round(totalPaid * 100) / 100,
          pendingPayout: Math.round((monthlyEarnings - totalPaid) * 100) / 100,
          lastActivityDate: (data.lastActivityDate as string) || "",
          codeCreatedAt: (data.updatedAt as string) || "",
        });
      }

      contributors.sort((a, b) => b.totalReferrals - a.totalReferrals);

      const totalCommissionsOwed = contributors.reduce((sum, c) => sum + c.commissionOwed, 0);
      const totalReferrals = contributors.reduce((sum, c) => sum + c.totalReferrals, 0);

      return NextResponse.json({
        contributors,
        totalCommissionsOwed: Math.round(totalCommissionsOwed * 100) / 100,
        totalReferrals,
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

    // Payout history — sort in JS instead of using .orderBy() in Firestore,
    // which would require a composite index (contributorId + createdAt) that
    // may not exist and would cause a FAILED_PRECONDITION 500 on every call.
    const payoutsSnap = await db.collection("commissionPayouts")
      .where("contributorId", "==", contributorId)
      .get();

    const payouts = payoutsSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const dateA = (a.createdAt as string) || "";
        const dateB = (b.createdAt as string) || "";
        return dateB.localeCompare(dateA); // descending
      })
      .slice(0, 12);

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
