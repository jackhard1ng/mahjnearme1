import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireUser } from "@/lib/api-auth";

/**
 * PUT /api/organizer-profile
 * Self-service endpoint for organizers to update their own profile.
 *
 * Auth: Authorization: Bearer <Firebase ID token>. The userId is taken
 * from the verified token, NOT the request body, so callers cannot
 * modify other organizers' profiles.
 */
export async function PUT(request: NextRequest) {
  const authResult = await requireUser(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.uid;

  try {
    const db = getAdminDb();
    const body = await request.json();
    const { updates } = body;

    if (!updates) {
      return NextResponse.json({ error: "updates are required" }, { status: 400 });
    }

    // Verify user is linked to an organizer profile
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data()!;
    if (!userData.isOrganizer || !userData.organizerProfileId) {
      return NextResponse.json({ error: "Not an organizer" }, { status: 403 });
    }

    const orgId = userData.organizerProfileId as string;

    // Verify the organizer profile exists and belongs to this user
    const orgDoc = await db.collection("organizers").doc(orgId).get();
    if (!orgDoc.exists) {
      return NextResponse.json({ error: "Organizer profile not found" }, { status: 404 });
    }

    const orgData = orgDoc.data()!;
    if (orgData.userId !== userId) {
      return NextResponse.json({ error: "Not your profile" }, { status: 403 });
    }

    // Allowed self-service fields
    const allowedFields = [
      "organizerName", "personalName", "bio", "contactEmail",
      "website", "instagram", "facebookGroup", "photoURL", "photos",
      "isInstructor", "instructorDetails",
    ];

    const safeUpdates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    for (const key of allowedFields) {
      if (key in updates) {
        safeUpdates[key] = updates[key];
      }
    }

    await db.collection("organizers").doc(orgId).update(safeUpdates);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Organizer profile update error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
