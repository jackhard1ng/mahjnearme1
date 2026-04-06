import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

/**
 * GET /api/organizers/overrides
 *
 * Returns a map of organizer nameKey → verified fields.
 * Public endpoint (cached) — used by the client to apply organizer
 * data on top of static listings.
 *
 * Also returns a locations map: organizer nameKey → array of verified locations.
 */
export async function GET() {
  try {
    const db = getAdminDb();
    const orgSnap = await db.collection("organizers").get();

    const overrides: Record<string, {
      displayName: string;
      contactEmail?: string;
      website?: string;
      instagram?: string;
      facebookGroup?: string;
      featured?: boolean;
      verified?: boolean;
      photoURL?: string;
      locations?: { venueName: string; address: string; city: string; state: string; lat: number; lng: number }[];
    }> = {};

    for (const doc of orgSnap.docs) {
      const data = doc.data();
      const key = (data.nameKey as string || "").trim();
      if (!key) continue;

      // Only include organizers with actual overrides (not just auto-populated defaults)
      const hasOverride = data.verified === true ||
        data.organizerName !== data.nameKey; // name was edited

      // Always include if they have contact info set
      const hasData = data.contactEmail || data.website || data.instagram || data.facebookGroup || (data.locations && (data.locations as unknown[]).length > 0);

      if (!hasOverride && !hasData) continue;

      const entry: typeof overrides[string] = {
        displayName: data.organizerName || key,
      };

      if (data.contactEmail) entry.contactEmail = data.contactEmail;
      if (data.website) entry.website = data.website;
      if (data.instagram) entry.instagram = data.instagram;
      if (data.facebookGroup) entry.facebookGroup = data.facebookGroup;
      if (data.featured) entry.featured = true;
      if (data.verified || data.featured || data.userId) entry.verified = true;
      if (data.photoURL) entry.photoURL = data.photoURL;
      if (data.locations && (data.locations as unknown[]).length > 0) {
        entry.locations = data.locations;
      }

      overrides[key] = entry;
    }

    return NextResponse.json(overrides, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.error("[Organizer Overrides] Error:", err);
    return NextResponse.json({});
  }
}
