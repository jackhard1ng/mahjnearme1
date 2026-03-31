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
        listingIds: org.listingIds.slice(0, 50), // cap at 50 for Firestore doc size
        listingCount: org.listingCount,
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
