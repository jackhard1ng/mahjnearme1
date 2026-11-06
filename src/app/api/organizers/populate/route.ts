import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-auth";

/**
 * POST /api/organizers/populate
 * Extracts unique organizers from listings.json and populates the organizers collection.
 * Only creates new organizers -- doesn't overwrite existing ones.
 */
export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const db = getAdminDb();

    // Read the dataset directly rather than fetching it over HTTP.
    //
    // This used to `fetch(`${baseUrl}/listings.json`)`, i.e. request the
    // server's own data back from its own public URL. That required the
    // dataset to be world-readable to work at all, which is precisely the
    // exposure being closed here. Reading the module is also faster, cannot
    // fail on a network hiccup, and needs no base URL.
    // Shape kept loose, exactly as `await res.json()` previously returned it,
    // so the consuming loop below is unchanged by this swap.
    /* eslint-disable @typescript-eslint/no-explicit-any */
    let listings: any[];
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const raw = require("../../../../../data/listings.json") as { listings?: any[] };
      listings = raw.listings || [];
    } catch (err) {
      console.error("[organizers/populate] could not load data/listings.json:", err);
      return NextResponse.json({ error: "Could not load listings" }, { status: 500 });
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */

    // Extract organizers
    const orgMap = new Map<string, {
      displayName: string;
      contactEmail: string;
      website: string;
      instagram: string;
      facebookGroup: string;
      cities: Set<string>;
      states: Set<string>;
      listingIds: string[];
      listingCount: number;
      locations: Map<string, { venueName: string; address: string; city: string; state: string; lat: number; lng: number }>;
    }>();

    for (const l of listings) {
      let name = l.contactName || "";
      if (!name.trim()) {
        const listingName = l.name || "";
        if (listingName.includes(" - ")) {
          name = listingName.split(" - ")[0].trim();
        } else if (listingName.includes(" — ")) {
          name = listingName.split(" — ")[0].trim();
        } else {
          name = listingName;
        }
      }
      if (!name.trim()) continue;

      // Skip generic names
      const skip = ["library staff", "center staff", "staff", "unknown", "n/a", "none", "tbd"];
      if (skip.includes(name.toLowerCase().trim())) continue;

      const key = name.toLowerCase().trim();

      if (!orgMap.has(key)) {
        orgMap.set(key, {
          displayName: name.trim(),
          contactEmail: "",
          website: "",
          instagram: "",
          facebookGroup: "",
          cities: new Set(),
          states: new Set(),
          listingIds: [],
          listingCount: 0,
          locations: new Map<string, { venueName: string; address: string; city: string; state: string; lat: number; lng: number }>(),
        });
      }

      const org = orgMap.get(key)!;
      org.listingIds.push(l.id || "");
      org.listingCount++;
      if (l.city) org.cities.add(l.city);
      if (l.state) org.states.add(l.state);
      if (l.contactEmail && !org.contactEmail) org.contactEmail = l.contactEmail;
      if (l.website && !org.website) org.website = l.website;
      if (l.instagram && !org.instagram) org.instagram = l.instagram;
      if (l.facebookGroup && !org.facebookGroup) org.facebookGroup = l.facebookGroup;

      // Extract location if it has address or geopoint
      if (l.venueName || l.address || (l.latitude && l.longitude)) {
        const locKey = `${l.venueName || ""}-${l.city}-${l.state}`.toLowerCase();
        if (!org.locations.has(locKey)) {
          org.locations.set(locKey, {
            venueName: l.venueName || "",
            address: l.address || "",
            city: l.city || "",
            state: l.state || "",
            lat: l.latitude ? Number(l.latitude) : 0,
            lng: l.longitude ? Number(l.longitude) : 0,
          });
        }
      }
    }

    // Get existing organizers to avoid duplicates
    const existingSnap = await db.collection("organizers").get();
    const existingKeys = new Set(existingSnap.docs.map((d) => d.data().nameKey || d.data().organizerName?.toLowerCase()));

    let created = 0;
    let skipped = 0;

    // Collect all docs to create, then batch them
    const toCreate: { key: string; data: Record<string, unknown> }[] = [];

    for (const [key, org] of orgMap.entries()) {
      if (existingKeys.has(key)) {
        skipped++;
        continue;
      }

      // Only create organizers with 2+ listings or contact info
      if (org.listingCount < 2 && !org.contactEmail && !org.website) {
        skipped++;
        continue;
      }

      const slug = key.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const now = new Date().toISOString();

      toCreate.push({
        key,
        data: {
          nameKey: key,
          organizerName: org.displayName,
          slug,
          bio: "",
          contactEmail: org.contactEmail,
          website: org.website,
          instagram: org.instagram,
          facebookGroup: org.facebookGroup,
          photoURL: null,
          photos: [],
          cities: Array.from(org.cities),
          states: Array.from(org.states),
          listingIds: org.listingIds.slice(0, 50),
          listingCount: org.listingCount,
          locations: Array.from(org.locations.values()).slice(0, 10),
          verified: false,
          featured: false,
          userId: null,
          isInstructor: false,
          instructorDetails: null,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    // Write in batches of 450 (new batch each time)
    const BATCH_SIZE = 450;
    for (let i = 0; i < toCreate.length; i += BATCH_SIZE) {
      const chunk = toCreate.slice(i, i + BATCH_SIZE);
      const batch = db.batch();
      for (const item of chunk) {
        const docRef = db.collection("organizers").doc();
        batch.set(docRef, item.data);
      }
      await batch.commit();
      created += chunk.length;
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      totalOrganizers: orgMap.size,
    });
  } catch (err) {
    console.error("[Organizers Populate] Error:", err);
    return NextResponse.json({ error: "Internal error: " + (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}
