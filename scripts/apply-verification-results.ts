#!/usr/bin/env npx tsx
/**
 * Apply verification audit results back to Firebase.
 *
 * Reads the completed verification-audit JSON (after Claudington fills in
 * the audit fields) and pushes updates to listings via PUT /api/listings.
 *
 * Usage:
 *   npx tsx scripts/apply-verification-results.ts verification-audit-2026-04-06.json --dry-run
 *   ADMIN_KEY=your-secret npx tsx scripts/apply-verification-results.ts verification-audit-2026-04-06.json
 *
 * What it does for each audit status:
 *   - verified:        marks listing as verified=true, lastVerified=today
 *   - cannot_verify:   no change (flag for manual review)
 *   - dead_link:       clears broken URL fields
 *   - event_ended:     sets status="inactive"
 *   - info_mismatch:   applies correctedFields as updates
 *   - suspicious:      sets status="inactive" (flag for manual review)
 */

import fs from "fs";

const args = process.argv.slice(2);
const inputFile = args.find((a) => !a.startsWith("--"));
const dryRun = args.includes("--dry-run");
const BASE_URL = args.includes("--url")
  ? args[args.indexOf("--url") + 1]
  : "https://www.mahjnearme.com";
const ADMIN_KEY = process.env.ADMIN_KEY || "";

interface AuditResult {
  status: string;
  notes: string;
  correctedFields: Record<string, unknown>;
  checkedAt: string;
}

interface VerificationItem {
  id: string;
  name: string;
  city: string;
  state: string;
  audit: AuditResult;
}

interface AuditFile {
  listings: VerificationItem[];
}

async function main() {
  if (!inputFile) {
    console.error("Usage: npx tsx scripts/apply-verification-results.ts <audit-file.json> [--dry-run] [--url <base-url>]");
    process.exit(1);
  }

  if (!ADMIN_KEY && !dryRun) {
    console.error("Error: ADMIN_KEY environment variable required (your CRON_SECRET)");
    console.error("  export ADMIN_KEY=your-secret-here");
    process.exit(1);
  }

  const raw = fs.readFileSync(inputFile, "utf-8");
  const auditFile: AuditFile = JSON.parse(raw);
  const listings = auditFile.listings || [];

  // Only process listings where Claudington filled in an audit status
  const audited = listings.filter((l) => l.audit?.status && l.audit.status !== "");
  const skippedNoAudit = listings.length - audited.length;

  console.log(`Loaded ${listings.length} listings, ${audited.length} have audit results`);
  if (skippedNoAudit > 0) {
    console.log(`  (${skippedNoAudit} not yet audited — skipping)`);
  }
  console.log(`Target: ${BASE_URL}`);
  if (dryRun) console.log("DRY RUN — no changes will be made");

  const today = new Date().toISOString().split("T")[0];
  const counts: Record<string, number> = {
    verified: 0,
    cannot_verify: 0,
    dead_link: 0,
    event_ended: 0,
    info_mismatch: 0,
    suspicious: 0,
    updated: 0,
    failed: 0,
    no_action: 0,
  };

  for (let i = 0; i < audited.length; i++) {
    const item = audited[i];
    const { audit } = item;
    counts[audit.status] = (counts[audit.status] || 0) + 1;

    let updates: Record<string, unknown> = {};
    let action = "";

    switch (audit.status) {
      case "verified":
        updates = { verified: true, lastVerified: today };
        action = "mark verified";
        break;

      case "event_ended":
        updates = { status: "inactive" };
        action = "set inactive (event ended)";
        break;

      case "suspicious":
        updates = { status: "inactive" };
        action = "set inactive (suspicious)";
        break;

      case "dead_link":
        // Only clear URLs that were actually broken — auditor should note which in correctedFields
        if (Object.keys(audit.correctedFields).length > 0) {
          updates = { ...audit.correctedFields };
          action = `clear broken URLs: ${Object.keys(audit.correctedFields).join(", ")}`;
        } else {
          action = "dead link flagged (no specific field corrections — needs manual review)";
          counts.no_action++;
        }
        break;

      case "info_mismatch":
        if (Object.keys(audit.correctedFields).length > 0) {
          updates = { ...audit.correctedFields };
          action = `correct fields: ${Object.keys(audit.correctedFields).join(", ")}`;
        } else {
          action = "info mismatch flagged but no corrections provided — needs manual review";
          counts.no_action++;
        }
        break;

      case "cannot_verify":
        action = "cannot verify — no action taken, flagged for manual review";
        counts.no_action++;
        break;

      default:
        action = `unknown status "${audit.status}" — skipping`;
        counts.no_action++;
        break;
    }

    const label = `[${i + 1}/${audited.length}] ${item.name} (${item.city}, ${item.state})`;
    console.log(`\n${label}`);
    console.log(`  Status: ${audit.status} — ${action}`);
    if (audit.notes) console.log(`  Notes: ${audit.notes}`);

    if (Object.keys(updates).length === 0) {
      continue;
    }

    if (dryRun) {
      console.log(`  Would update: ${JSON.stringify(updates)}`);
      counts.updated++;
      continue;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/listings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": ADMIN_KEY,
        },
        body: JSON.stringify({ id: item.id, ...updates }),
      });

      if (res.ok) {
        console.log(`  Updated OK`);
        counts.updated++;
      } else {
        const body = await res.text();
        console.log(`  FAILED (${res.status}): ${body}`);
        counts.failed++;
      }

      await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      console.log(`  ERROR: ${err}`);
      counts.failed++;
    }
  }

  console.log(`\n--- Results ---`);
  console.log(`Audit statuses:`);
  console.log(`  Verified:        ${counts.verified}`);
  console.log(`  Event ended:     ${counts.event_ended}`);
  console.log(`  Info mismatch:   ${counts.info_mismatch}`);
  console.log(`  Dead link:       ${counts.dead_link}`);
  console.log(`  Cannot verify:   ${counts.cannot_verify}`);
  console.log(`  Suspicious:      ${counts.suspicious}`);
  console.log(`\nActions:`);
  console.log(`  Updated:         ${counts.updated}`);
  console.log(`  Failed:          ${counts.failed}`);
  console.log(`  No action taken: ${counts.no_action}`);

  // Write a summary report
  const summaryItems = audited
    .filter((l) => l.audit.status !== "verified")
    .map((l) => ({
      id: l.id,
      name: l.name,
      location: `${l.city}, ${l.state}`,
      status: l.audit.status,
      notes: l.audit.notes,
      corrections: l.audit.correctedFields,
    }));

  if (summaryItems.length > 0) {
    const summaryPath = inputFile.replace(".json", "-issues.json");
    fs.writeFileSync(summaryPath, JSON.stringify(summaryItems, null, 2), "utf-8");
    console.log(`\nIssues summary written to: ${summaryPath}`);
  }
}

main().catch((err) => {
  console.error("Apply failed:", err);
  process.exit(1);
});
