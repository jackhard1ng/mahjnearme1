import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-auth";

/**
 * GET /api/claims - List claims (admin: all, or filtered by userId)
 * POST /api/claims - Submit a new claim (requires Firebase auth token)
 * PUT /api/claims - Admin: approve/reject a claim
 */

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    const snap = await db.collection("claims").get();
    let claims = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Record<string, unknown>));

    if (userId) {
      claims = claims.filter((c) => c.userId === userId);
    }
    if (status) {
      claims = claims.filter((c) => c.status === status);
    }

    claims.sort((a, b) => ((b.createdAt as string) || "").localeCompare((a.createdAt as string) || ""));

    return NextResponse.json({ claims });
  } catch (err) {
    console.error("Claims GET error:", err);
    return NextResponse.json({ error: "Failed to load claims" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb();
    const body = await request.json();
    const { userId, userEmail, userName, listingIds, message } = body;

    if (!userId || !userEmail || !listingIds?.length) {
      return NextResponse.json(
        { error: "userId, userEmail, and listingIds are required" },
        { status: 400 }
      );
    }

    // Check for existing pending claim by this user
    const existing = await db
      .collection("claims")
      .where("userId", "==", userId)
      .where("status", "==", "pending")
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { error: "You already have a pending claim. Please wait for it to be reviewed." },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const claimData = {
      userId,
      userEmail,
      userName: userName || "",
      listingIds,
      organizerProfileId: null,
      status: "pending",
      message: message || "",
      reviewedBy: null,
      reviewedAt: null,
      createdAt: now,
    };

    const ref = await db.collection("claims").add(claimData);

    return NextResponse.json({ id: ref.id, ...claimData });
  } catch (err) {
    console.error("Claims POST error:", err);
    return NextResponse.json({ error: "Failed to submit claim" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const db = getAdminDb();
    const body = await request.json();
    const { id, status: newStatus, reviewedBy } = body;

    if (!id || !newStatus) {
      return NextResponse.json(
        { error: "id and status are required" },
        { status: 400 }
      );
    }

    const claimRef = db.collection("claims").doc(id);
    const claimDoc = await claimRef.get();

    if (!claimDoc.exists) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    const claim = claimDoc.data()!;
    const now = new Date().toISOString();

    if (newStatus === "approved") {
      // Find or create organizer profile
      let organizerProfileId = claim.organizerProfileId;

      if (!organizerProfileId) {
        // Try to find an existing organizer by matching listing IDs
        const listingIds = claim.listingIds as string[];
        const orgQuery = await db
          .collection("organizers")
          .where("listingIds", "array-contains-any", listingIds.slice(0, 10))
          .limit(1)
          .get();

        if (!orgQuery.empty) {
          organizerProfileId = orgQuery.docs[0].id;
        } else {
          // Create a new organizer profile
          const slug = (claim.userName || claim.userEmail.split("@")[0])
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

          const newOrg = {
            nameKey: slug,
            organizerName: claim.userName || "",
            slug,
            bio: "",
            contactEmail: claim.userEmail,
            website: "",
            instagram: "",
            facebookGroup: "",
            photoURL: null,
            photos: [],
            locations: [],
            listingIds,
            listingCount: listingIds.length,
            cities: [],
            states: [],
            verified: true,
            featured: false,
            userId: claim.userId,
            isInstructor: false,
            instructorDetails: null,
            createdAt: now,
            updatedAt: now,
          };
          const orgRef = await db.collection("organizers").add(newOrg);
          organizerProfileId = orgRef.id;
        }

        // Update organizer profile with userId
        await db
          .collection("organizers")
          .doc(organizerProfileId)
          .update({ userId: claim.userId, updatedAt: now });
      }

      // Update user profile to be an organizer
      await db.collection("users").doc(claim.userId).set(
        {
          isOrganizer: true,
          organizerProfileId,
          updatedAt: now,
        },
        { merge: true }
      );

      // Update the listings as claimed
      const orgDoc = await db.collection("organizers").doc(organizerProfileId).get();
      const orgData = orgDoc.data() || {};
      const batch = db.batch();
      for (const listingId of claim.listingIds) {
        batch.update(db.collection("listings").doc(listingId), {
          claimedBy: claim.userId,
          organizerId: organizerProfileId,
          organizerName: orgData.organizerName || claim.userName || "",
          updatedAt: now,
        });
      }
      batch.update(claimRef, {
        status: "approved",
        organizerProfileId,
        reviewedBy: reviewedBy || "admin",
        reviewedAt: now,
      });
      await batch.commit();
    } else {
      // Rejected
      await claimRef.update({
        status: newStatus,
        reviewedBy: reviewedBy || "admin",
        reviewedAt: now,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Claims PUT error:", err);
    return NextResponse.json({ error: "Failed to update claim" }, { status: 500 });
  }
}
