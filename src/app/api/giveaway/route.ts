import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-auth";

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

    if (admin) {
      const denied = requireAdmin(request);
      if (denied) return denied;
      // Admin: also get entry pool for current month
      const usersSnap = await db.collection("users").get();
      const eligibleEntries: { userId: string; userName: string; email: string; plan: string; entries: number }[] = [];

      for (const doc of usersSnap.docs) {
        const data = doc.data();
        const isActive =
          data.accountType === "subscriber" ||
          data.accountType === "contributor" ||
          data.accountType === "admin" ||
          data.subscriptionStatus === "active";

        if (isActive) {
          const entries = data.plan === "annual" ? 2 : 1;
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
          userId: doc.id,
          userName: data.name || data.email,
          email: data.email,
          plan: "free_entry",
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
      });
    }

    return NextResponse.json({ currentMonth, winners });
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

    // Free entry submission (no purchase necessary)
    if (body.action === "free_entry") {
      const { email, name } = body;
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      // Check if already entered this month
      const existingSnap = await db.collection("giveawayFreeEntries")
        .where("email", "==", email.toLowerCase())
        .where("month", "==", currentMonth)
        .limit(1)
        .get();

      if (!existingSnap.empty) {
        return NextResponse.json({ error: "You've already entered this month" }, { status: 409 });
      }

      await db.collection("giveawayFreeEntries").add({
        email: email.toLowerCase(),
        name: name || "",
        month: currentMonth,
        createdAt: now.toISOString(),
      });

      return NextResponse.json({ success: true, month: currentMonth });
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

      // Build entry pool
      const usersSnap = await db.collection("users").get();
      const pool: { userId: string; name: string; city: string; photoURL: string | null }[] = [];

      for (const doc of usersSnap.docs) {
        const data = doc.data();
        const isActive =
          data.accountType === "subscriber" ||
          data.accountType === "contributor" ||
          data.accountType === "admin" ||
          data.subscriptionStatus === "active";

        if (isActive) {
          const entries = data.plan === "annual" ? 2 : 1;
          for (let i = 0; i < entries; i++) {
            pool.push({
              userId: doc.id,
              name: data.displayName || data.email || "Unknown",
              city: data.homeCity || "Unknown",
              photoURL: data.photoURL || null,
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
          city: "Free Entry",
          photoURL: null,
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
        winnerCity: winner.city,
        winnerPhotoURL: winner.photoURL,
        drawnAt: now.toISOString(),
        notified: false,
        displayPermission: false,
        totalEntries: pool.length,
      };

      await db.collection("giveawayDraws").add(drawData);

      return NextResponse.json({ success: true, winner: drawData });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Giveaway POST error:", err);
    return NextResponse.json({ error: "Failed to process giveaway action" }, { status: 500 });
  }
}
