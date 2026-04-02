import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/api-auth";
import { notifyAdmin } from "@/lib/admin-notify";

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
      personalName,
      managementPreference,
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
      personalName: personalName || "",
      city,
      state: state.toUpperCase(),
      bio: bio || "",
      website: website || "",
      instagram: instagram || "",
      facebookGroup: facebookGroup || "",
      contactEmail: contactEmail || userEmail,
      isInstructor: isInstructor || false,
      instructorDetails: isInstructor ? (instructorDetails || null) : null,
      managementPreference: managementPreference || "self",
      message: message || "",
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
      createdAt: now,
    };

    const ref = await db.collection("organizerApplications").add(applicationData);

    notifyAdmin(
      `[New Application] ${organizerName || userName || userEmail} applied as ${role || "organizer"}`,
      `Name: ${organizerName}${personalName ? ` (${personalName})` : ""}\nEmail: ${contactEmail || userEmail}\nCity: ${city}, ${state}\nRole: ${role || "organizer"}\nManagement: ${managementPreference || "self"}\n${message ? `Message: ${message}` : ""}\n\nReview in the admin Approvals tab.`
    ).catch(() => {});

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

    // Simple query without composite index requirement
    const snap = await db
      .collection("organizerApplications")
      .get();

    const applications = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((app) => (app as Record<string, unknown>).status === status)
      .sort((a, b) => {
        const aTime = (a as Record<string, unknown>).createdAt as string || "";
        const bTime = (b as Record<string, unknown>).createdAt as string || "";
        return bTime.localeCompare(aTime);
      });

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
      // Try to match an existing organizer profile by name, email, or Instagram
      let existingOrgId: string | null = null;

      const nameToMatch = (app.organizerName || "").toLowerCase().trim();
      const emailToMatch = (app.contactEmail || app.userEmail || "").toLowerCase().trim();
      const igToMatch = (app.instagram || "").toLowerCase().replace("@", "").trim();
      const websiteToMatch = (app.website || "").toLowerCase().trim();
      const orgNameSlug = nameToMatch.replace(/[^a-z0-9]+/g, "");

      // Search by email first (most reliable)
      if (emailToMatch) {
        const byEmail = await db.collection("organizers").where("contactEmail", "==", emailToMatch).limit(1).get();
        if (!byEmail.empty) existingOrgId = byEmail.docs[0].id;
      }

      // Then by Instagram
      if (!existingOrgId && igToMatch) {
        const byIg = await db.collection("organizers").where("instagram", "==", `@${igToMatch}`).limit(1).get();
        if (!byIg.empty) existingOrgId = byIg.docs[0].id;
        if (!existingOrgId) {
          const byIg2 = await db.collection("organizers").where("instagram", "==", igToMatch).limit(1).get();
          if (!byIg2.empty) existingOrgId = byIg2.docs[0].id;
        }
      }

      // Then by website
      if (!existingOrgId && websiteToMatch) {
        const byWeb = await db.collection("organizers").where("website", "==", websiteToMatch).limit(1).get();
        if (!byWeb.empty) existingOrgId = byWeb.docs[0].id;
      }

      // Then by nameKey
      if (!existingOrgId && nameToMatch) {
        const byName = await db.collection("organizers").where("nameKey", "==", nameToMatch).limit(1).get();
        if (!byName.empty) existingOrgId = byName.docs[0].id;
      }

      // Then try slug-format of organizer name (e.g. "Modern Mahjong" -> "modernmahjong")
      if (!existingOrgId && orgNameSlug) {
        const bySlug = await db.collection("organizers").where("nameKey", "==", orgNameSlug).limit(1).get();
        if (!bySlug.empty) existingOrgId = bySlug.docs[0].id;
        if (!existingOrgId) {
          const bySlug2 = await db.collection("organizers").where("slug", "==", orgNameSlug).limit(1).get();
          if (!bySlug2.empty) existingOrgId = bySlug2.docs[0].id;
        }
      }

      let organizerProfileId: string;

      if (existingOrgId) {
        // Link to existing organizer profile
        organizerProfileId = existingOrgId;
        const updateData: Record<string, unknown> = {
          userId: app.userId,
          verified: true,
          managementPreference: app.managementPreference || "self",
          updatedAt: now,
        };
        if (app.isInstructor) {
          updateData.isInstructor = true;
          if (app.instructorDetails) updateData.instructorDetails = app.instructorDetails;
        }
        if (app.bio) updateData.bio = app.bio;
        if (app.website) updateData.website = app.website;
        if (app.instagram) updateData.instagram = app.instagram;
        if (app.facebookGroup) updateData.facebookGroup = app.facebookGroup;
        await db.collection("organizers").doc(existingOrgId).update(updateData);
      } else {
        // Create new organizer profile
        const slug = (app.organizerName || app.userName || app.userEmail.split("@")[0])
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/-+/g, "-")
          .replace(/(^-|-$)/g, "");

        const orgData = {
          nameKey: slug,
          organizerName: app.organizerName,
          personalName: app.personalName || "",
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
          managementPreference: app.managementPreference || "self",
          isInstructor: app.isInstructor || false,
          instructorDetails: app.instructorDetails || null,
          createdAt: now,
          updatedAt: now,
        };

        const orgRef = await db.collection("organizers").add(orgData);
        organizerProfileId = orgRef.id;
      }

      // Update user profile
      await db.collection("users").doc(app.userId).set(
        {
          isOrganizer: true,
          organizerProfileId,
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

    // Send approval/rejection email to the applicant
    if (app.contactEmail || app.userEmail) {
      const toEmail = app.contactEmail || app.userEmail;
      if (newStatus === "approved") {
        notifyAdmin(
          `Your MahjNearMe Organizer Account is Approved!`,
          `Hi ${app.organizerName || app.userName || ""}!\n\nGreat news, your organizer account on MahjNearMe has been approved!\n\nYou can now:\n- Manage your events and listings\n- Update your public profile\n- Add new events\n\nJust log in and click "For Organizers" in the menu to access your dashboard.\n\nWelcome to MahjNearMe!\nJack`
        ).catch(() => {});
        // Also send directly to the applicant (not just admin)
        try {
          const apiKey = process.env.SENDGRID_API_KEY;
          const fromEmail = process.env.SENDGRID_FROM_EMAIL;
          if (apiKey && fromEmail) {
            await fetch("https://api.sendgrid.com/v3/mail/send", {
              method: "POST",
              headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                personalizations: [{ to: [{ email: toEmail }] }],
                from: { email: fromEmail, name: "MahjNearMe" },
                subject: "Your MahjNearMe Organizer Account is Approved!",
                content: [
                  { type: "text/plain", value: `Hi ${app.organizerName || app.userName || ""}!\n\nGreat news - your organizer account on MahjNearMe has been approved!\n\nYou can now manage your events, update your profile, and add new listings. Just log in at mahjnearme.com and click "For Organizers" in the menu.\n\nWelcome aboard!\nJack @ MahjNearMe` },
                  { type: "text/html", value: `<div style="font-family:sans-serif;font-size:14px;color:#333"><p>Hi ${app.organizerName || app.userName || ""}!</p><p>Great news - your organizer account on MahjNearMe has been approved!</p><p>You can now:</p><ul><li>Manage your events and listings</li><li>Update your public profile</li><li>Add new events</li></ul><p>Just log in at <a href="https://www.mahjnearme.com">mahjnearme.com</a> and click <strong>"For Organizers"</strong> in the menu to access your dashboard.</p><p>Welcome aboard!<br>Jack @ MahjNearMe</p></div>` },
                ],
              }),
            });
          }
        } catch { /* ok */ }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Organizer apply PUT error:", err);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}
