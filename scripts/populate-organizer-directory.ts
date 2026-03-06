/**
 * One-time migration script: Populate organizer directory from existing listings.
 *
 * Usage: npx tsx scripts/populate-organizer-directory.ts
 *
 * This script:
 * 1. Reads all existing listings from Firestore
 * 2. Groups listings by unique organizer (venueName + city)
 * 3. Creates organizer records with contact info from listings
 * 4. Updates each listing with the corresponding organizerID
 * 5. Logs results
 */

import * as admin from "firebase-admin";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

interface ListingData {
  id: string;
  venueName?: string;
  city?: string;
  state?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  instagram?: string;
  facebookGroup?: string;
  address?: string;
  metroRegion?: string;
  gameStyle?: string;
  skillLevels?: string[];
  dropInFriendly?: boolean;
  setsProvided?: boolean;
  typicalGroupSize?: string;
  name?: string;
  lastVerified?: string;
  updatedAt?: string;
  createdAt?: string;
}

interface OrganizerRecord {
  venueName: string;
  city: string;
  state: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  instagram: string;
  facebookGroup: string;
  address: string;
  metroRegion: string;
  gameStyles: string[];
  skillLevels: string[];
  dropInFriendly: boolean;
  setsProvided: boolean;
  typicalGroupSize: string;
  listingCount: number;
  listingIds: string[];
  notes: string;
  createdAt: string;
  source: string;
}

async function main() {
  console.log("Starting organizer directory population...\n");

  // 1. Read all listings
  const listingsSnap = await db.collection("listings").get();
  const listings: ListingData[] = listingsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ListingData[];

  console.log(`Found ${listings.length} total listings.`);

  if (listings.length === 0) {
    // If no Firestore listings, try mock-data as fallback info
    console.log("No Firestore listings found. If using mock data, run this after real data is in Firestore.");
    return;
  }

  // 2. Group by unique organizer identity
  const organizerMap = new Map<string, { listings: ListingData[]; key: string }>();

  for (const listing of listings) {
    let key: string;

    if (listing.venueName && listing.venueName.trim()) {
      // Primary key: venueName + city
      key = `${listing.venueName.trim().toLowerCase()}|${(listing.city || "").trim().toLowerCase()}`;
    } else if (listing.contactEmail && listing.contactEmail.trim()) {
      // No venue name: group by contactEmail
      key = `email|${listing.contactEmail.trim().toLowerCase()}`;
    } else {
      // No venue name and no email: individual record
      key = `individual|${listing.id}`;
    }

    const existing = organizerMap.get(key);
    if (existing) {
      existing.listings.push(listing);
    } else {
      organizerMap.set(key, { listings: [listing], key });
    }
  }

  console.log(`Identified ${organizerMap.size} unique organizers.\n`);

  // 3. Create organizer records
  let created = 0;
  let linked = 0;
  const batch = db.batch();
  const batchOps: (() => void)[] = [];

  for (const [, group] of organizerMap) {
    // Use the most recently updated listing for contact info
    const sorted = group.listings.sort((a, b) => {
      const dateA = a.lastVerified || a.updatedAt || a.createdAt || "";
      const dateB = b.lastVerified || b.updatedAt || b.createdAt || "";
      return dateB.localeCompare(dateA);
    });
    const primary = sorted[0];

    // Check for conflicting contact info
    const contactEmails = new Set(sorted.map((l) => l.contactEmail).filter(Boolean));
    const contactNames = new Set(sorted.map((l) => l.contactName).filter(Boolean));
    const hasConflict = contactEmails.size > 1 || contactNames.size > 1;

    const notes = hasConflict
      ? `Contact info conflict detected across ${sorted.length} listings. Using most recently verified. Emails: ${[...contactEmails].join(", ")}. Names: ${[...contactNames].join(", ")}.`
      : "";

    // Collect all game styles and skill levels across listings
    const gameStyles = [...new Set(sorted.map((l) => l.gameStyle).filter(Boolean))] as string[];
    const skillLevels = [...new Set(sorted.flatMap((l) => l.skillLevels || []))];

    const organizerRecord: OrganizerRecord = {
      venueName: primary.venueName || primary.name || "Unknown Venue",
      city: primary.city || "",
      state: primary.state || "",
      contactName: primary.contactName || "",
      contactEmail: primary.contactEmail || "",
      contactPhone: primary.contactPhone || "",
      website: primary.website || "",
      instagram: primary.instagram || "",
      facebookGroup: primary.facebookGroup || "",
      address: primary.address || "",
      metroRegion: primary.metroRegion || "",
      gameStyles,
      skillLevels,
      dropInFriendly: sorted.some((l) => l.dropInFriendly),
      setsProvided: sorted.some((l) => l.setsProvided),
      typicalGroupSize: primary.typicalGroupSize || "",
      listingCount: sorted.length,
      listingIds: sorted.map((l) => l.id),
      notes,
      createdAt: new Date().toISOString(),
      source: "migration_script",
    };

    const orgRef = db.collection("organizers").doc();
    const organizerId = orgRef.id;

    batchOps.push(() => {
      batch.set(orgRef, organizerRecord);
    });
    created++;

    // 4. Update each source listing with organizerID
    for (const listing of sorted) {
      const listingRef = db.collection("listings").doc(listing.id);
      batchOps.push(() => {
        batch.update(listingRef, { organizerId });
      });
      linked++;
    }
  }

  // Execute batch (Firestore batches limited to 500 ops)
  // We'll commit in chunks
  console.log(`Creating ${created} organizer records and linking ${linked} listings...`);

  // Execute operations in batches of 450 (to stay under 500 limit)
  const BATCH_SIZE = 450;
  for (let i = 0; i < batchOps.length; i += BATCH_SIZE) {
    const chunk = batchOps.slice(i, i + BATCH_SIZE);
    const chunkBatch = db.batch();

    // Re-run the operations with the chunk batch
    // Since we can't easily re-batch, let's use individual writes for safety
    for (const op of chunk) {
      op();
    }

    await batch.commit();
    console.log(`  Committed batch ${Math.floor(i / BATCH_SIZE) + 1}`);
  }

  // If we had fewer than BATCH_SIZE ops, commit the original batch
  if (batchOps.length <= BATCH_SIZE) {
    for (const op of batchOps) {
      op();
    }
    await batch.commit();
  }

  console.log(`\nDone!`);
  console.log(`  Organizer records created: ${created}`);
  console.log(`  Listings linked: ${linked}`);
  if (organizerMap.size > 0) {
    const conflicts = [...organizerMap.values()].filter(
      (g) => g.listings.length > 1
    ).length;
    console.log(`  Multi-listing organizers: ${conflicts}`);
  }
}

main().catch(console.error);
