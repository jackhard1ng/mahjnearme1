import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";

/**
 * GET or POST /api/digest?type=newEvents|digest
 *
 * type=newEvents: Manual send for "new events in my area" users (you press this after updating JSON)
 * type=digest: Weekly digest for "weekly digest" users (runs on Monday cron or manual)
 *
 * Both track their own last-run state separately in Firestore.
 */
export async function GET(req: Request) {
  return handleDigest(req);
}

export async function POST(req: Request) {
  return handleDigest(req);
}

async function handleDigest(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const sendType = url.searchParams.get("type") || "digest"; // "newEvents" or "digest"

  try {
    const db = getAdminDb();
    const US_STATES: Record<string, string> = require("@/lib/constants").US_STATES;

    // 1. Load current listings
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.mahjnearme.com";
    const listingsRes = await fetch(`${baseUrl}/listings.json`);

    let currentListings: { id: string; name: string; type: string; city: string; state: string; gameStyle?: string; eventDate?: string }[] = [];

    if (listingsRes.ok) {
      const data = await listingsRes.json();
      currentListings = (data.listings || []).map((l: Record<string, unknown>) => ({
        id: l.id || `${l.name}-${l.city}-${l.state}`,
        name: l.name as string,
        type: l.type as string,
        city: l.city as string,
        state: l.state as string,
        gameStyle: l.gameStyle as string | undefined,
        eventDate: l.eventDate as string | undefined,
      }));
    }

    if (currentListings.length === 0) {
      return NextResponse.json({ error: "Could not load listings" }, { status: 500 });
    }

    // 2. Load previous run data (separate tracking for each type)
    const trackingDocId = sendType === "newEvents" ? "lastNewEvents" : "lastDigest";
    const lastRunDoc = await db.collection("digest").doc(trackingDocId).get();
    const lastRunData = lastRunDoc.exists ? lastRunDoc.data() : null;
    const previousIds = new Set<string>(lastRunData?.listingIds || []);

    // 3. Find new listings since last send of THIS type
    const currentIds = new Set(currentListings.map((l) => l.id));
    const newListings = currentListings.filter((l) => !previousIds.has(l.id));

    // Group new listings by state
    const newByState: Record<string, typeof newListings> = {};
    for (const listing of newListings) {
      const state = listing.state || "Unknown";
      if (!newByState[state]) newByState[state] = [];
      newByState[state].push(listing);
    }

    // 4. Query users who want this specific notification type
    const usersSnap = await db.collection("users").get();
    let emailsSent = 0;
    let emailsFailed = 0;

    const notifKey = sendType === "newEvents" ? "newEventsInArea" : "weeklyDigest";

    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data();
      const email = user.email;
      if (!email) continue;

      const notifs = user.emailNotifications || {};
      if (notifs[notifKey] !== true) continue; // only send to users with THIS toggle on

      const userStates: string[] = user.notifyStates || [];
      if (userStates.length === 0) continue; // no states selected, skip

      const isPaid = user.accountType === "subscriber" || user.accountType === "admin" || user.accountType === "contributor" || user.subscriptionStatus === "active";

      // Convert abbreviations to full names for matching
      const userStateNames = userStates.map((abbr: string) => US_STATES[abbr] || abbr);
      const relevantNew = newListings.filter((l) => userStateNames.includes(l.state) || userStates.includes(l.state));

      if (relevantNew.length === 0) continue;

      // 5. Build and send email
      const displayName = user.displayName || "there";
      const isNewEvents = sendType === "newEvents";
      const subject = `${relevantNew.length} new mahjong game${relevantNew.length !== 1 ? "s" : ""} ${isNewEvents ? "just added" : "added this week"}`;

      const html = buildDigestEmail({
        name: displayName,
        newListings: relevantNew,
        totalListings: currentListings.length,
        isPaid,
        isNewEvents,
      });

      const ok = await sendEmail({
        to: email,
        subject,
        text: `${relevantNew.length} new games added to MahjNearMe. Visit https://www.mahjnearme.com/search to explore.`,
        html,
      });

      if (ok) emailsSent++;
      else emailsFailed++;
    }

    // 6. Save current state for next run of THIS type
    await db.collection("digest").doc(trackingDocId).set({
      listingIds: Array.from(currentIds),
      totalListings: currentListings.length,
      newListingsCount: newListings.length,
      sentAt: new Date().toISOString(),
      emailsSent,
      emailsFailed,
    });

    return NextResponse.json({
      success: true,
      type: sendType,
      newListings: newListings.length,
      totalListings: currentListings.length,
      emailsSent,
      emailsFailed,
    });
  } catch (err) {
    console.error("[Digest] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// --- Email template ---

function buildDigestEmail(opts: {
  name: string;
  newListings: { name: string; type: string; city: string; state: string; gameStyle?: string; eventDate?: string }[];
  totalListings: number;
  isPaid: boolean;
  isNewEvents: boolean;
}): string {
  const { name, newListings, totalListings, isPaid, isNewEvents } = opts;

  const typeLabels: Record<string, string> = {
    open_play: "Open Play",
    lesson: "Lesson",
    league: "League",
    event: "Event",
  };

  const previewCount = isPaid ? newListings.length : 3;
  const visibleListings = newListings.slice(0, previewCount);
  const hiddenCount = Math.max(0, newListings.length - previewCount);

  let listingsHtml = "";
  for (const listing of visibleListings) {
    const typeLabel = typeLabels[listing.type] || "Event";
    const style = listing.gameStyle ? ` · ${listing.gameStyle.charAt(0).toUpperCase() + listing.gameStyle.slice(1)}` : "";
    listingsHtml += `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
          <strong style="color: #1a1a2e; font-size: 14px;">${listing.name}</strong><br/>
          <span style="color: #64748b; font-size: 12px;">${listing.city}, ${listing.state} · ${typeLabel}${style}</span>
        </td>
      </tr>`;
  }

  const lockMessage = !isPaid && hiddenCount > 0
    ? `<tr><td style="padding: 16px; text-align: center; background: #FFF0F5; border-radius: 8px;">
        <p style="color: #1a1a2e; font-weight: 600; margin: 0 0 4px 0;">${hiddenCount} more new game${hiddenCount !== 1 ? "s" : ""} added</p>
        <p style="color: #64748b; font-size: 12px; margin: 0 0 12px 0;">Subscribe to see all new listings with full details.</p>
        <a href="https://www.mahjnearme.com/pricing" style="display: inline-block; background: #FF1493; color: white; padding: 8px 24px; border-radius: 8px; font-weight: 600; font-size: 13px; text-decoration: none;">View Plans</a>
      </td></tr>`
    : "";

  const headerText = isNewEvents ? "New Games Just Added" : "MahjNearMe Weekly Update";
  const timeText = isNewEvents ? "just added in your area" : "added this week in your area";

  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
      <div style="background: #FF1493; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">${headerText}</h1>
      </div>
      <div style="background: white; padding: 28px; border: 1px solid #eee; border-radius: 0 0 12px 12px;">
        <p style="color: #1a1a2e; font-size: 15px;">Hi ${name},</p>

        <p style="color: #64748b; font-size: 14px;">
          <strong style="color: #FF1493; font-size: 20px;">${newListings.length}</strong> new game${newListings.length !== 1 ? "s" : ""} ${timeText}. We now have <strong>${totalListings.toLocaleString()}</strong> listings across the country.
        </p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          ${listingsHtml}
          ${lockMessage}
        </table>

        <div style="text-align: center; margin-top: 20px;">
          <a href="https://www.mahjnearme.com/search" style="display: inline-block; background: #FF1493; color: white; padding: 12px 32px; border-radius: 10px; font-weight: 700; font-size: 14px; text-decoration: none;">
            Browse All Games
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />

        <p style="color: #94a3b8; font-size: 11px; text-align: center;">
          You're receiving this because you opted in to email notifications on MahjNearMe.<br/>
          <a href="https://www.mahjnearme.com/account" style="color: #FF1493;">Manage preferences</a>
        </p>
      </div>
    </div>`;
}
