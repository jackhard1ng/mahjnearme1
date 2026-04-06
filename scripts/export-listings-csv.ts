#!/usr/bin/env npx tsx
/**
 * Export all listings from /api/listings to a CSV file for audit.
 *
 * Usage:
 *   npx tsx scripts/export-listings-csv.ts
 *   npx tsx scripts/export-listings-csv.ts --url https://www.mahjnearme.com
 *
 * Output: listings-audit-YYYY-MM-DD.csv in the project root
 */

import fs from "fs";
import path from "path";

const BASE_URL = process.argv.includes("--url")
  ? process.argv[process.argv.indexOf("--url") + 1]
  : "https://www.mahjnearme.com";

interface RecurringSchedule {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  frequency: string;
}

interface Listing {
  id: string;
  name: string;
  organizerName: string;
  organizerId: string | null;
  type: string;
  gameStyle: string;
  city: string;
  state: string;
  generalArea: string;
  venueName: string;
  address: string;
  geopoint: { lat: number; lng: number } | null;
  metroRegion: string | null;
  isRecurring: boolean;
  recurringSchedule: RecurringSchedule | null;
  eventDate: string | null;
  eventStartTime: string | null;
  eventEndTime: string | null;
  cost: string;
  costAmount: number | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  instagram: string;
  facebookGroup: string;
  registrationLink: string;
  description: string;
  howToJoin: string;
  whatToBring: string;
  skillLevels: string[];
  dropInFriendly: boolean;
  setsProvided: boolean;
  maxPlayers: number | null;
  typicalGroupSize: string;
  status: string;
  verified: boolean;
  claimedBy: string | null;
  source: string;
  promoted: boolean;
  organizerEdited: boolean;
  lastVerified: string;
  createdAt: string;
  updatedAt: string;
}

// Columns for the audit spreadsheet
const COLUMNS = [
  // Identity
  { header: "ID", field: (l: Listing) => l.id },
  { header: "Name", field: (l: Listing) => l.name },
  { header: "Organizer", field: (l: Listing) => l.organizerName },

  // Status / Admin
  { header: "Status", field: (l: Listing) => l.status },
  { header: "Verified", field: (l: Listing) => l.verified ? "YES" : "NO" },
  { header: "Source", field: (l: Listing) => l.source },
  { header: "Claimed By", field: (l: Listing) => l.claimedBy || "" },
  { header: "Promoted", field: (l: Listing) => l.promoted ? "YES" : "NO" },
  { header: "Organizer Edited", field: (l: Listing) => l.organizerEdited ? "YES" : "NO" },

  // Location
  { header: "City", field: (l: Listing) => l.city },
  { header: "State", field: (l: Listing) => l.state },
  { header: "General Area", field: (l: Listing) => l.generalArea },
  { header: "Venue", field: (l: Listing) => l.venueName },
  { header: "Address", field: (l: Listing) => l.address },
  { header: "Latitude", field: (l: Listing) => l.geopoint?.lat ?? "" },
  { header: "Longitude", field: (l: Listing) => l.geopoint?.lng ?? "" },
  { header: "Metro Region", field: (l: Listing) => l.metroRegion || "" },

  // Type / Style
  { header: "Type", field: (l: Listing) => l.type },
  { header: "Game Style", field: (l: Listing) => l.gameStyle },
  { header: "Skill Levels", field: (l: Listing) => (l.skillLevels || []).join("|") },

  // Schedule
  { header: "Is Recurring", field: (l: Listing) => l.isRecurring ? "YES" : "NO" },
  { header: "Day of Week", field: (l: Listing) => l.recurringSchedule?.dayOfWeek || "" },
  { header: "Start Time", field: (l: Listing) => l.recurringSchedule?.startTime || l.eventStartTime || "" },
  { header: "End Time", field: (l: Listing) => l.recurringSchedule?.endTime || l.eventEndTime || "" },
  { header: "Frequency", field: (l: Listing) => l.recurringSchedule?.frequency || "" },
  { header: "Event Date", field: (l: Listing) => l.eventDate || "" },
  {
    header: "Expired",
    field: (l: Listing) => {
      if (l.isRecurring) return "NO";
      if (!l.eventDate) return "";
      const [y, m, d] = l.eventDate.split("-").map(Number);
      return new Date(y, m - 1, d) < new Date(new Date().toDateString()) ? "YES" : "NO";
    },
  },

  // Details
  { header: "Cost", field: (l: Listing) => l.cost },
  { header: "Cost Amount", field: (l: Listing) => l.costAmount ?? "" },
  { header: "Drop-In Friendly", field: (l: Listing) => l.dropInFriendly ? "YES" : "NO" },
  { header: "Sets Provided", field: (l: Listing) => l.setsProvided ? "YES" : "NO" },
  { header: "Typical Group Size", field: (l: Listing) => l.typicalGroupSize },
  { header: "Max Players", field: (l: Listing) => l.maxPlayers ?? "" },

  // Contact
  { header: "Contact Name", field: (l: Listing) => l.contactName },
  { header: "Contact Email", field: (l: Listing) => l.contactEmail },
  { header: "Contact Phone", field: (l: Listing) => l.contactPhone },
  { header: "Website", field: (l: Listing) => l.website },
  { header: "Instagram", field: (l: Listing) => l.instagram },
  { header: "Facebook Group", field: (l: Listing) => l.facebookGroup },
  { header: "Registration Link", field: (l: Listing) => l.registrationLink },

  // Content
  { header: "Description", field: (l: Listing) => l.description },
  { header: "How to Join", field: (l: Listing) => l.howToJoin },
  { header: "What to Bring", field: (l: Listing) => l.whatToBring },

  // Audit flags (computed)
  {
    header: "AUDIT: Missing Address",
    field: (l: Listing) => (!l.address || l.address.trim() === "") ? "FLAG" : "",
  },
  {
    header: "AUDIT: Missing Contact",
    field: (l: Listing) =>
      !l.contactName && !l.contactEmail && !l.contactPhone && !l.website ? "FLAG" : "",
  },
  {
    header: "AUDIT: No Schedule",
    field: (l: Listing) =>
      !l.isRecurring && !l.eventDate && !l.recurringSchedule?.dayOfWeek ? "FLAG" : "",
  },
  {
    header: "AUDIT: Missing Venue",
    field: (l: Listing) => (!l.venueName || l.venueName.trim() === "") ? "FLAG" : "",
  },
  {
    header: "AUDIT: No Geo",
    field: (l: Listing) =>
      !l.geopoint || (l.geopoint.lat === 0 && l.geopoint.lng === 0) ? "FLAG" : "",
  },
  {
    header: "AUDIT: No Description",
    field: (l: Listing) => (!l.description || l.description.trim() === "") ? "FLAG" : "",
  },

  // Timestamps
  { header: "Created At", field: (l: Listing) => l.createdAt },
  { header: "Updated At", field: (l: Listing) => l.updatedAt },
  { header: "Last Verified", field: (l: Listing) => l.lastVerified },
];

function escapeCsv(val: unknown): string {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

async function main() {
  console.log(`Fetching listings from ${BASE_URL}/api/listings ...`);

  const res = await fetch(`${BASE_URL}/api/listings`);
  if (!res.ok) {
    console.error(`Failed to fetch: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const data = await res.json();
  const listings: Listing[] = data.listings || [];

  console.log(`Fetched ${listings.length} listings (source: ${data.source})`);

  // Build CSV
  const headerRow = COLUMNS.map((c) => escapeCsv(c.header)).join(",");
  const rows = listings.map((listing) =>
    COLUMNS.map((c) => escapeCsv(c.field(listing))).join(",")
  );

  const csv = [headerRow, ...rows].join("\n");

  const date = new Date().toISOString().split("T")[0];
  const filename = `listings-audit-${date}.csv`;
  const outPath = path.join(process.cwd(), filename);

  fs.writeFileSync(outPath, csv, "utf-8");

  // Print summary
  const active = listings.filter((l) => l.status === "active").length;
  const pending = listings.filter((l) => l.status === "pending").length;
  const inactive = listings.filter((l) => l.status === "inactive").length;
  const expired = listings.filter((l) => {
    if (l.isRecurring || !l.eventDate) return false;
    const [y, m, d] = l.eventDate.split("-").map(Number);
    return new Date(y, m - 1, d) < new Date(new Date().toDateString());
  }).length;
  const missingAddress = listings.filter((l) => !l.address || l.address.trim() === "").length;
  const missingContact = listings.filter(
    (l) => !l.contactName && !l.contactEmail && !l.contactPhone && !l.website
  ).length;
  const missingVenue = listings.filter((l) => !l.venueName || l.venueName.trim() === "").length;
  const noGeo = listings.filter(
    (l) => !l.geopoint || (l.geopoint.lat === 0 && l.geopoint.lng === 0)
  ).length;
  const noDescription = listings.filter((l) => !l.description || l.description.trim() === "").length;

  console.log(`\nWritten to: ${outPath}`);
  console.log(`\n--- Audit Summary ---`);
  console.log(`Total listings:    ${listings.length}`);
  console.log(`  Active:          ${active}`);
  console.log(`  Pending:         ${pending}`);
  console.log(`  Inactive:        ${inactive}`);
  console.log(`  Expired (date):  ${expired}`);
  console.log(``);
  console.log(`--- Data Quality Flags ---`);
  console.log(`  Missing address:    ${missingAddress}`);
  console.log(`  Missing contact:    ${missingContact}`);
  console.log(`  Missing venue:      ${missingVenue}`);
  console.log(`  No geocoordinates:  ${noGeo}`);
  console.log(`  No description:     ${noDescription}`);
}

main().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
