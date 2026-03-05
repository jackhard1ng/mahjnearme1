import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { findMetroForCity } from "@/lib/metro-regions";

// GET: Look up the approved contributor for a given city (resolves to metro)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const metroAbbr = searchParams.get("metro");

    if (!city && !metroAbbr) {
      return NextResponse.json({ contributor: null });
    }

    const db = getAdminDb();

    // Resolve city to metro abbreviation
    let metroSlug = metroAbbr;
    let metroName: string | null = null;
    if (!metroSlug && city) {
      const metro = findMetroForCity(city);
      if (metro) {
        metroSlug = metro.abbreviation;
        metroName = metro.metro;
      }
    }

    if (!metroSlug) {
      // Fallback: try direct city match
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
          metroName: data.contributorMetro || null,
        },
      });
    }

    // Find approved contributor for this metro region
    const snap = await db
      .collection("users")
      .where("contributorMetro", "==", metroSlug)
      .where("isContributor", "==", true)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ contributor: null, metroName });
    }

    const data = snap.docs[0].data();
    return NextResponse.json({
      contributor: {
        name: data.displayName || data.email || "Community Contributor",
        photoURL: data.photoURL || null,
        metroName: metroName || data.contributorMetro || null,
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

    // Resolve city to metro region
    const cityPart = city.split(",")[0].trim();
    const metro = findMetroForCity(cityPart);
    const metroRegion = metro ? metro.abbreviation : null;
    const metroName = metro ? metro.metro : null;

    const now = new Date().toISOString();

    // Create the contributor application
    await db.collection("contributorApplications").add({
      userId,
      name,
      email,
      city,
      metroRegion,
      metroName,
      connections,
      story,
      status: "pending",
      appliedAt: now,
      reviewedAt: null,
    });

    // Grant 14-day trial and mark as applied
    // This is a one-time trial — users cannot get another trial by re-applying
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
          contributorMetro: metroRegion,
          updatedAt: now,
        },
        { merge: true }
      );

    console.log(`=== New Contributor Application ===`);
    console.log(`User: ${name} <${email}>`);
    console.log(`City: ${city}`);
    console.log(`Metro Region: ${metroName || "Unknown"} (${metroRegion || "none"})`);
    console.log(`Connections: ${connections.join(", ")}`);
    console.log(`Story: ${story}`);
    console.log(`Trial granted until: ${trialEndsAt}`);
    console.log(`===================================`);

    return NextResponse.json({ success: true, trialEndsAt, metroRegion, metroName });
  } catch (err) {
    console.error("Contributor application error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// PATCH: Approve or reject a contributor application (admin action)
// When approved: set accountType to "contributor" (full paid plan, permanently free)
// When rejected: leave trial as-is (expires naturally, no re-trial possible)
export async function PATCH(request: NextRequest) {
  try {
    const db = getAdminDb();
    const body = await request.json();
    const { applicationId, action } = body;

    if (!applicationId || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid request." },
        { status: 400 }
      );
    }

    // Get the application
    const appDoc = await db.collection("contributorApplications").doc(applicationId).get();
    if (!appDoc.exists) {
      return NextResponse.json(
        { error: "Application not found." },
        { status: 404 }
      );
    }

    const appData = appDoc.data()!;
    const now = new Date().toISOString();

    // Update application status
    await db.collection("contributorApplications").doc(applicationId).update({
      status: action === "approve" ? "approved" : "rejected",
      reviewedAt: now,
    });

    // Update user profile
    if (action === "approve") {
      // Generate referral code from name and metro
      const nameSlug = (appData.name || "contributor")
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, 10);
      const metroSlug = (appData.metroName || appData.city || "local")
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, 10);
      const referralCode = `${nameSlug}-${metroSlug}`;
      const baseUrl = process.env.NEXT_PUBLIC_URL || "https://mahjnearme.com";
      const referralLink = `${baseUrl}/pricing?ref=${encodeURIComponent(referralCode)}`;

      // Approved: full paid plan for free, permanently
      await db.collection("users").doc(appData.userId).set(
        {
          accountType: "contributor",
          isContributor: true,
          contributorStatus: "approved",
          referralCode,
          referralLink,
          lastActivityDate: now,
          verificationsThisMonth: 0,
          // Clear trial — they're now on permanent contributor access
          trialEndsAt: null,
          updatedAt: now,
        },
        { merge: true }
      );
    } else {
      // Rejected: keep existing trial (it will expire naturally)
      // They cannot re-apply, so no repeat trial abuse
      await db.collection("users").doc(appData.userId).set(
        {
          contributorStatus: "rejected",
          updatedAt: now,
        },
        { merge: true }
      );
    }

    return NextResponse.json({ success: true, action });
  } catch (err) {
    console.error("Contributor review error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
