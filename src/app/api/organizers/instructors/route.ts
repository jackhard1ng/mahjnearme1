import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

/**
 * GET /api/organizers/instructors
 * Public endpoint: returns all organizers where isInstructor=true.
 * Cached at CDN for 5 minutes.
 */
export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db
      .collection("organizers")
      .where("isInstructor", "==", true)
      .get();

    const instructors = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        organizerName: data.organizerName || "",
        slug: data.slug || "",
        bio: data.bio || "",
        contactEmail: data.contactEmail || "",
        website: data.website || "",
        instagram: data.instagram || "",
        photoURL: data.photoURL || null,
        cities: data.cities || [],
        states: data.states || [],
        featured: data.featured || false,
        listingCount: data.listingCount || 0,
        hasUser: !!data.userId,
        instructorDetails: data.instructorDetails || null,
      };
    });

    const res = NextResponse.json({ instructors });
    res.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );
    return res;
  } catch (err) {
    console.error("Instructors GET error:", err);
    return NextResponse.json(
      { error: "Failed to load instructors" },
      { status: 500 }
    );
  }
}
