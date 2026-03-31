import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-auth";

/**
 * POST /api/organizers/populate
 * Extracts unique organizers from listings.json and populates the organizers collection.
 * Only creates new organizers — doesn't overwrite existing ones.
 */
export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const db = getAdminDb();
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.mahjnearme.com";

    // Load listings
    const listingsRes = await fetch(`${baseUrl}/listings.json`);
    if (!listingsRes.ok) {
      return NextResponse.json({ error: "Could not load listings" }, { status: 500 });
    }
    const data = await listingsRes.json();
    const listings = data.listings || [];

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
    const batch = db.batch();
    let batchCount = 0;

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

      const docRef = db.collection("organizers").doc();
      batch.set(docRef, {
        nameKey: key,
        organizerName: org.displayName,
        contactEmail: org.contactEmail,
        website: org.website,
        instagram: org.instagram,
        facebookGroup: org.facebookGroup,
        cities: Array.from(org.cities),
        states: Array.from(org.states),
        listingIds: org.listingIds.slice(0, 50),
        listingCount: org.listingCount,
        locations: Array.from(org.locations.values()).slice(0, 10), // cap at 10 locations
        verified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      created++;
      batchCount++;

      // Firestore batch limit is 500
      if (batchCount >= 450) {
        await batch.commit();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      totalOrganizers: orgMap.size,
    });
  } catch (err) {
    console.error("[Organizers Populate] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
