/**
 * Batch geocoding script for listings.json.
 *
 * Reads public/listings.json, geocodes every listing that's missing lat/lng,
 * and writes the updated data back. Uses OpenStreetMap Nominatim (free, no key).
 *
 * Rate limited to 1 request/second per Nominatim usage policy.
 *
 * Usage:
 *   npx tsx scripts/batch-geocode.ts
 *
 * Options:
 *   --dry-run    Show what would be geocoded without writing
 *   --limit=N    Only geocode the first N missing listings
 */

import * as fs from "fs";
import * as path from "path";

const LISTINGS_PATH = path.join(process.cwd(), "public", "listings.json");
const RATE_LIMIT_MS = 1100; // 1.1 seconds between requests

interface Listing {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string | null;
  venueName: string | null;
  generalArea: string | null;
  latitude?: number;
  longitude?: number;
  [key: string]: unknown;
}

interface ListingsFile {
  metadata: Record<string, unknown>;
  listings: Listing[];
}

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const encoded = encodeURIComponent(query);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encoded}`,
      { headers: { "User-Agent": "MahjNearMe/1.0 (batch-geocode)" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {
    // geocoding failed
  }
  return null;
}

function buildQuery(listing: Listing): string {
  // Prefer full address, fall back to city + state
  if (listing.address && listing.address !== "Unknown - confirm with venue" && !listing.address.toLowerCase().startsWith("unknown")) {
    return `${listing.address}, ${listing.city}, ${listing.state}`;
  }
  if (listing.venueName) {
    return `${listing.venueName}, ${listing.city}, ${listing.state}`;
  }
  return `${listing.city}, ${listing.state}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1]) : Infinity;

  console.log(`Reading ${LISTINGS_PATH}...`);
  const raw = fs.readFileSync(LISTINGS_PATH, "utf-8");
  const data: ListingsFile = JSON.parse(raw);

  const needsGeocoding = data.listings.filter(
    (l) => !l.latitude || !l.longitude || l.latitude === 0 || l.longitude === 0
  );
  const alreadyGeocoded = data.listings.length - needsGeocoding.length;

  console.log(`Total listings: ${data.listings.length}`);
  console.log(`Already geocoded: ${alreadyGeocoded}`);
  console.log(`Need geocoding: ${needsGeocoding.length}`);

  if (dryRun) {
    console.log("\n[DRY RUN] Would geocode:");
    needsGeocoding.slice(0, Math.min(limit, 20)).forEach((l) => {
      console.log(`  ${l.id}: "${buildQuery(l)}"`);
    });
    if (needsGeocoding.length > 20) console.log(`  ... and ${needsGeocoding.length - 20} more`);
    return;
  }

  const toProcess = needsGeocoding.slice(0, limit);
  console.log(`\nGeocoding ${toProcess.length} listings (${RATE_LIMIT_MS}ms between requests)...`);
  console.log(`Estimated time: ${Math.ceil(toProcess.length * RATE_LIMIT_MS / 60000)} minutes\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const listing = toProcess[i];
    const query = buildQuery(listing);
    const result = await geocode(query);

    if (result) {
      listing.latitude = result.lat;
      listing.longitude = result.lng;
      success++;
      if ((i + 1) % 50 === 0 || i === toProcess.length - 1) {
        console.log(`  [${i + 1}/${toProcess.length}] ✓ ${listing.city}, ${listing.state} (${result.lat.toFixed(4)}, ${result.lng.toFixed(4)})`);
      }
    } else {
      // Fall back to just city, state if full address failed
      if (listing.address) {
        const fallback = await geocode(`${listing.city}, ${listing.state}`);
        await sleep(RATE_LIMIT_MS);
        if (fallback) {
          listing.latitude = fallback.lat;
          listing.longitude = fallback.lng;
          success++;
          continue;
        }
      }
      failed++;
      console.log(`  [${i + 1}/${toProcess.length}] ✗ FAILED: "${query}" (${listing.id})`);
    }

    if (i < toProcess.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }

    // Save progress every 100 listings
    if ((i + 1) % 100 === 0) {
      fs.writeFileSync(LISTINGS_PATH, JSON.stringify(data, null, 2));
      console.log(`  → Saved progress (${i + 1} processed)`);
    }
  }

  // Final save
  fs.writeFileSync(LISTINGS_PATH, JSON.stringify(data, null, 2));

  console.log(`\nDone!`);
  console.log(`  Geocoded: ${success}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  File saved: ${LISTINGS_PATH}`);
}

main().catch(console.error);
