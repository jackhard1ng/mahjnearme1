import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-auth";

/**
 * GET /api/approvals - List pending approval requests
 * POST /api/approvals - Submit a new approval request (listing edit or new listing)
 * PUT /api/approvals - Admin: approve/reject
 */

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const type = searchParams.get("type");
    const userId = searchParams.get("userId");

    const snap = await db.collection("approvals").get();
    let approvals = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Record<string, unknown>));

    approvals = approvals.filter((a) => a.status === status);
    if (type) {
      approvals = approvals.filter((a) => a.type === type);
    }
    if (userId) {
      approvals = approvals.filter((a) => a.userId === userId);
    }

    approvals.sort((a, b) => ((b.createdAt as string) || "").localeCompare((a.createdAt as string) || ""));

    return NextResponse.json({ approvals });
  } catch (err) {
    console.error("Approvals GET error:", err);
    return NextResponse.json({ error: "Failed to load approvals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb();
    const body = await request.json();
    const {
      type,
      userId,
      userEmail,
      userName,
      organizerProfileId,
      listingId,
      claimId,
      oldValues,
      newValues,
    } = body;

    if (!type || !userId) {
      return NextResponse.json(
        { error: "type and userId are required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const approvalData = {
      type,
      userId,
      userEmail: userEmail || "",
      userName: userName || "",
      organizerProfileId: organizerProfileId || null,
      listingId: listingId || null,
      claimId: claimId || null,
      oldValues: oldValues || null,
      newValues: newValues || null,
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
      createdAt: now,
    };

    const ref = await db.collection("approvals").add(approvalData);

    return NextResponse.json({ id: ref.id, ...approvalData });
  } catch (err) {
    console.error("Approvals POST error:", err);
    return NextResponse.json({ error: "Failed to submit approval request" }, { status: 500 });
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

    const approvalRef = db.collection("approvals").doc(id);
    const approvalDoc = await approvalRef.get();

    if (!approvalDoc.exists) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 });
    }

    const approval = approvalDoc.data()!;
    const now = new Date().toISOString();

    if (newStatus === "approved") {
      if (approval.type === "listing_edit" && approval.listingId && approval.newValues) {
        // Apply the edit to the listing
        await db
          .collection("listings")
          .doc(approval.listingId)
          .update({
            ...approval.newValues,
            organizerEdited: true,
            updatedAt: now,
          });
      } else if (approval.type === "new_listing" && approval.newValues) {
        // Create the new listing
        const listingData = {
          ...approval.newValues,
          status: "active",
          organizerEdited: true,
          createdAt: now,
          updatedAt: now,
        };

        const listingRef = await db.collection("listings").add(listingData);

        // Add to organizer's listingIds
        if (approval.organizerProfileId) {
          const orgRef = db.collection("organizers").doc(approval.organizerProfileId);
          const orgDoc = await orgRef.get();
          if (orgDoc.exists) {
            const orgData = orgDoc.data()!;
            const listingIds = [...(orgData.listingIds || []), listingRef.id];
            await orgRef.update({
              listingIds,
              listingCount: listingIds.length,
              updatedAt: now,
            });
          }
        }
      }
    }

    await approvalRef.update({
      status: newStatus,
      reviewedBy: reviewedBy || "admin",
      reviewedAt: now,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Approvals PUT error:", err);
    return NextResponse.json({ error: "Failed to update approval" }, { status: 500 });
  }
}
