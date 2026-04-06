#!/usr/bin/env npx tsx
/**
 * Apply audit corrections to Firebase listings via the admin API.
 *
 * Reads a JSON file of corrections and pushes each update to PUT /api/listings.
 *
 * Usage:
 *   npx tsx scripts/apply-audit-corrections.ts corrections.json
 *   npx tsx scripts/apply-audit-corrections.ts corrections.json --url https://www.mahjnearme.com --dry-run
 *
 * Input format (corrections.json):
 * [
 *   {
 *     "id": "listing-id-here",
 *     "updates": {
 *       "address": "123 Main St, Tulsa, OK 74103",
 *       "contactEmail": "updated@email.com",
 *       "status": "inactive"
 *     },
 *     "reason": "Address was incorrect per Google Maps verification"
 *   }
 * ]
 *
 * Alternative format (field-level changes):
 * [
 *   {
 *     "id": "listing-id-here",
 *     "field": "address",
 *     "oldValue": "wrong address",
 *     "newValue": "123 Main St, Tulsa, OK 74103",
 *     "reason": "Verified via Google Maps"
 *   }
 * ]
 *
 * Environment:
 *   ADMIN_KEY - The CRON_SECRET value for admin API authentication
 */

import fs from "fs";

const args = process.argv.slice(2);
const inputFile = args.find((a) => !a.startsWith("--"));
const dryRun = args.includes("--dry-run");
const BASE_URL = args.includes("--url")
  ? args[args.indexOf("--url") + 1]
  : "https://www.mahjnearme.com";
const ADMIN_KEY = process.env.ADMIN_KEY || "";

interface BulkCorrection {
  id: string;
  updates: Record<string, unknown>;
  reason?: string;
}

interface FieldCorrection {
  id: string;
  field: string;
  oldValue?: unknown;
  newValue: unknown;
  reason?: string;
}

type Correction = BulkCorrection | FieldCorrection;

function isBulkCorrection(c: Correction): c is BulkCorrection {
  return "updates" in c;
}

async function main() {
  if (!inputFile) {
    console.error("Usage: npx tsx scripts/apply-audit-corrections.ts <corrections.json> [--dry-run] [--url <base-url>]");
    process.exit(1);
  }

  if (!ADMIN_KEY && !dryRun) {
    console.error("Error: ADMIN_KEY environment variable is required (set to your CRON_SECRET value)");
    console.error("  Export it first: export ADMIN_KEY=your-secret-here");
    process.exit(1);
  }

  const raw = fs.readFileSync(inputFile, "utf-8");
  const corrections: Correction[] = JSON.parse(raw);

  console.log(`Loaded ${corrections.length} corrections from ${inputFile}`);
  console.log(`Target: ${BASE_URL}`);
  if (dryRun) console.log("DRY RUN — no changes will be made\n");

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < corrections.length; i++) {
    const c = corrections[i];

    // Normalize to { id, updates } format
    let id: string;
    let updates: Record<string, unknown>;
    let reason: string;

    if (isBulkCorrection(c)) {
      id = c.id;
      updates = c.updates;
      reason = c.reason || "";
    } else {
      id = c.id;
      updates = { [c.field]: c.newValue };
      reason = c.reason || `${c.field}: ${JSON.stringify(c.oldValue)} → ${JSON.stringify(c.newValue)}`;
    }

    if (!id) {
      console.log(`  [${i + 1}/${corrections.length}] SKIP — no ID`);
      skipped++;
      continue;
    }

    console.log(`  [${i + 1}/${corrections.length}] ${id} — ${reason || JSON.stringify(updates)}`);

    if (dryRun) {
      console.log(`    Would update: ${JSON.stringify(updates)}`);
      success++;
      continue;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/listings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": ADMIN_KEY,
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (res.ok) {
        console.log(`    OK`);
        success++;
      } else {
        const body = await res.text();
        console.log(`    FAILED (${res.status}): ${body}`);
        failed++;
      }

      // Rate limit: 100ms between requests to avoid overwhelming Firestore
      await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      console.log(`    ERROR: ${err}`);
      failed++;
    }
  }

  console.log(`\n--- Results ---`);
  console.log(`  Success: ${success}`);
  console.log(`  Failed:  ${failed}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Total:   ${corrections.length}`);
}

main().catch((err) => {
  console.error("Apply failed:", err);
  process.exit(1);
});
