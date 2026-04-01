import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-auth";

/**
 * POST /api/admin-link-organizer
 * Admin endpoint: links a user account to an existing organizer profile.
 * Body: { email: string, organizerProfileId: string }
 *
 * Finds user by email, sets isOrganizer=true and organizerProfileId on user doc,
 * and sets userId on the organizer doc.
 */
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const db = getAdminDb();
    const { email, organizerProfileId } = await request.json();

    if (!email || !organizerProfileId) {
      return NextResponse.json(
        { error: "email and organizerProfileId are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const usersSnap = await db
      .collection("users")
      .where("email", "==", email.toLowerCase().trim())
      .limit(1)
      .get();

    if (usersSnap.empty) {
      return NextResponse.json(
        { error: `No user found with email "${email}". They need to create a free account first.` },
        { status: 404 }
      );
    }

    const userDoc = usersSnap.docs[0];
    const userId = userDoc.id;

    // Verify organizer profile exists
    const orgDoc = await db.collection("organizers").doc(organizerProfileId).get();
    if (!orgDoc.exists) {
      return NextResponse.json(
        { error: "Organizer profile not found" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    // Update user: set as organizer
    await db.collection("users").doc(userId).set(
      {
        isOrganizer: true,
        organizerProfileId,
        updatedAt: now,
      },
      { merge: true }
    );

    // Update organizer: link userId
    await db.collection("organizers").doc(organizerProfileId).update({
      userId,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      userId,
      organizerProfileId,
      userName: userDoc.data()?.displayName || email,
    });
  } catch (err) {
    console.error("Admin link organizer error:", err);
    return NextResponse.json({ error: "Failed to link user" }, { status: 500 });
  }
}
