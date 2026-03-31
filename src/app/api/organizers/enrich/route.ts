import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-auth";

/**
 * POST /api/organizers/enrich
 *
 * Returns an enriched listings.json with organizer profile data applied.
 * Downloads as a file that you can upload to GitHub.
 *
 * Matching logic:
 * 1. Exact match on contactName → organizer nameKey
 * 2. Listing name prefix (before " - " or " — ") → organizer nameKey
 * 3. Fuzzy: listing name starts with organizer name (5+ chars)
 */
export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const db = getAdminDb();

    // Load organizer profiles from Firestore
    const orgSnap = await db.collection("organizers").get();
    const orgByKey = new Map<string, Record<string, unknown>>();
    const orgNames: string[] = [];

    for (const doc of orgSnap.docs) {
      const raw = doc.data();
      const data = { id: doc.id, ...raw };
      const key = (raw.nameKey as string || (raw.organizerName as string || "").toLowerCase()).trim();
      if (key) {
        orgByKey.set(key, data);
        orgNames.push(key);
      }
    }

    if (orgByKey.size === 0) {
      return NextResponse.json({ error: "No organizer profiles found. Run Populate first." }, { status: 400 });
    }

    // Load current listings from the live site
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.mahjnearme.com";
    const listingsRes = await fetch(`${baseUrl}/listings.json`);
    if (!listingsRes.ok) {
      return NextResponse.json({ error: "Could not load listings" }, { status: 500 });
    }
    const listingsData = await listingsRes.json();
    const listings = listingsData.listings || [];

    let enriched = 0;
    let unmatched = 0;

    for (const listing of listings) {
      const contactName = (listing.contactName || "").toLowerCase().trim();
      const listingName = listing.name || "";

      let prefix = "";
      if (listingName.includes(" - ")) {
        prefix = listingName.split(" - ")[0].trim().toLowerCase();
      } else if (listingName.includes(" — ")) {
        prefix = listingName.split(" — ")[0].trim().toLowerCase();
      }

      let org: Record<string, unknown> | null = null;

      if (contactName && orgByKey.has(contactName)) {
        org = orgByKey.get(contactName)!;
      } else if (prefix && orgByKey.has(prefix)) {
        org = orgByKey.get(prefix)!;
      } else {
        for (const key of orgNames) {
          if (key.length >= 5 && listingName.toLowerCase().startsWith(key)) {
            org = orgByKey.get(key)!;
            break;
          }
        }
      }

      if (!org) {
        unmatched++;
        continue;
      }

      // Apply verified organizer data (only if organizer has the field set)
      if (org.organizerName) listing.contactName = org.organizerName;
      if (org.contactEmail) listing.contactEmail = org.contactEmail;
      if (org.website) listing.website = org.website;
      if (org.instagram) listing.instagram = org.instagram;
      if (org.facebookGroup) listing.facebookGroup = org.facebookGroup;
      enriched++;
    }

    listingsData.listings = listings;

    return NextResponse.json({
      success: true,
      enriched,
      unmatched,
      totalListings: listings.length,
      totalOrganizers: orgByKey.size,
      // Include the enriched data for download
      enrichedData: listingsData,
    });
  } catch (err) {
    console.error("[Organizers Enrich] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
