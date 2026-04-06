#!/usr/bin/env npx tsx
/**
 * Export active listings for web verification audit.
 *
 * Produces a JSON file designed for an auditor to visit each listing's
 * website/Instagram/Facebook and verify the event is real and still happening.
 *
 * Usage:
 *   npx tsx scripts/export-for-verification.ts
 *   npx tsx scripts/export-for-verification.ts --url https://www.mahjnearme.com
 *
 * Output: verification-audit-YYYY-MM-DD.json in the project root
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
  type: string;
  gameStyle: string;
  city: string;
  state: string;
  venueName: string;
  address: string;
  isRecurring: boolean;
  recurringSchedule: RecurringSchedule | null;
  eventDate: string | null;
  eventStartTime: string | null;
  eventEndTime: string | null;
  cost: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  instagram: string;
  facebookGroup: string;
  registrationLink: string;
  description: string;
  status: string;
  verified: boolean;
  source: string;
  organizerEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

function formatSchedule(l: Listing): string {
  if (l.isRecurring && l.recurringSchedule) {
    const day = l.recurringSchedule.dayOfWeek;
    const start = l.recurringSchedule.startTime || "?";
    const end = l.recurringSchedule.endTime || "?";
    const freq = l.recurringSchedule.frequency || "weekly";
    return `${freq} on ${day}, ${start}–${end}`;
  }
  if (l.eventDate) {
    const start = l.eventStartTime || "";
    const end = l.eventEndTime || "";
    const time = start ? ` at ${start}${end ? "–" + end : ""}` : "";
    return `${l.eventDate}${time}`;
  }
  return "no schedule listed";
}

async function main() {
  console.log(`Fetching listings from ${BASE_URL}/api/listings ...`);

  const res = await fetch(`${BASE_URL}/api/listings`);
  if (!res.ok) {
    console.error(`Failed to fetch: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const data = await res.json();
  const allListings: Listing[] = data.listings || [];

  // Only export active listings — those are what's live on the site
  const listings = allListings.filter((l) => l.status === "active");

  console.log(`${allListings.length} total listings, ${listings.length} active\n`);

  // Build verification objects
  const verificationItems = listings.map((l) => {
    // Collect all URLs the auditor should check
    const urlsToCheck: { type: string; url: string }[] = [];
    if (l.website) urlsToCheck.push({ type: "website", url: l.website });
    if (l.instagram) {
      const handle = l.instagram.replace(/^@/, "");
      const url = l.instagram.startsWith("http")
        ? l.instagram
        : `https://www.instagram.com/${handle}`;
      urlsToCheck.push({ type: "instagram", url });
    }
    if (l.facebookGroup) urlsToCheck.push({ type: "facebook", url: l.facebookGroup });
    if (l.registrationLink) urlsToCheck.push({ type: "registration", url: l.registrationLink });

    return {
      // Listing identity
      id: l.id,
      name: l.name,
      organizer: l.organizerName,
      type: l.type,
      gameStyle: l.gameStyle,

      // Location — what the auditor should see confirmed on the external source
      city: l.city,
      state: l.state,
      venue: l.venueName,
      address: l.address,

      // Schedule — what should match the external source
      schedule: formatSchedule(l),
      isRecurring: l.isRecurring,
      eventDate: l.eventDate,

      // Contact info listed on our site
      contactName: l.contactName,
      contactEmail: l.contactEmail,
      contactPhone: l.contactPhone,

      // URLs to visit and verify
      urlsToCheck,
      hasNoUrls: urlsToCheck.length === 0,

      // Our current data quality
      verified: l.verified,
      source: l.source,
      organizerEdited: l.organizerEdited,
      description: l.description,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,

      // Auditor fills these in:
      audit: {
        status: "", // "verified" | "cannot_verify" | "dead_link" | "event_ended" | "info_mismatch" | "suspicious"
        notes: "",
        correctedFields: {},
        checkedAt: "",
      },
    };
  });

  // Sort: listings with no URLs first (hardest to verify), then by state/city
  verificationItems.sort((a, b) => {
    if (a.hasNoUrls !== b.hasNoUrls) return a.hasNoUrls ? -1 : 1;
    if (a.state !== b.state) return a.state.localeCompare(b.state);
    return a.city.localeCompare(b.city);
  });

  const date = new Date().toISOString().split("T")[0];
  const filename = `verification-audit-${date}.json`;
  const outPath = path.join(process.cwd(), filename);

  const output = {
    exportedAt: new Date().toISOString(),
    totalActive: listings.length,
    totalWithUrls: verificationItems.filter((v) => !v.hasNoUrls).length,
    totalWithoutUrls: verificationItems.filter((v) => v.hasNoUrls).length,
    instructions: {
      purpose:
        "Verify each listing is a real, currently-active mahjong event by visiting the URLs listed and confirming the event details match what we have on file.",
      steps: [
        "For each listing, visit every URL in urlsToCheck.",
        "Confirm the event exists, is still active/scheduled, and the details (venue, schedule, contact) match our listing.",
        "Set audit.status to one of: verified, cannot_verify, dead_link, event_ended, info_mismatch, suspicious.",
        "If info doesn't match, put the correct values in audit.correctedFields (e.g. { \"address\": \"new address\", \"venueName\": \"new name\" }).",
        "Add any notes in audit.notes.",
        "Set audit.checkedAt to the current date.",
        "For listings with hasNoUrls=true, try searching Google for the organizer name + city to find a web presence.",
      ],
      auditStatuses: {
        verified: "Event confirmed active, details match",
        cannot_verify: "No working URL found, couldn't confirm via search either",
        dead_link: "URL(s) are broken / 404 / domain expired",
        event_ended: "Event existed but is no longer running or page says discontinued",
        info_mismatch: "Event exists but our details are wrong — see correctedFields",
        suspicious: "Listing looks fake, duplicated, or is not actually a mahjong event",
      },
    },
    listings: verificationItems,
  };

  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");

  // Summary
  const byState = new Map<string, number>();
  for (const l of verificationItems) {
    byState.set(l.state, (byState.get(l.state) || 0) + 1);
  }

  console.log(`Written to: ${outPath}`);
  console.log(`\n--- Summary ---`);
  console.log(`Active listings to verify: ${listings.length}`);
  console.log(`  With at least one URL:   ${output.totalWithUrls}`);
  console.log(`  With NO URLs (harder):   ${output.totalWithoutUrls}`);
  console.log(`\nTop states:`);
  const sorted = [...byState.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  for (const [state, count] of sorted) {
    console.log(`  ${state}: ${count}`);
  }
}

main().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
