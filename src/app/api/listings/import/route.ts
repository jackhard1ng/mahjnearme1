import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-auth";
import { clearListingsCache } from "@/lib/listings-firestore";

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

    // Process in batches of 450 (Firestore limit is 500 per batch)
    const BATCH_SIZE = 450;
    for (let i = 0; i < listings.length; i += BATCH_SIZE) {
      const chunk = listings.slice(i, i + BATCH_SIZE);
      const batch = db.batch();

      for (const rawListing of chunk) {
        const listing = {
          ...rawListing,
          skillLevels: (() => {
            const s = rawListing.skillLevels;
            if (Array.isArray(s)) return s;
            if (typeof s === "string" && s) return s.split("|").filter(Boolean);
            return ["beginner", "intermediate"];
          })(),
        };
        const docId = listing.id;
        if (!docId) {
          skipped++;
          continue;
        }

        // Check if an organizer-owned listing with same name+city+state exists
        const nameKey = `${(listing.name || "").toLowerCase().trim()}|${(listing.city || "").toLowerCase().trim()}|${(listing.state || "").toLowerCase().trim()}`;
        if (orgOwnedKeys.has(nameKey)) {
          duplicates++;
          continue;
        }

        const ref = db.collection("listings").doc(docId);
        const existing = await ref.get();

        if (existing.exists) {
          const data = existing.data();
          // Don't overwrite organizer-edited listings
          if (data?.organizerEdited === true) {
            skipped++;
            continue;
          }
          batch.update(ref, { ...listing, updatedAt: now });
          updated++;
        } else {
          batch.set(ref, {
            ...listing,
            status: "active",
            organizerEdited: false,
            createdAt: now,
            updatedAt: now,
          });
          added++;
        }
      }

      await batch.commit();
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
