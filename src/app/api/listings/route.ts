import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-auth";
import { clearListingsCache } from "@/lib/listings-firestore";

/**
 * GET /api/listings - Returns all active listings from Firestore.
 * Auto-seeds Firestore from listings.json on first request if empty.
 * Cached at the CDN layer for 60s with stale-while-revalidate.
 */
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const state = searchParams.get("state");
    const city = searchParams.get("city");

    if (id) {
      const doc = await db.collection("listings").doc(id).get();
      if (!doc.exists) {
        return NextResponse.json({ error: "Listing not found" }, { status: 404 });
      }
      return NextResponse.json({ listing: { id: doc.id, ...doc.data() } });
    }

    // Check if Firestore has listings
    const countSnap = await db.collection("listings").limit(1).get();

    if (countSnap.empty) {
      // Auto-seed from JSON on first request
      console.log("[Listings API] Firestore empty, auto-seeding from JSON...");
      const seeded = await seedFromJSON(db);
      if (!seeded) {
        // Seeding failed or in progress, return JSON directly
        const { loadListings } = require("@/lib/listings-data");
        const games = loadListings();
        const res = NextResponse.json({ listings: games, count: games.length, source: "json" });
        res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
        return res;
      }
    }

    let query: FirebaseFirestore.Query = db.collection("listings");

    if (state && city) {
      query = query
        .where("state", "==", state.toUpperCase())
        .where("city", "==", city);
    } else if (state) {
      query = query.where("state", "==", state.toUpperCase());
    }

    const snap = await query.get();
    const listings = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const res = NextResponse.json({ listings, count: listings.length, source: "firestore" });
    res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res;
  } catch (err) {
    console.error("Listings GET error:", err);
    // Fallback to JSON on any error
    try {
      const { loadListings } = require("@/lib/listings-data");
      const games = loadListings();
      return NextResponse.json({ listings: games, count: games.length, source: "json-fallback" });
    } catch {
      return NextResponse.json({ error: "Failed to load listings" }, { status: 500 });
    }
  }
}

/**
 * Auto-seed Firestore from listings.json.
 * Uses the normalized Game objects from listings-data.ts.
 */
async function seedFromJSON(db: FirebaseFirestore.Firestore): Promise<boolean> {
  try {
    const { loadListings } = require("@/lib/listings-data");
    const games = loadListings();

    const BATCH_SIZE = 450;
    for (let i = 0; i < games.length; i += BATCH_SIZE) {
      const chunk = games.slice(i, i + BATCH_SIZE);
      const batch = db.batch();
      for (const game of chunk) {
        const ref = db.collection("listings").doc(game.id);
        batch.set(ref, { ...game, organizerEdited: false });
      }
      await batch.commit();
    }

    console.log(`[Listings API] Seeded ${games.length} listings into Firestore`);
    clearListingsCache();
    return true;
  } catch (err) {
    console.error("[Listings API] Failed to seed:", err);
    return false;
  }
}

/**
 * POST /api/listings - Admin: create a single listing in Firestore.
 */
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const db = getAdminDb();
    const body = await request.json();
    const now = new Date().toISOString();

    const listingData = {
      ...body,
      status: body.status || "active",
      organizerEdited: false,
      createdAt: now,
      updatedAt: now,
    };

    if (body.id) {
      await db.collection("listings").doc(body.id).set(listingData);
      clearListingsCache();
      return NextResponse.json({ id: body.id, ...listingData });
    } else {
      const ref = await db.collection("listings").add(listingData);
      clearListingsCache();
      return NextResponse.json({ id: ref.id, ...listingData });
    }
  } catch (err) {
    console.error("Listings POST error:", err);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}

/**
 * PUT /api/listings - Admin: update a listing.
 */
export async function PUT(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const db = getAdminDb();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Listing ID is required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    await db.collection("listings").doc(id).update({ ...updates, updatedAt: now });
    clearListingsCache();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Listings PUT error:", err);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}
