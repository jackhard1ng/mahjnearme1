import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-auth";

/**
 * POST /api/instructors/import
 * Admin endpoint: imports instructor data from Instagram JSON format.
 *
 * For each instructor:
 * - If an organizer profile exists with matching Instagram, flags it as instructor
 * - If no match, creates a new organizer profile with isInstructor=true
 *
 * Body: { instructors: Array<{username, full_name, bio, external_url, follower_count, ...}> }
 */
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const db = getAdminDb();
    const body = await request.json();
    const instructors = body.instructors;

    if (!Array.isArray(instructors) || instructors.length === 0) {
      return NextResponse.json({ error: "instructors array is required" }, { status: 400 });
    }

    // Load all existing organizers to match by Instagram
    const orgSnap = await db.collection("organizers").get();
    const orgByInstagram = new Map<string, { id: string; data: Record<string, unknown> }>();
    const orgByName = new Map<string, { id: string; data: Record<string, unknown> }>();

    for (const doc of orgSnap.docs) {
      const data = doc.data();
      const ig = ((data.instagram as string) || "").toLowerCase().replace("@", "").trim();
      if (ig) orgByInstagram.set(ig, { id: doc.id, data });
      const name = ((data.organizerName as string) || "").toLowerCase().trim();
      if (name) orgByName.set(name, { id: doc.id, data });
    }

    const now = new Date().toISOString();
    let flagged = 0;
    let created = 0;
    let skipped = 0;

    // Parse location from bio (look for city/state patterns)
    function parseLocation(bio: string): { city: string; state: string } {
      // Common patterns: "📍City, ST" or "📍City" or "Based in City"
      const locMatch = bio.match(/📍\s*([^,\n]+(?:,\s*[A-Z]{2})?)/);
      if (locMatch) {
        const parts = locMatch[1].trim().split(",").map((s: string) => s.trim());
        return { city: parts[0] || "", state: parts[1] || "" };
      }
      const basedMatch = bio.match(/(?:based in|serving|located in)\s+([^,.\n]+(?:,\s*[A-Z]{2})?)/i);
      if (basedMatch) {
        const parts = basedMatch[1].trim().split(",").map((s: string) => s.trim());
        return { city: parts[0] || "", state: parts[1] || "" };
      }
      return { city: "", state: "" };
    }

    // Parse teaching styles from bio
    function parseTeachingStyles(bio: string): string[] {
      const styles: string[] = [];
      const lower = bio.toLowerCase();
      if (lower.includes("private")) styles.push("private");
      if (lower.includes("group") || lower.includes("class")) styles.push("group");
      if (lower.includes("corporate") || lower.includes("fundrais")) styles.push("corporate");
      if (lower.includes("kid") || lower.includes("youth") || lower.includes("mini mahj")) styles.push("kids");
      if (lower.includes("online") || lower.includes("virtual")) styles.push("online");
      return styles;
    }

    // Parse certifications from bio
    function parseCertifications(bio: string): string {
      const certs: string[] = [];
      const lower = bio.toLowerCase();
      if (lower.includes("oh my mahjong") || lower.includes("ohmymahjong") || lower.includes("@ohmymahjong")) certs.push("Oh My Mahjong certified");
      if (lower.includes("mahjong molly") || lower.includes("@mahjongmolly")) certs.push("Trained by Mahjong Molly");
      if (lower.includes("mahj life") || lower.includes("mahjlife")) certs.push("Mahj Life Instructor Guild");
      if (lower.includes("certified") && certs.length === 0) certs.push("Certified instructor");
      return certs.join(", ");
    }

    const BATCH_SIZE = 400;
    let batch = db.batch();
    let batchCount = 0;

    for (const inst of instructors) {
      const username = (inst.username || "").toLowerCase().trim();
      if (!username) { skipped++; continue; }

      // Try to match existing organizer
      const existing = orgByInstagram.get(username);

      if (existing) {
        // Flag existing organizer as instructor
        const loc = parseLocation(inst.bio || "");
        const updates: Record<string, unknown> = {
          isInstructor: true,
          instructorDetails: {
            teachingStyles: parseTeachingStyles(inst.bio || ""),
            certifications: parseCertifications(inst.bio || ""),
            serviceArea: loc.city ? `${loc.city}${loc.state ? ", " + loc.state : ""}` : "",
            gameStylesTaught: ["american"],
          },
          updatedAt: now,
        };
        // Fill in missing fields from Instagram data
        if (!existing.data.bio && inst.bio) updates.bio = inst.bio.replace(/\n/g, " ").replace(/[^\x20-\x7E]/g, " ").trim();
        if (!existing.data.website && inst.external_url) updates.website = inst.external_url;

        batch.update(db.collection("organizers").doc(existing.id), updates);
        flagged++;
      } else {
        // Create new organizer profile as instructor
        const displayName = inst.full_name || username;
        const slug = username.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const loc = parseLocation(inst.bio || "");
        const bio = (inst.bio || "").replace(/\n/g, " ").replace(/[^\x20-\x7E]/g, " ").trim();

        const orgData = {
          nameKey: username,
          organizerName: displayName,
          slug,
          bio,
          contactEmail: "",
          website: inst.external_url || "",
          instagram: `@${username}`,
          facebookGroup: "",
          photoURL: null,
          photos: [],
          cities: loc.city ? [loc.city] : [],
          states: loc.state ? [loc.state] : [],
          locations: [],
          listingIds: [],
          listingCount: 0,
          verified: false,
          featured: false,
          userId: null,
          isInstructor: true,
          instructorDetails: {
            teachingStyles: parseTeachingStyles(inst.bio || ""),
            certifications: parseCertifications(inst.bio || ""),
            serviceArea: loc.city ? `${loc.city}${loc.state ? ", " + loc.state : ""}` : "",
            gameStylesTaught: ["american"],
          },
          createdAt: now,
          updatedAt: now,
        };

        const docRef = db.collection("organizers").doc();
        batch.set(docRef, orgData);
        created++;
      }

      batchCount++;
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      total: instructors.length,
      flagged,
      created,
      skipped,
    });
  } catch (err) {
    console.error("Instructor import error:", err);
    return NextResponse.json({ error: "Failed to import: " + (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}
