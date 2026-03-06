import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

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
    await docRef.update({ ...updates, lastUpdated: now });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Organizers PUT error:", err);
    return NextResponse.json({ error: "Failed to update organizer" }, { status: 500 });
  }
}

// DELETE: Remove an organizer
export async function DELETE(request: NextRequest) {
  try {
    const db = getAdminDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Organizer ID is required" }, { status: 400 });
    }

    await db.collection("organizers").doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Organizers DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete organizer" }, { status: 500 });
  }
}
