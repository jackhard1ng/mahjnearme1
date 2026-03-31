import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-auth";

/**
 * GET /api/listings - Returns all active listings from Firestore.
 * Cached at the CDN layer for 60s with stale-while-revalidate.
 * Query params:
 *   ?state=TX - filter by state
 *   ?city=Austin&state=TX - filter by city+state
 *   ?id=abc123 - fetch single listing
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

    const res = NextResponse.json({ listings, count: listings.length });
    res.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );
    return res;
  } catch (err) {
    console.error("Listings GET error:", err);
    return NextResponse.json(
      { error: "Failed to load listings" },
      { status: 500 }
    );
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

    // Use provided ID or auto-generate
    if (body.id) {
      await db.collection("listings").doc(body.id).set(listingData);
      return NextResponse.json({ id: body.id, ...listingData });
    } else {
      const ref = await db.collection("listings").add(listingData);
      return NextResponse.json({ id: ref.id, ...listingData });
    }
  } catch (err) {
    console.error("Listings POST error:", err);
    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    await db
      .collection("listings")
      .doc(id)
      .update({ ...updates, updatedAt: now });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Listings PUT error:", err);
    return NextResponse.json(
      { error: "Failed to update listing" },
      { status: 500 }
    );
  }
}
