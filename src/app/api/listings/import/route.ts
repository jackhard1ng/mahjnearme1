import { NextRequest, NextResponse } from "next/server";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-auth";
import { clearListingsCache } from "@/lib/listings-firestore";

export const runtime = "nodejs";
// Allow long-running imports on Vercel (default is 10s on Hobby / 15s on Pro).
// Without this, large paste imports (e.g. 700+ events) time out mid-write.
export const maxDuration = 60;

/**
 * POST /api/listings/import
 * Admin endpoint: imports listings from JSON payload into Firestore.
 * - New listings get added
 * - Existing listings that have organizerEdited=true are NOT overwritten
 * - Existing listings without organizerEdited get merged/updated
 *
 * Body: { listings: RawListing[] }
 */
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const db = getAdminDb();
    const body = await request.json();
    const listings = body.listings;

    if (!Array.isArray(listings) || listings.length === 0) {
      return NextResponse.json(
        { error: "listings array is required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    let added = 0;
    let updated = 0;
    let skipped = 0;
    let duplicates = 0;

    // Normalize incoming listings (fix skillLevels shape) and drop any without an id.
    type RawListing = Record<string, unknown> & { id?: string };
    const normalized: RawListing[] = [];
    for (const rawListing of listings as RawListing[]) {
      const listing = {
        ...rawListing,
        skillLevels: (() => {
          const s = rawListing.skillLevels;
          if (Array.isArray(s)) return s;
          if (typeof s === "string" && s) return s.split("|").filter(Boolean);
          return ["beginner", "intermediate"];
        })(),
      };
      if (!listing.id) {
        skipped++;
        continue;
      }
      normalized.push(listing);
    }

    // Build a name+city+state index of organizer-owned listings so we can
    // detect duplicates even when the AI generates a different doc ID.
    const orgOwnedSnap = await db.collection("listings")
      .where("organizerEdited", "==", true)
      .select("name", "city", "state")
      .get();
    const orgOwnedKeys = new Set(
      orgOwnedSnap.docs.map((d) => {
        const data = d.data();
        return `${(data.name as string || "").toLowerCase().trim()}|${(data.city as string || "").toLowerCase().trim()}|${(data.state as string || "").toLowerCase().trim()}`;
      })
    );

    // Filter out listings that collide with an organizer-owned listing by name+city+state.
    const toWrite: RawListing[] = [];
    for (const listing of normalized) {
      const nameKey = `${(listing.name as string || "").toLowerCase().trim()}|${(listing.city as string || "").toLowerCase().trim()}|${(listing.state as string || "").toLowerCase().trim()}`;
      if (orgOwnedKeys.has(nameKey)) {
        duplicates++;
        continue;
      }
      toWrite.push(listing);
    }

    // Batch-fetch existing docs in parallel using getAll() instead of one await per listing.
    // The previous implementation did `await ref.get()` sequentially inside the write loop,
    // which made large imports (e.g. 725 events) take ~30+ seconds and hit the function
    // timeout — only the first few hundred events would actually get written before the
    // process was killed.
    const READ_CHUNK = 300;
    const existingMap = new Map<string, DocumentSnapshot>();
    for (let i = 0; i < toWrite.length; i += READ_CHUNK) {
      const chunk = toWrite.slice(i, i + READ_CHUNK);
      const refs = chunk.map((l) => db.collection("listings").doc(l.id as string));
      if (refs.length === 0) continue;
      const snaps = await db.getAll(...refs);
      for (const snap of snaps) {
        existingMap.set(snap.id, snap);
      }
    }

    // Commit writes in batches of 450 (Firestore hard limit is 500 per batch).
    const WRITE_BATCH = 450;
    for (let i = 0; i < toWrite.length; i += WRITE_BATCH) {
      const chunk = toWrite.slice(i, i + WRITE_BATCH);
      const batch = db.batch();
      let writesInBatch = 0;

      for (const listing of chunk) {
        const docId = listing.id as string;
        const ref = db.collection("listings").doc(docId);
        const existing = existingMap.get(docId);

        if (existing && existing.exists) {
          const data = existing.data();
          // Don't overwrite organizer-edited listings
          if (data?.organizerEdited === true) {
            skipped++;
            continue;
          }
          batch.update(ref, { ...listing, updatedAt: now });
          updated++;
          writesInBatch++;
        } else {
          batch.set(ref, {
            ...listing,
            status: "active",
            organizerEdited: false,
            createdAt: now,
            updatedAt: now,
          });
          added++;
          writesInBatch++;
        }
      }

      if (writesInBatch > 0) {
        await batch.commit();
      }
    }

    clearListingsCache();

    return NextResponse.json({
      success: true,
      added,
      updated,
      skipped,
      duplicates,
      total: listings.length,
    });
  } catch (err) {
    console.error("Listings import error:", err);
    return NextResponse.json(
      { error: "Failed to import listings" },
      { status: 500 }
    );
  }
}
