import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-auth";
import { clearListingsCache, docToGame } from "@/lib/listings-firestore";

/**
 * Cache policy for a listings response.
 *
 * The public (active-only) body is shared and long-lived. The admin body
 * (`?status=all`) is not cacheable: it carries inactive and pending rows, and
 * it is read immediately after a write by the screen that performed it.
 */
function cacheHeaderFor(statusParam: string): string {
  return statusParam === "all"
    ? "private, no-store, max-age=0, must-revalidate"
    : "public, s-maxage=60, stale-while-revalidate=300";
}

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
    // "active" unless the caller asks otherwise; "all" returns every status.
    const statusParam = (searchParams.get("status") || "active").toLowerCase();

    if (id) {
      const doc = await db.collection("listings").doc(id).get();
      if (!doc.exists) {
        return NextResponse.json({ listing: null });
      }
      // Normalized, like the list branch below. Returning the raw document
      // here hands back a different shape from the same endpoint: no
      // metroRegion, skillLevels still an array or a pipe-string depending on
      // how the row was imported, and no defaults for the fields Game requires.
      // A single listing asked for by id is returned whatever its status —
      // you named it, so the status filter does not apply.
      return NextResponse.json({ listing: docToGame(doc.data() as Record<string, unknown>, doc.id) });
    }

    // Search by slug/name - used when game detail page can't find by ID.
    // Note this reads the whole collection and scans it linearly on every
    // request, with no cache header on the response. Nothing in the app calls
    // it any more — the detail page resolves slugs from the list the client
    // already has — so it is left in place for external callers rather than
    // optimised, but it should not gain new ones.
    if (search) {
      const slugToMatch = search.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const allSnap = await db.collection("listings").get();
      for (const doc of allSnap.docs) {
        const data = doc.data();
        const nameSlug = ((data.name as string) || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
        if (nameSlug === slugToMatch || nameSlug.includes(slugToMatch) || doc.id.includes(slugToMatch)) {
          return NextResponse.json({ listing: docToGame(data, doc.id) });
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
        // Same status rule as the Firestore path below — otherwise a failed
        // seed silently changes what the endpoint returns.
        const games = (loadListings() as { status: string }[]).filter(
          (g) => statusParam === "all" || g.status === statusParam
        );
        const res = NextResponse.json({ listings: games, count: games.length, source: "json" });
        res.headers.set("Cache-Control", cacheHeaderFor(statusParam));
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
    // Normalize all fields, then drop anything the caller did not ask for.
    //
    // This used to return every document regardless of status, so that the
    // admin screens could see inactive and pending ones. The cost of that fell
    // on everybody else: 922 of the 3,801 documents are inactive, and shipping
    // them added ~1.5 MB to a 5.7 MB response that every visitor downloads in
    // full on their first page view. No public surface ever showed them —
    // the homepage, search, city pages, events, seasonal and the organizer
    // dashboard each re-filter on `status === "active"` after the fetch.
    //
    // `?status=all` returns everything, which is what the admin screens
    // already asked for: admin/events has sent that parameter, with a comment
    // reading "/api/listings only returns active", since before the filter was
    // removed here. The client and this route had simply drifted apart.
    const listings = snap.docs
      .map((doc) => docToGame(doc.data() as Record<string, unknown>, doc.id))
      .filter((g) => statusParam === "all" || g.status === statusParam);

    // ?count=1 — how many listings are live, and nothing else.
    //
    // The homepage renders a single number, and was fetching the entire
    // collection to work it out. That response is far past the 2MB Next.js
    // data-cache limit, so it could not be cached: the build log says
    // "Failed to set Next.js data cache for /api/listings, items over 2MB can
    // not be cached (7645179 bytes)", and every ISR regeneration re-fetched
    // all of it for one integer.
    //
    // Expired one-off events are excluded here, because "live" is the only
    // thing a count is ever wanted for, and the caller would otherwise have to
    // download the rows to subtract them — which is the problem being solved.
    if (searchParams.get("count")) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const live = listings.filter((g) => {
        if (g.isRecurring || !g.eventDate) return true;
        const [y, m, d] = g.eventDate.split("-").map(Number);
        return new Date(y, m - 1, d) >= today;
      });
      // `mode` lets a caller tell this response apart from the full one, whose
      // `count` means something different (every row returned, expired included).
      const res = NextResponse.json({ mode: "count", count: live.length, source: "firestore" });
      res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
      return res;
    }

    const res = NextResponse.json({ listings, count: listings.length, source: "firestore" });
    // `status=all` is the admin view, and it must never be served from a
    // cache. The public variant is cached for 60s with a 5-minute
    // stale-while-revalidate window; applying that to the admin read meant an
    // admin could save a listing, reload, and be handed the pre-save body by
    // the CDN for minutes afterwards — identical in appearance to the write
    // having failed. It also keeps inactive and pending rows out of a shared
    // cache, which is where they belong.
    res.headers.set("Cache-Control", cacheHeaderFor(statusParam));
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
      ...trimStrings(body),
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
 * DELETE /api/listings?id=xxx - Admin: soft-delete a listing (set status=inactive).
 */
export async function DELETE(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Listing ID is required" }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Check if doc exists first
    const docRef = db.collection("listings").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      // If the listing is from JSON and was never seeded to Firestore,
      // create a minimal doc to record the deletion
      await docRef.set({
        id,
        status: "inactive",
        deletedAt: now,
      });
    } else {
      await docRef.update({
        status: "inactive",
        deletedAt: now,
      });
    }

    clearListingsCache();
    console.log(`[Listings] Deleted listing ${id}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Listings DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
  }
}

/**
 * Trim the string values of an update payload.
 *
 * Padded values arrive from organizer submissions and pasted imports — the two
 * live "Mahjong in the Mountains" records carry a trailing space on name, city
 * ("Red Feather Lakes ") and address. `docToGame` trims on read, which fixes
 * display, but the stored value stays padded and anything grouping records by
 * exact name or venue still sees two distinct values. Trimming on write makes
 * the stored copy clean as well.
 *
 * `description` is trimmed only at the ends: collapsing its internal
 * whitespace would destroy the author's paragraph breaks.
 */
function trimStrings(updates: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (typeof value !== "string") {
      out[key] = value;
      continue;
    }
    out[key] = key === "description" || key === "howToJoin" || key === "whatToBring"
      ? value.trim()
      : value.replace(/\s+/g, " ").trim();
  }
  return out;
}

export async function PUT(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const db = getAdminDb();
    const body = await request.json();
    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: "Listing ID is required" }, { status: 400 });
    }

    const updates = trimStrings(rest);
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const ref = db.collection("listings").doc(id);

    // set(..., { merge: true }) rather than update().
    //
    // update() rejects a document that does not exist, and plenty of listing
    // IDs are in exactly that state: the collection is seeded from
    // data/listings.json only when it holds fewer than 1000 documents, and the
    // seed skips IDs already present. A listing the admin screen is showing
    // from the JSON fallback therefore has an ID that update() throws
    // NOT_FOUND on, which surfaced as "Failed to update listing" — or, before
    // the client checked the response at all, as a success message over a
    // write that never happened.
    //
    // merge:true writes the named fields and leaves the rest of the document
    // alone, and creates it where it was missing. The field semantics are the
    // same as update() for an existing document.
    await ref.set({ ...updates, id, updatedAt: now }, { merge: true });

    // Read back what was actually stored, so the response is evidence the
    // write landed rather than an assertion that it should have.
    const saved = await ref.get();
    if (!saved.exists) {
      return NextResponse.json(
        { error: "Write did not persist. The listing could not be read back." },
        { status: 500 }
      );
    }

    clearListingsCache();
    return NextResponse.json({
      success: true,
      listing: docToGame(saved.data() as Record<string, unknown>, saved.id),
    });
  } catch (err) {
    console.error("Listings PUT error:", err);
    const detail = err instanceof Error ? err.message : "";
    return NextResponse.json(
      { error: detail ? `Failed to update listing: ${detail}` : "Failed to update listing" },
      { status: 500 }
    );
  }
}
