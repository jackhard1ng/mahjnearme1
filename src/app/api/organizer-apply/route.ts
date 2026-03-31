import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-auth";

/**
 * POST /api/organizer-apply - Submit an organizer/instructor application
 * GET /api/organizer-apply?status=pending - List applications (admin)
 * PUT /api/organizer-apply - Approve/reject an application (admin)
 */

export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb();
    const body = await request.json();
    const {
      userId,
      userEmail,
      userName,
      role,
      organizerName,
      city,
      state,
      bio,
      website,
      instagram,
      facebookGroup,
      contactEmail,
      isInstructor,
      instructorDetails,
      message,
    } = body;

    if (!userId || !userEmail || !organizerName || !city || !state) {
      return NextResponse.json(
        { error: "userId, userEmail, organizerName, city, and state are required" },
        { status: 400 }
      );
    }

    // Check for existing pending application
    const existing = await db
      .collection("organizerApplications")
      .where("userId", "==", userId)
      .where("status", "==", "pending")
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { error: "You already have a pending application. We will review it soon." },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const applicationData = {
      userId,
      userEmail,
      userName: userName || "",
      role: role || "organizer",
      organizerName,
      city,
      state: state.toUpperCase(),
      bio: bio || "",
      website: website || "",
      instagram: instagram || "",
      facebookGroup: facebookGroup || "",
      contactEmail: contactEmail || userEmail,
      isInstructor: isInstructor || false,
      instructorDetails: isInstructor ? (instructorDetails || null) : null,
      message: message || "",
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
      createdAt: now,
    };

    const ref = await db.collection("organizerApplications").add(applicationData);

    return NextResponse.json({ id: ref.id, ...applicationData });
  } catch (err) {
    console.error("Organizer apply POST error:", err);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";

    const snap = await db
      .collection("organizerApplications")
      .where("status", "==", status)
      .orderBy("createdAt", "desc")
      .get();

    const applications = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ applications });
  } catch (err) {
    console.error("Organizer apply GET error:", err);
    return NextResponse.json({ error: "Failed to load applications" }, { status: 500 });
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
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }

    const appRef = db.collection("organizerApplications").doc(id);
    const appDoc = await appRef.get();

    if (!appDoc.exists) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const app = appDoc.data()!;
    const now = new Date().toISOString();

    if (newStatus === "approved") {
      // Create organizer profile
      const slug = (app.organizerName || app.userName || app.userEmail.split("@")[0])
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const orgData = {
        nameKey: slug,
        organizerName: app.organizerName,
        slug,
        bio: app.bio || "",
        contactEmail: app.contactEmail || app.userEmail,
        website: app.website || "",
        instagram: app.instagram || "",
        facebookGroup: app.facebookGroup || "",
        photoURL: null,
        photos: [],
        cities: [app.city],
        states: [app.state],
        locations: [],
        listingIds: [],
        listingCount: 0,
        verified: true,
        featured: false,
        userId: app.userId,
        isInstructor: app.isInstructor || false,
        instructorDetails: app.instructorDetails || null,
        createdAt: now,
        updatedAt: now,
      };

      const orgRef = await db.collection("organizers").add(orgData);

      // Update user profile
      await db.collection("users").doc(app.userId).set(
        {
          isOrganizer: true,
          organizerProfileId: orgRef.id,
          updatedAt: now,
        },
        { merge: true }
      );
    }

    await appRef.update({
      status: newStatus,
      reviewedBy: reviewedBy || "admin",
      reviewedAt: now,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Organizer apply PUT error:", err);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}
