import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";

/**
 * POST /api/digest/announce
 * Send an announcement email to all users (or filtered by type).
 * Body: { subject, message, audience: "all" | "paid" | "free" }
 */
export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { subject, message, audience } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message required" }, { status: 400 });
    }

    const db = getAdminDb();
    const usersSnap = await db.collection("users").get();

    let emailsSent = 0;
    let emailsFailed = 0;
    let skipped = 0;

    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data();
      const email = user.email;
      if (!email) { skipped++; continue; }

      // Filter by audience
      const isPaid = user.accountType === "subscriber" || user.accountType === "admin" || user.accountType === "contributor" || user.subscriptionStatus === "active";

      if (audience === "paid" && !isPaid) { skipped++; continue; }
      if (audience === "free" && isPaid) { skipped++; continue; }

      const displayName = escapeHtml(user.displayName || "there");
      // Escape the operator-supplied message before injecting into HTML so
      // a typo or pasted angle bracket can't unintentionally render as
      // markup, and a leaked CRON_SECRET can't be used to inject phishing
      // links / tracking pixels into branded emails.
      const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>");

      const html = `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
          <div style="background: #FF1493; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 22px;">MahjNearMe</h1>
          </div>
          <div style="background: white; padding: 28px; border: 1px solid #eee; border-radius: 0 0 12px 12px;">
            <p style="color: #1a1a2e; font-size: 15px;">Hi ${displayName},</p>
            <div style="color: #475569; font-size: 14px; line-height: 1.6;">
              ${safeMessage}
            </div>
            <div style="text-align: center; margin-top: 24px;">
              <a href="https://www.mahjnearme.com/account" style="display: inline-block; background: #FF1493; color: white; padding: 12px 32px; border-radius: 10px; font-weight: 700; font-size: 14px; text-decoration: none;">
                Go to Account Settings
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center;">
              <a href="https://www.mahjnearme.com/account" style="color: #FF1493;">Manage preferences</a>
            </p>
          </div>
        </div>`;

      const ok = await sendEmail({
        to: email,
        subject,
        text: message,
        html,
      });

      if (ok) emailsSent++;
      else emailsFailed++;
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      emailsFailed,
      skipped,
      totalUsers: usersSnap.docs.length,
    });
  } catch (err) {
    console.error("[Announce] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
