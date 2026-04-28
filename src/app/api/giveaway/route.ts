import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-auth";
import { sendEmail } from "@/lib/email";
import { CURRENT_GIVEAWAY } from "@/lib/giveaway-config";

// LEGAL NOTE: Sweepstakes laws vary by state. Have this reviewed by legal counsel before launch.

// GET: Get current month's giveaway info, past winners, and entry pool
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);
    const admin = searchParams.get("admin") === "true";

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Get past winners
    const winnersSnap = await db.collection("giveawayDraws")
      .orderBy("drawnAt", "desc")
      .limit(24)
      .get();

    const winners = winnersSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Live prize config (overrides file-based defaults). Falls back if doc missing.
    const configDoc = await db.collection("siteConfig").doc("giveaway").get();
    const liveConfig = configDoc.exists ? configDoc.data() : null;
    const prize = {
      prizeName: liveConfig?.prizeName ?? CURRENT_GIVEAWAY.prizeName,
      prizeValue: liveConfig?.prizeValue ?? CURRENT_GIVEAWAY.prizeValue,
      prizePhoto: liveConfig?.prizePhoto ?? null,
      prizeDescription: liveConfig?.prizeDescription ?? CURRENT_GIVEAWAY.prizeDescription,
      prizeLink: liveConfig?.prizeLink ?? CURRENT_GIVEAWAY.prizeLink,
      numberOfWinners: liveConfig?.numberOfWinners ?? CURRENT_GIVEAWAY.numberOfWinners,
      drawDate: liveConfig?.drawDate ?? CURRENT_GIVEAWAY.drawDate,
      month: liveConfig?.month ?? CURRENT_GIVEAWAY.month,
    };

    if (admin) {
      const denied = requireAdmin(request);
      if (denied) return denied;
      // Admin: also get entry pool for current month
      // Get exclusions for this month
      const exclusionsSnap = await db.collection("giveawayExclusions")
        .where("month", "==", currentMonth)
        .get();
      const excludedUserIds = new Set(exclusionsSnap.docs.map((d) => d.data().userId));

      const usersSnap = await db.collection("users").get();
      const eligibleEntries: { userId: string; userName: string; email: string; plan: string; entries: number }[] = [];

      for (const doc of usersSnap.docs) {
        const data = doc.data();
        // Eligibility is based on active subscription status at draw time
        const isActive = data.subscriptionStatus === "active" && (
          data.accountType === "subscriber" ||
          data.accountType === "contributor" ||
          data.accountType === "admin"
        );

        if (isActive && !excludedUserIds.has(doc.id)) {
          let entries = data.plan === "annual" ? 2 : 1;
          // Loyalty bonus: +1 entry for every 6 months subscribed, max 6 bonus
          if (data.subscribedDate) {
            const subDate = new Date(data.subscribedDate);
            const monthsSubscribed = Math.floor((now.getTime() - subDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
            const loyaltyBonus = Math.min(Math.floor(monthsSubscribed / 6), 6);
            entries += loyaltyBonus;
          }
          eligibleEntries.push({
            userId: doc.id,
            userName: data.displayName || data.email || "Unknown",
            email: data.email,
            plan: data.plan || "monthly",
            entries,
          });
        }
      }

      // Also include free entries for current month
      const freeEntriesSnap = await db.collection("giveawayFreeEntries")
        .where("month", "==", currentMonth)
        .get();

      for (const doc of freeEntriesSnap.docs) {
        const data = doc.data();
        eligibleEntries.push({
          userId: `free_${doc.id}`,
          userName: data.name || data.email,
          email: data.email,
          plan: "free_entry",
          entries: 1,
        });
      }

      // Include manual (mail-in) entries
      const manualEntriesSnap = await db.collection("giveawayManualEntries")
        .where("month", "==", currentMonth)
        .get();

      for (const doc of manualEntriesSnap.docs) {
        const data = doc.data();
        eligibleEntries.push({
          userId: `mailin_${doc.id}`,
          userName: data.name || data.email,
          email: data.email,
          plan: "mail_in",
          entries: 1,
        });
      }

      const totalEntries = eligibleEntries.reduce((sum, e) => sum + e.entries, 0);

      return NextResponse.json({
        currentMonth,
        winners,
        eligibleEntries,
        totalEntries,
        totalParticipants: eligibleEntries.length,
        ...prize,
      });
    }

    return NextResponse.json({ currentMonth, winners, ...prize });
  } catch (err) {
    console.error("Giveaway GET error:", err);
    return NextResponse.json({ error: "Failed to load giveaway data" }, { status: 500 });
  }
}

// POST: Admin draw winner OR free entry submission
export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb();
    const body = await request.json();

    // Free entry submission via online form is intentionally disabled.
    // The published Official Rules only document mail-in AMOE; allowing an
    // unauthenticated online endpoint would let anyone stuff the entry pool
    // with bogus emails. Mail-in entries are added by admin via the
    // "manual_entry" action below.
    if (body.action === "free_entry") {
      return NextResponse.json(
        { error: "Online free entry is not available. See Official Rules for the mail-in entry method." },
        { status: 410 }
      );
    }

    // Admin manual entry (mail-in AMOE)
    if (body.action === "manual_entry") {
      const denied = requireAdmin(request);
      if (denied) return denied;

      const { email, name, city } = body;
      if (!email || !name) {
        return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
      }

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      // Check if already entered this month
      const existingSnap = await db.collection("giveawayManualEntries")
        .where("email", "==", email.toLowerCase())
        .where("month", "==", currentMonth)
        .limit(1)
        .get();

      if (!existingSnap.empty) {
        return NextResponse.json({ error: "This person already has an entry this month" }, { status: 409 });
      }

      await db.collection("giveawayManualEntries").add({
        email: email.toLowerCase(),
        name,
        city: city || "",
        month: currentMonth,
        source: "mail_in",
        createdAt: now.toISOString(),
      });

      return NextResponse.json({ success: true, month: currentMonth });
    }

    // Admin save prize config (overrides file-based defaults)
    if (body.action === "save_config") {
      const denied = requireAdmin(request);
      if (denied) return denied;

      const allowed = [
        "month",
        "prizeName",
        "prizeValue",
        "prizePhoto",
        "prizeDescription",
        "prizeLink",
        "numberOfWinners",
        "drawDate",
      ] as const;
      const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
      for (const key of allowed) {
        if (key in body) update[key] = body[key];
      }
      if (Object.keys(update).length === 1) {
        return NextResponse.json({ error: "No fields to save" }, { status: 400 });
      }

      await db.collection("siteConfig").doc("giveaway").set(update, { merge: true });
      return NextResponse.json({ success: true });
    }

    // Admin draw winner
    if (body.action === "draw") {
      const denied = requireAdmin(request);
      if (denied) return denied;
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      // Check if already drawn this month
      const existingDraw = await db.collection("giveawayDraws")
        .where("month", "==", currentMonth)
        .limit(1)
        .get();

      if (!existingDraw.empty) {
        return NextResponse.json({ error: "Winner already drawn for this month" }, { status: 409 });
      }

      // Build entry pool (respect exclusions)
      const exclusionsSnap = await db.collection("giveawayExclusions")
        .where("month", "==", currentMonth)
        .get();
      const excludedUserIds = new Set(exclusionsSnap.docs.map((d) => d.data().userId));

      const usersSnap = await db.collection("users").get();
      const pool: { userId: string; name: string; email: string; city: string; photoURL: string | null; contactPhone: string | null }[] = [];

      for (const doc of usersSnap.docs) {
        const data = doc.data();
        const isActive = data.subscriptionStatus === "active" && (
          data.accountType === "subscriber" ||
          data.accountType === "contributor" ||
          data.accountType === "admin"
        );

        if (isActive && !excludedUserIds.has(doc.id)) {
          let entries = data.plan === "annual" ? 2 : 1;
          if (data.subscribedDate) {
            const subDate = new Date(data.subscribedDate);
            const monthsSubscribed = Math.floor((now.getTime() - subDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
            const loyaltyBonus = Math.min(Math.floor(monthsSubscribed / 6), 6);
            entries += loyaltyBonus;
          }
          for (let i = 0; i < entries; i++) {
            pool.push({
              userId: doc.id,
              name: data.displayName || data.email || "Unknown",
              email: data.email || "",
              city: data.homeCity || "Unknown",
              photoURL: data.photoURL || null,
              contactPhone: data.contactPhone || null,
            });
          }
        }
      }

      // Add free entries
      const freeEntriesSnap = await db.collection("giveawayFreeEntries")
        .where("month", "==", currentMonth)
        .get();

      for (const doc of freeEntriesSnap.docs) {
        const data = doc.data();
        pool.push({
          userId: `free_${doc.id}`,
          name: data.name || data.email,
          email: data.email || "",
          city: "Free Entry",
          photoURL: null,
          contactPhone: null,
        });
      }

      // Add manual (mail-in) entries
      const manualEntriesSnap = await db.collection("giveawayManualEntries")
        .where("month", "==", currentMonth)
        .get();

      for (const doc of manualEntriesSnap.docs) {
        const data = doc.data();
        pool.push({
          userId: `mailin_${doc.id}`,
          name: data.name || data.email,
          email: data.email || "",
          city: data.city || "Mail-In Entry",
          photoURL: null,
          contactPhone: null,
        });
      }

      if (pool.length === 0) {
        return NextResponse.json({ error: "No eligible entries" }, { status: 400 });
      }

      // Random draw - this action cannot be undone
      const winnerIndex = Math.floor(Math.random() * pool.length);
      const winner = pool[winnerIndex];

      const drawData = {
        month: currentMonth,
        winnerId: winner.userId,
        winnerName: winner.name,
        winnerEmail: winner.email,
        winnerCity: winner.city,
        winnerPhotoURL: winner.photoURL,
        winnerContactPhone: winner.contactPhone,
        drawnAt: now.toISOString(),
        notified: false,
        displayPermission: false,
        totalEntries: pool.length,
      };

      const drawRef = await db.collection("giveawayDraws").add(drawData);

      // Send winner notification email (best-effort; failure does not roll back the draw)
      let notified = false;
      if (winner.email) {
        try {
          const sent = await sendWinnerEmail({
            to: winner.email,
            name: winner.name,
            prizeName: CURRENT_GIVEAWAY.prizeName,
            prizeValue: CURRENT_GIVEAWAY.prizeValue,
            prizeLink: CURRENT_GIVEAWAY.prizeLink,
            month: CURRENT_GIVEAWAY.month,
          });
          notified = sent;
          if (sent) {
            await drawRef.update({ notified: true, notifiedAt: now.toISOString() });
          }
        } catch (err) {
          console.error("Winner notification email failed:", err);
        }
      }

      return NextResponse.json({ success: true, winner: { ...drawData, notified } });
    }

    // Admin remove entry (for canceled/refunded subscribers or bad entries)
    if (body.action === "remove_entry") {
      const denied = requireAdmin(request);
      if (denied) return denied;

      const { entryId, entryType } = body;
      if (!entryId) {
        return NextResponse.json({ error: "entryId is required" }, { status: 400 });
      }

      try {
        if (entryType === "free_entry") {
          const docId = entryId.replace("free_", "");
          await db.collection("giveawayFreeEntries").doc(docId).delete();
        } else if (entryType === "mail_in") {
          const docId = entryId.replace("mailin_", "");
          await db.collection("giveawayManualEntries").doc(docId).delete();
        }
        // For subscriber entries, we don't delete the user — they're just
        // excluded automatically when their subscription is canceled.
        // But if someone needs manual exclusion, we add them to an exclusion list.
        else {
          const now = new Date();
          const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
          await db.collection("giveawayExclusions").add({
            userId: entryId,
            month: currentMonth,
            reason: body.reason || "admin_removed",
            createdAt: now.toISOString(),
          });
        }
        return NextResponse.json({ success: true });
      } catch (err) {
        console.error("Remove entry error:", err);
        return NextResponse.json({ error: "Failed to remove entry" }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Giveaway POST error:", err);
    return NextResponse.json({ error: "Failed to process giveaway action" }, { status: 500 });
  }
}

async function sendWinnerEmail(opts: {
  to: string;
  name: string;
  prizeName: string;
  prizeValue: string | null;
  prizeLink: string | null;
  month: string;
}): Promise<boolean> {
  const firstName = opts.name.split(/\s+/)[0] || "there";
  const valueStr = opts.prizeValue ? ` (${opts.prizeValue})` : "";
  const subject = `You won the ${opts.month} MahjNearMe giveaway!`;

  const text = `Hi ${firstName},

Congratulations — you were drawn as the winner of the ${opts.month} MahjNearMe giveaway!

Prize: ${opts.prizeName}${valueStr}
${opts.prizeLink ? `Browse the collection: ${opts.prizeLink}\n` : ""}
To claim your prize, please reply to this email within 14 days with:
  1) Your full shipping address (continental US)
  2) Which set you'd like (if a choice applies)
  3) Whether we have your permission to display your first name, last initial, and city on the MahjNearMe winners page

If we don't hear back in 14 days, an alternate winner may be selected per the Official Rules.

Thanks for being part of MahjNearMe!
- Jack`;

  const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto">
  <div style="background:#FF1493;padding:24px;text-align:center;border-radius:12px 12px 0 0">
    <h1 style="color:white;margin:0;font-size:24px">You won! 🎉</h1>
  </div>
  <div style="background:white;padding:32px;border:1px solid #eee;border-radius:0 0 12px 12px">
    <p>Hi ${escapeHtml(firstName)},</p>
    <p>Congratulations — you were drawn as the winner of the <strong>${escapeHtml(opts.month)} MahjNearMe giveaway</strong>!</p>
    <div style="background:#FFF0F5;border:1px solid #FFB6C1;border-radius:12px;padding:16px;margin:16px 0">
      <p style="margin:0;font-weight:bold;color:#FF1493">${escapeHtml(opts.prizeName)}${escapeHtml(valueStr)}</p>
      ${opts.prizeLink ? `<p style="margin:8px 0 0"><a href="${escapeAttr(opts.prizeLink)}" style="color:#FF1493">Browse the collection &rarr;</a></p>` : ""}
    </div>
    <p>To claim your prize, please reply to this email within <strong>14 days</strong> with:</p>
    <ol>
      <li>Your full shipping address (continental US)</li>
      <li>Which set you'd like (if a choice applies)</li>
      <li>Whether we have your permission to display your first name, last initial, and city on the MahjNearMe winners page</li>
    </ol>
    <p style="color:#888;font-size:13px">If we don't hear back in 14 days, an alternate winner may be selected per the <a href="https://www.mahjnearme.com/sweepstakes-rules" style="color:#888">Official Rules</a>.</p>
    <p>Thanks for being part of MahjNearMe!<br/>- Jack</p>
  </div>
</div>`;

  return sendEmail({ to: opts.to, subject, text, html });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
