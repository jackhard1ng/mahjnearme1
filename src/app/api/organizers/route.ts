import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-auth";

// GET: List organizers, optionally filtered by metro
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);
    const metro = searchParams.get("metro");
    const all = searchParams.get("all") === "true";

    let query;
    if (all) {
      // Admin view: all organizers
      query = db.collection("organizers").orderBy("organizerName", "asc");
    } else if (metro) {
      query = db.collection("organizers")
        .where("metroRegion", "==", metro)
        .orderBy("organizerName", "asc");
    } else {
      return NextResponse.json({ error: "metro parameter required" }, { status: 400 });
    }

    const snap = await query.get();
    const organizers = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ organizers });
  } catch (err) {
    console.error("Organizers GET error:", err);
    return NextResponse.json({ error: "Failed to load organizers" }, { status: 500 });
  }
}

// POST: Create a new organizer
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const db = getAdminDb();
    const body = await request.json();

    const {
      organizerName,
      venueName,
      address,
      city,
      metroRegion,
      gameStyle,
      contactName,
      contactEmail,
      contactPhone,
      website,
      instagram,
      facebookGroup,
      skillLevels,
      dropInFriendly,
      setsProvided,
      typicalGroupSize,
      notes,
      addedBy,
    } = body;

    if (!organizerName || !metroRegion || !addedBy) {
      return NextResponse.json(
        { error: "Organizer name, metro region, and addedBy are required." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const organizerData = {
      organizerName: organizerName || "",
      venueName: venueName || "",
      address: address || "",
      city: city || "",
      metroRegion,
      gameStyle: gameStyle || "other",
      contactName: contactName || "",
      contactEmail: contactEmail || "",
      contactPhone: contactPhone || "",
      website: website || "",
      instagram: instagram || "",
      facebookGroup: facebookGroup || "",
      skillLevels: skillLevels || [],
      dropInFriendly: dropInFriendly || false,
      setsProvided: setsProvided || false,
      typicalGroupSize: typicalGroupSize || "",
      notes: notes || "",
      addedBy,
      lastUpdated: now,
      createdAt: now,
    };

    const ref = await db.collection("organizers").add(organizerData);

    return NextResponse.json({ id: ref.id, ...organizerData });
  } catch (err) {
    console.error("Organizers POST error:", err);
    return NextResponse.json({ error: "Failed to create organizer" }, { status: 500 });
  }
}

// PUT: Update an existing organizer
export async function PUT(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const db = getAdminDb();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Organizer ID is required" }, { status: 400 });
    }

    const docRef = db.collection("organizers").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Organizer not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const orgData = doc.data()!;

    // Auto-update slug when name changes (unless slug was explicitly provided)
    if (updates.organizerName && !updates.slug) {
      updates.slug = updates.organizerName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
    // Clean any explicitly provided slug
    if (updates.slug) {
      updates.slug = updates.slug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    await docRef.update({ ...updates, lastUpdated: now });

    // If featured was toggled, propagate to all linked listings as promoted
    if (typeof updates.featured === "boolean") {
      const listingIds = (orgData.listingIds as string[]) || [];
      if (listingIds.length > 0) {
        // Batch update in chunks of 450 (Firestore batch limit is 500)
        for (let i = 0; i < listingIds.length; i += 450) {
          const chunk = listingIds.slice(i, i + 450);
          const batch = db.batch();
          for (const listingId of chunk) {
            batch.update(db.collection("listings").doc(listingId), {
              promoted: updates.featured,
              updatedAt: now,
            });
          }
          await batch.commit();
        }
        console.log(`[Organizers PUT] Synced promoted=${updates.featured} to ${listingIds.length} listings for ${orgData.organizerName}`);
      }
      // Also try matching by organizerName in case listingIds isn't populated
      // (for organizers whose listings were imported before the link was established)
      const nameQuery = await db
        .collection("listings")
        .where("organizerName", "==", orgData.organizerName)
        .get();
      if (!nameQuery.empty) {
        const batch = db.batch();
        for (const doc of nameQuery.docs) {
          batch.update(doc.ref, { promoted: updates.featured, updatedAt: now });
        }
        await batch.commit();
        console.log(`[Organizers PUT] Synced promoted=${updates.featured} to ${nameQuery.size} additional listings matched by name`);
      }
    }

    // Propagate contact/name changes to all linked listings
    const listingIds = (orgData.listingIds as string[]) || [];
    if (listingIds.length > 0) {
      const listingUpdates: Record<string, unknown> = { updatedAt: now };
      if (updates.organizerName) {
        listingUpdates.organizerName = updates.organizerName;
        listingUpdates.contactName = updates.organizerName;
      }
      if (updates.contactEmail) listingUpdates.contactEmail = updates.contactEmail;
      if (updates.website) listingUpdates.website = updates.website;
      if (updates.instagram) listingUpdates.instagram = updates.instagram;
      if (updates.facebookGroup) listingUpdates.facebookGroup = updates.facebookGroup;

      // Only propagate if there are actual listing field changes
      if (Object.keys(listingUpdates).length > 1) {
        const BATCH_SIZE = 450;
        for (let i = 0; i < listingIds.length; i += BATCH_SIZE) {
          const chunk = listingIds.slice(i, i + BATCH_SIZE);
          const batch = db.batch();
          for (const lid of chunk) {
            batch.update(db.collection("listings").doc(lid), listingUpdates);
          }
          await batch.commit();
        }
      }
    }

    // Clear listings cache so changes appear immediately
    try {
      const { clearListingsCache } = await import("@/lib/listings-firestore");
      clearListingsCache();
    } catch { /* ok */ }

    return NextResponse.json({ success: true, listingsUpdated: listingIds.length });
  } catch (err) {
    console.error("Organizers PUT error:", err);
    return NextResponse.json({ error: "Failed to update organizer" }, { status: 500 });
  }
}

// DELETE: Remove an organizer and clean up linked user
export async function DELETE(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Organizer ID is required" }, { status: 400 });
    }

    // Check if organizer has a linked user and clean up their user doc
    const orgDoc = await db.collection("organizers").doc(id).get();
    if (orgDoc.exists) {
      const orgData = orgDoc.data()!;
      if (orgData.userId) {
        await db.collection("users").doc(orgData.userId as string).update({
          isOrganizer: false,
          organizerProfileId: null,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    await db.collection("organizers").doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Organizers DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete organizer" }, { status: 500 });
  }
}
