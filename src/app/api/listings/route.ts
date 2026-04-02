import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-auth";
import { clearListingsCache, docToGame } from "@/lib/listings-firestore";

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
    const search = searchParams.get("search");
    const state = searchParams.get("state");
    const city = searchParams.get("city");

    if (id) {
      const doc = await db.collection("listings").doc(id).get();
      if (!doc.exists) {
        return NextResponse.json({ listing: null });
      }
      return NextResponse.json({ listing: { id: doc.id, ...doc.data() } });
    }

    // Search by slug/name - used when game detail page can't find by ID
    if (search) {
      const slugToMatch = search.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const allSnap = await db.collection("listings").get();
      for (const doc of allSnap.docs) {
        const data = doc.data();
        const nameSlug = ((data.name as string) || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
        if (nameSlug === slugToMatch || nameSlug.includes(slugToMatch) || doc.id.includes(slugToMatch)) {
          return NextResponse.json({ listing: { id: doc.id, ...data } });
        }
      }
      return NextResponse.json({ listing: null });
    }

    // Check if Firestore has a full dataset (threshold: 1000 listings)
    // If under threshold, seed from JSON — this handles empty DB and partial imports
    const countSnap = await db.collection("listings").limit(1000).get();

    if (countSnap.size < 1000) {
      console.log(`[Listings API] Only ${countSnap.size} listings in Firestore, seeding from JSON...`);
      const seeded = await seedFromJSON(db);
      if (!seeded) {
        // Seeding failed — return JSON directly as fallback
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
    // Normalize all fields. Do NOT filter by status here — the search page
    // already filters client-side (status === "active" && !isEventExpired),
    // and the admin needs to see pending/inactive events too.
    const listings = snap.docs.map((doc) =>
      docToGame(doc.data() as Record<string, unknown>, doc.id)
    );

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

    // Get all existing doc IDs so we don't overwrite imported/organizer-edited listings
    const existingSnap = await db.collection("listings").select().get();
    const existingIds = new Set(existingSnap.docs.map((d) => d.id));

    const BATCH_SIZE = 450;
    for (let i = 0; i < games.length; i += BATCH_SIZE) {
      const chunk = games.slice(i, i + BATCH_SIZE);
      const batch = db.batch();
      for (const game of chunk) {
        if (existingIds.has(game.id)) continue; // don't overwrite existing docs
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
