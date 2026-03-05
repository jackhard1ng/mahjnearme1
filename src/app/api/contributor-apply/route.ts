import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

// GET: Look up the approved contributor for a given city
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");

    if (!city) {
      return NextResponse.json({ contributor: null });
    }

    const db = getAdminDb();

    // Find approved contributor for this city
    const snap = await db
      .collection("users")
      .where("contributorCity", "==", city)
      .where("isContributor", "==", true)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ contributor: null });
    }

    const data = snap.docs[0].data();
    return NextResponse.json({
      contributor: {
        name: data.displayName || data.email || "Community Contributor",
        photoURL: data.photoURL || null,
      },
    });
  } catch (err) {
    console.error("Contributor lookup error:", err);
    return NextResponse.json({ contributor: null });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, email, city, connections, story } = body;

    if (!userId || !name || !email || !city || !story) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one connection type." },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Check if user has already applied (prevent repeat trial abuse)
    const userDoc = await db.collection("users").doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData?.contributorAppliedAt) {
        return NextResponse.json(
          { error: "You have already submitted a contributor application." },
          { status: 409 }
        );
      }
    }

    const now = new Date().toISOString();

    // Create the contributor application
    await db.collection("contributorApplications").add({
      userId,
      name,
      email,
      city,
      connections,
      story,
      status: "pending",
      appliedAt: now,
      reviewedAt: null,
    });

    // Grant 14-day trial and mark as applied
    const trialEndsAt = new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000
    ).toISOString();

    await db
      .collection("users")
      .doc(userId)
      .set(
        {
          accountType: "trial",
          trialEndsAt,
          contributorAppliedAt: now,
          contributorStatus: "pending",
          contributorCity: city,
          updatedAt: now,
        },
        { merge: true }
      );

    console.log(`=== New Contributor Application ===`);
    console.log(`User: ${name} <${email}>`);
    console.log(`City: ${city}`);
    console.log(`Connections: ${connections.join(", ")}`);
    console.log(`Story: ${story}`);
    console.log(`Trial granted until: ${trialEndsAt}`);
    console.log(`===================================`);

    return NextResponse.json({ success: true, trialEndsAt });
  } catch (err) {
    console.error("Contributor application error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
