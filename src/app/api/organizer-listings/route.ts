import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { notifyAdmin } from "@/lib/admin-notify";
import { requireUser } from "@/lib/api-auth";

/**
 * API for organizers to manage their own listings.
 * Auth: checks Firebase UID against organizer profile.
 *
 * GET /api/organizer-listings?userId=xxx - Get organizer's listings
 * PUT /api/organizer-listings - Submit edit (goes to approval queue or live if subscribed)
 * POST /api/organizer-listings - Submit new listing
 */

async function getOrganizerProfile(db: FirebaseFirestore.Firestore, userId: string) {
  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) return null;
  const userData = userDoc.data()!;
  if (!userData.isOrganizer || !userData.organizerProfileId) return null;

  const orgDoc = await db.collection("organizers").doc(userData.organizerProfileId).get();
  if (!orgDoc.exists) return null;

  return {
    user: userData,
    organizer: { id: orgDoc.id, ...orgDoc.data() },
    organizerProfileId: userData.organizerProfileId as string,
  };
}

// All verified organizers (linked accounts) get instant edits/listings.
// The approval queue only applies to unverified accounts (which shouldn't
// be hitting this endpoint anyway since they need to be organizers first).
function isVerifiedOrganizer(userData: Record<string, unknown>): boolean {
  return (
    userData.isOrganizer === true ||
    userData.accountType === "subscriber" ||
    userData.accountType === "admin" ||
    userData.subscriptionStatus === "active"
  );
}

function isSubscribed(userData: Record<string, unknown>): boolean {
  return (
    userData.accountType === "subscriber" ||
    userData.accountType === "admin" ||
    userData.subscriptionStatus === "active"
  );
}

export async function GET(request: NextRequest) {
  const authResult = await requireUser(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.uid;

  try {
    const db = getAdminDb();

    const profile = await getOrganizerProfile(db, userId);
    if (!profile) {
      return NextResponse.json({ error: "Not an organizer" }, { status: 403 });
    }

    const org = profile.organizer as Record<string, unknown>;
    const listingIds = (org.listingIds as string[]) || [];

    // Fetch all listings for this organizer
    const listings = [];
    // Firestore in() supports max 30 items
    for (let i = 0; i < listingIds.length; i += 30) {
      const batch = listingIds.slice(i, i + 30);
      const snap = await db
        .collection("listings")
        .where("__name__", "in", batch)
        .get();
      for (const doc of snap.docs) {
        listings.push({ id: doc.id, ...doc.data() });
      }
    }

    // Also get pending approvals for this organizer
    const approvalsSnap = await db
      .collection("approvals")
      .where("userId", "==", userId)
      .where("status", "==", "pending")
      .get();
    const pendingApprovals = approvalsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      organizer: profile.organizer,
      listings,
      pendingApprovals,
    });
  } catch (err) {
    console.error("Organizer listings GET error:", err);
    return NextResponse.json({ error: "Failed to load listings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await requireUser(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.uid;

  try {
    const db = getAdminDb();
    const body = await request.json();
    const { listingId, updates } = body;

    if (!listingId || !updates) {
      return NextResponse.json(
        { error: "listingId and updates are required" },
        { status: 400 }
      );
    }

    const profile = await getOrganizerProfile(db, userId);
    if (!profile) {
      return NextResponse.json({ error: "Not an organizer" }, { status: 403 });
    }

    // Verify this listing belongs to the organizer
    const org = profile.organizer as Record<string, unknown>;
    const listingIds = (org.listingIds as string[]) || [];
    if (!listingIds.includes(listingId)) {
      return NextResponse.json({ error: "Listing does not belong to you" }, { status: 403 });
    }

    const now = new Date().toISOString();

    if (isVerifiedOrganizer(profile.user)) {
      // Subscribed organizer: edit goes live immediately
      await db
        .collection("listings")
        .doc(listingId)
        .update({
          ...updates,
          organizerEdited: true,
          updatedAt: now,
        });

      notifyAdmin(
        `[Live Edit] ${profile.user.displayName || profile.user.email} edited a listing`,
        `Organizer: ${(org.organizerName as string) || "Unknown"}\nListing: ${listingId}\nChanges: ${JSON.stringify(updates, null, 2)}\n\nThis edit went live instantly (verified organizer).`
      ).catch(() => {});

      return NextResponse.json({ success: true, instant: true });
    } else {
      // Free organizer: goes to approval queue
      // Get current values for diff
      const listingDoc = await db.collection("listings").doc(listingId).get();
      const currentData = listingDoc.data() || {};

      const oldValues: Record<string, unknown> = {};
      for (const key of Object.keys(updates)) {
        oldValues[key] = currentData[key] ?? null;
      }

      const approvalData = {
        type: "listing_edit",
        userId,
        userEmail: profile.user.email || "",
        userName: profile.user.displayName || "",
        organizerProfileId: profile.organizerProfileId,
        listingId,
        claimId: null,
        oldValues,
        newValues: updates,
        status: "pending",
        reviewedBy: null,
        reviewedAt: null,
        createdAt: now,
      };

      await db.collection("approvals").add(approvalData);

      notifyAdmin(
        `[Pending Edit] ${profile.user.displayName || profile.user.email} wants to edit a listing`,
        `Organizer: ${(org.organizerName as string) || "Unknown"}\nListing: ${listingId}\nChanges: ${JSON.stringify(updates, null, 2)}\n\nNeeds your approval in the admin panel.`
      ).catch(() => {});

      return NextResponse.json({ success: true, instant: false, pending: true });
    }
  } catch (err) {
    console.error("Organizer listings PUT error:", err);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireUser(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.uid;

  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");

    if (!listingId) {
      return NextResponse.json({ error: "listingId required" }, { status: 400 });
    }

    const profile = await getOrganizerProfile(db, userId);
    if (!profile) {
      return NextResponse.json({ error: "Not an organizer" }, { status: 403 });
    }

    const org = profile.organizer as Record<string, unknown>;
    const listingIds = (org.listingIds as string[]) || [];
    if (!listingIds.includes(listingId)) {
      return NextResponse.json({ error: "Listing does not belong to you" }, { status: 403 });
    }

    const now = new Date().toISOString();

    // Soft delete: set status to inactive
    const listingRef = db.collection("listings").doc(listingId);
    const listingDoc = await listingRef.get();
    if (listingDoc.exists) {
      await listingRef.update({
        status: "inactive",
        deletedAt: now,
        deletedBy: userId,
      });
    } else {
      // Listing might not be in Firestore yet (JSON-only) — create a deletion record
      await listingRef.set({
        id: listingId,
        status: "inactive",
        deletedAt: now,
        deletedBy: userId,
      });
    }

    // Remove from organizer's listingIds
    const updatedIds = listingIds.filter((id) => id !== listingId);
    await db.collection("organizers").doc(profile.organizerProfileId).update({
      listingIds: updatedIds,
      listingCount: updatedIds.length,
      updatedAt: now,
    });

    notifyAdmin(
      `[Deleted] ${profile.user.displayName || profile.user.email} deleted a listing`,
      `Organizer: ${(org.organizerName as string) || "Unknown"}\nListing ID: ${listingId}\n\nListing set to inactive (soft delete).`
    ).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Organizer listings DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireUser(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.uid;

  try {
    const db = getAdminDb();
    const body = await request.json();
    const { listing } = body;

    if (!listing) {
      return NextResponse.json(
        { error: "listing is required" },
        { status: 400 }
      );
    }

    const profile = await getOrganizerProfile(db, userId);
    if (!profile) {
      return NextResponse.json({ error: "Not an organizer" }, { status: 403 });
    }

    const now = new Date().toISOString();
    const org = profile.organizer as Record<string, unknown>;

    // Check if admin already imported this event (same name+city+state, no owner)
    // If so, claim it instead of creating a duplicate.
    let existingUnownedId: string | null = null;
    if (listing.name && listing.city && listing.state) {
      const nameNorm = (listing.name as string).toLowerCase().trim();
      const cityNorm = (listing.city as string).toLowerCase().trim();
      const stateNorm = (listing.state as string).toUpperCase().trim();
      const dupSnap = await db.collection("listings")
        .where("city", "==", listing.city)
        .where("state", "==", stateNorm)
        .get();
      for (const doc of dupSnap.docs) {
        const d = doc.data();
        if (
          (d.name as string || "").toLowerCase().trim() === nameNorm &&
          !d.organizerId &&
          !d.claimedBy
        ) {
          existingUnownedId = doc.id;
          break;
        }
      }
    }

    // Add organizer reference to listing
    const listingData = {
      ...listing,
      organizerId: profile.organizerProfileId,
      organizerName: (org.organizerName as string) || "",
      claimedBy: userId,
      source: "organizer_submitted",
    };

    if (isVerifiedOrganizer(profile.user)) {
      // Subscribed: goes live immediately
      const newListing = {
        ...listingData,
        status: "active",
        organizerEdited: true,
        verified: true,
        promoted: isSubscribed(profile.user),
        createdAt: now,
        updatedAt: now,
      };

      let listingId: string;
      if (existingUnownedId) {
        // Claim the pre-imported listing instead of creating a duplicate
        await db.collection("listings").doc(existingUnownedId).update({
          ...listingData,
          organizerEdited: true,
          verified: true,
          promoted: isSubscribed(profile.user),
          updatedAt: now,
        });
        listingId = existingUnownedId;
      } else {
        const ref = await db.collection("listings").add(newListing);
        listingId = ref.id;
      }
      const ref = { id: listingId } as { id: string };

      // Add to organizer's listing IDs
      const listingIds = [...((org.listingIds as string[]) || []), ref.id];
      await db.collection("organizers").doc(profile.organizerProfileId).update({
        listingIds,
        listingCount: listingIds.length,
        updatedAt: now,
      });

      notifyAdmin(
        `[New Event Live] ${profile.user.displayName || profile.user.email} added a new event`,
        `Organizer: ${(org.organizerName as string) || "Unknown"}\nEvent: ${listing.name || "Untitled"}\nCity: ${listing.city || ""}, ${listing.state || ""}${existingUnownedId ? "\n\nNote: claimed a pre-imported listing (no duplicate created)." : "\n\nThis event is live now (verified organizer)."}`
      ).catch(() => {});

      return NextResponse.json({ success: true, instant: true, listingId: ref.id, claimed: !!existingUnownedId });
    } else {
      // Free: goes to approval queue
      const approvalData = {
        type: "new_listing",
        userId,
        userEmail: profile.user.email || "",
        userName: profile.user.displayName || "",
        organizerProfileId: profile.organizerProfileId,
        listingId: null,
        claimId: null,
        oldValues: null,
        newValues: listingData,
        status: "pending",
        reviewedBy: null,
        reviewedAt: null,
        createdAt: now,
      };

      await db.collection("approvals").add(approvalData);

      notifyAdmin(
        `[New Event Pending] ${profile.user.displayName || profile.user.email} submitted a new event`,
        `Organizer: ${(org.organizerName as string) || "Unknown"}\nEvent: ${listing.name || "Untitled"}\nCity: ${listing.city || ""}, ${listing.state || ""}\n\nNeeds your approval in the admin panel.`
      ).catch(() => {});

      return NextResponse.json({ success: true, instant: false, pending: true });
    }
  } catch (err) {
    console.error("Organizer listings POST error:", err);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
