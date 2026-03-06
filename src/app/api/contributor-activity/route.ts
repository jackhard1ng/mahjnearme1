import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { CONTRIBUTOR_INACTIVITY_NUDGE_DAYS, CONTRIBUTOR_INACTIVITY_SUSPEND_DAYS } from "@/lib/constants";

// POST: Record contributor activity (listing verification, post, etc.)
export async function POST(request: NextRequest) {
  try {
    const { userId, activityType } = await request.json();

    if (!userId || !activityType) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const db = getAdminDb();
    const now = new Date().toISOString();

    const updates: Record<string, unknown> = {
      lastActivityDate: now,
      updatedAt: now,
    };

    if (activityType === "verification") {
      // Increment monthly verification counter
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();
      updates.verificationsThisMonth = (userData?.verificationsThisMonth || 0) + 1;
    }

    await db.collection("users").doc(userId).set(updates, { merge: true });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Activity tracking error:", err);
    return NextResponse.json({ error: "Failed to track activity" }, { status: 500 });
  }
}

// PATCH: Admin action to reactivate a suspended contributor
export async function PATCH(request: NextRequest) {
  try {
    const { userId, action } = await request.json();

    if (!userId || action !== "reactivate") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const db = getAdminDb();
    const now = new Date().toISOString();

    await db.collection("users").doc(userId).set(
      {
        accountType: "contributor",
        isContributor: true,
        lastActivityDate: now,
        updatedAt: now,
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reactivation error:", err);
    return NextResponse.json({ error: "Failed to reactivate" }, { status: 500 });
  }
}

// GET: Admin view of contributor accountability status
export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection("users")
      .where("isContributor", "==", true)
      .get();

    const now = Date.now();
    const contributors = snap.docs.map((doc) => {
      const data = doc.data();
      const lastActive = data.lastActivityDate ? new Date(data.lastActivityDate).getTime() : 0;
      const daysSinceActivity = lastActive ? Math.floor((now - lastActive) / (1000 * 60 * 60 * 24)) : 999;

      let inactivityStatus: "active" | "warning" | "suspended" = "active";
      if (daysSinceActivity >= CONTRIBUTOR_INACTIVITY_SUSPEND_DAYS) {
        inactivityStatus = "suspended";
      } else if (daysSinceActivity >= CONTRIBUTOR_INACTIVITY_NUDGE_DAYS) {
        inactivityStatus = "warning";
      }

      return {
        id: doc.id,
        name: data.displayName || data.email,
        email: data.email,
        metro: data.contributorMetro,
        referralCode: data.referralCode,
        lastActivityDate: data.lastActivityDate,
        daysSinceActivity,
        verificationsThisMonth: data.verificationsThisMonth || 0,
        accountType: data.accountType,
        inactivityStatus,
      };
    });

    return NextResponse.json({ contributors });
  } catch (err) {
    console.error("Contributor activity fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
