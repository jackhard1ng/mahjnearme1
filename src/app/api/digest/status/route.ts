import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-auth";

/**
 * GET /api/digest/status — Protected
 */
export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const db = getAdminDb();

    // Get last run info for both types
    const [newEventsDoc, digestDoc] = await Promise.all([
      db.collection("digest").doc("lastNewEvents").get(),
      db.collection("digest").doc("lastDigest").get(),
    ]);

    const lastNewEvents = newEventsDoc.exists ? newEventsDoc.data() : null;
    const lastDigest = digestDoc.exists ? digestDoc.data() : null;

    // Get users with notifications enabled
    const usersSnap = await db.collection("users").get();
    const subscribers: {
      name: string;
      email: string;
      states: string[];
      newEvents: boolean;
      digest: boolean;
      accountType: string;
    }[] = [];

    for (const doc of usersSnap.docs) {
      const data = doc.data();
      const notifs = data.emailNotifications || {};
      if (notifs.newEventsInArea || notifs.weeklyDigest) {
        subscribers.push({
          name: data.displayName || "Unknown",
          email: data.email || "",
          states: data.notifyStates || [],
          newEvents: notifs.newEventsInArea || false,
          digest: notifs.weeklyDigest || false,
          accountType: data.accountType || "free",
        });
      }
    }

    return NextResponse.json({
      subscribers,
      lastNewEvents: lastNewEvents ? {
        sentAt: lastNewEvents.sentAt,
        emailsSent: lastNewEvents.emailsSent,
        newListingsCount: lastNewEvents.newListingsCount,
      } : null,
      lastDigest: lastDigest ? {
        sentAt: lastDigest.sentAt,
        emailsSent: lastDigest.emailsSent,
        newListingsCount: lastDigest.newListingsCount,
      } : null,
    });
  } catch (err) {
    console.error("[Digest Status] Error:", err);
    return NextResponse.json({ subscribers: [], lastNewEvents: null, lastDigest: null });
  }
}
