import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { formatCurrency } from "@/lib/currency";
import { requireAdmin } from "@/lib/api-auth";
import {
  MONTHLY_REFERRAL_COMMISSION,
  ANNUAL_REFERRAL_COMMISSION,
} from "@/lib/constants";

// POST: Send contributor giveaway announcement emails — Protected
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const db = getAdminDb();
    const body = await request.json();
    const { prizeName, prizeValue } = body;

    if (!prizeName || !prizeValue) {
      return NextResponse.json(
        { error: "Prize name and value are required" },
        { status: 400 }
      );
    }

    // Get all active, approved contributors with referral codes
    const usersSnap = await db
      .collection("users")
      .where("isContributor", "==", true)
      .where("contributorStatus", "==", "approved")
      .get();

    if (usersSnap.empty) {
      return NextResponse.json(
        { error: "No active contributors found" },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://mahjnearme.com";
    const announcements: {
      email: string;
      name: string;
      referralCode: string;
      activeReferrals: number;
      monthlyEarnings: number;
    }[] = [];

    for (const doc of usersSnap.docs) {
      const data = doc.data();
      const referralCode = data.referralCode;
      if (!referralCode) continue;

      // Get referral stats for this contributor
      let activeReferrals = 0;
      let monthlyEarnings = 0;
      try {
        const referralsSnap = await db
          .collection("referrals")
          .where("contributorId", "==", doc.id)
          .where("status", "==", "active")
          .get();
        activeReferrals = referralsSnap.size;
        for (const refDoc of referralsSnap.docs) {
          const refData = refDoc.data();
          monthlyEarnings +=
            refData.plan === "annual"
              ? ANNUAL_REFERRAL_COMMISSION / 12
              : MONTHLY_REFERRAL_COMMISSION;
        }
      } catch {
        // Referral data unavailable, use zeros
      }

      const contributorName = data.displayName || data.email || "Contributor";

      // Build ready-to-post caption with their actual referral code
      const caption = buildCaption({
        prizeName,
        prizeValue,
        referralCode,
        baseUrl,
      });

      // Build email content
      const emailHtml = buildEmailTemplate({
        contributorName,
        prizeName,
        prizeValue,
        caption,
        referralCode,
        referralLink: `${baseUrl}/pricing?ref=${encodeURIComponent(referralCode)}`,
        activeReferrals,
        monthlyEarnings,
      });

      announcements.push({
        email: data.email,
        name: contributorName,
        referralCode,
        activeReferrals,
        monthlyEarnings,
      });

      // TODO: Replace with actual email service (SendGrid, Resend, SES, etc.)
      console.log(`=== Contributor Giveaway Announcement ===`);
      console.log(`To: ${data.email} (${contributorName})`);
      console.log(`Referral Code: ${referralCode}`);
      console.log(`Active Referrals: ${activeReferrals}`);
      console.log(`Monthly Earnings: ${formatCurrency(monthlyEarnings)}`);
      console.log(`Caption:\n${caption}`);
      console.log(`Email HTML length: ${emailHtml.length} chars`);
      console.log(`=========================================`);
    }

    // Log the send event
    await db.collection("giveawayAnnouncements").add({
      prizeName,
      prizeValue,
      sentAt: new Date().toISOString(),
      recipientCount: announcements.length,
      recipients: announcements.map((a) => ({
        email: a.email,
        name: a.name,
        referralCode: a.referralCode,
      })),
    });

    return NextResponse.json({
      success: true,
      sent: announcements.length,
      recipients: announcements.map((a) => a.name),
    });
  } catch (err) {
    console.error("Giveaway announcement error:", err);
    return NextResponse.json(
      { error: "Failed to send announcements" },
      { status: 500 }
    );
  }
}

function buildCaption({
  prizeName,
  prizeValue,
  referralCode,
  baseUrl,
}: {
  prizeName: string;
  prizeValue: string;
  referralCode: string;
  baseUrl: string;
}) {
  return `The MahjNearMe giveaway is live this month! They're giving away a ${prizeValue} ${prizeName} to one lucky member. Every paid subscriber is automatically entered. Use code ${referralCode} for 15% off your first month and you're in. ${baseUrl}/pricing?ref=${encodeURIComponent(referralCode)}`;
}

function buildEmailTemplate({
  contributorName,
  prizeName,
  prizeValue,
  caption,
  referralCode,
  referralLink,
  activeReferrals,
  monthlyEarnings,
}: {
  contributorName: string;
  prizeName: string;
  prizeValue: string;
  caption: string;
  referralCode: string;
  referralLink: string;
  activeReferrals: number;
  monthlyEarnings: number;
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">

<div style="text-align: center; margin-bottom: 24px;">
  <h1 style="color: #FF1493; font-size: 24px; margin: 0;">MahjNearMe Giveaway is Live!</h1>
</div>

<p>Hi ${contributorName},</p>

<p>This month's giveaway is live! We're giving away a <strong>${prizeValue} ${prizeName}</strong> to one lucky member.</p>

<div style="background: #FFF0F5; border: 1px solid #FFB6C1; border-radius: 12px; padding: 20px; margin: 20px 0;">
  <h3 style="margin: 0 0 8px; color: #FF1493;">Ready-to-Post Caption</h3>
  <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #555; background: white; padding: 12px; border-radius: 8px;">${caption}</p>
  <p style="margin: 8px 0 0; font-size: 12px; color: #888;">Copy and paste this to Instagram, Facebook, or anywhere your community gathers.</p>
</div>

<div style="background: #F0F8FF; border: 1px solid #87CEEB; border-radius: 12px; padding: 20px; margin: 20px 0;">
  <h3 style="margin: 0 0 12px; color: #1E2A3A;">Your Commission Dashboard</h3>
  <p style="margin: 0 0 4px;"><strong>Your referral code:</strong> ${referralCode}</p>
  <p style="margin: 0 0 4px;"><strong>Your referral link:</strong> <a href="${referralLink}" style="color: #FF1493;">${referralLink}</a></p>
  <p style="margin: 0 0 4px;"><strong>Active referrals:</strong> ${activeReferrals}</p>
  <p style="margin: 0;"><strong>Current monthly earnings:</strong> ${formatCurrency(monthlyEarnings)}</p>
</div>

<div style="background: #F9FAFB; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; color: #666;">
  <p style="margin: 0 0 4px;"><strong>Commission structure:</strong></p>
  <p style="margin: 0 0 2px;">${formatCurrency(MONTHLY_REFERRAL_COMMISSION)}/month for every monthly subscriber you refer</p>
  <p style="margin: 0;">${formatCurrency(ANNUAL_REFERRAL_COMMISSION)} one-time for every annual subscriber you refer</p>
</div>

<p style="font-size: 15px; line-height: 1.6;">Share your code this month. Every new subscriber from your post earns you commission every month they stay active.</p>

<p style="color: #888; font-size: 12px; margin-top: 32px;">- The MahjNearMe Team</p>

</body>
</html>`.trim();
}
