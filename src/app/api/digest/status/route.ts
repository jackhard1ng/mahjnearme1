import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

/**
 * GET /api/digest/status
 * Returns notification subscribers and last digest run info.
 * Used by the admin panel.
 */
export async function GET() {
  try {
    const db = getAdminDb();

    // Get last run info
    const lastRunDoc = await db.collection("digest").doc("lastRun").get();
    const lastRun = lastRunDoc.exists ? lastRunDoc.data() : null;

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
      lastRun: lastRun ? {
        sentAt: lastRun.sentAt,
        emailsSent: lastRun.emailsSent,
        newListingsCount: lastRun.newListingsCount,
      } : null,
    });
  } catch (err) {
    console.error("[Digest Status] Error:", err);
    return NextResponse.json({ subscribers: [], lastRun: null });
  }
}
