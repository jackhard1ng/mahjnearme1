#!/usr/bin/env node
/**
 * Apply queued listing corrections, safely and reversibly.
 *
 * PREPARED BUT NOT RUN. Dry-run is the default; writing requires --apply AND an
 * explicit allowlist. Nothing in this file has been executed against production.
 *
 * Why this exists rather than scripts/apply-audit-corrections.ts: that script
 * pushes every entry in the file at whatever the database currently holds, with
 * no precondition check and no rollback. audit/corrections.json was built from
 * a read taken on 2026-11-05 and holds 2,400+ entries; by the time it runs, any
 * record may have been edited by an organizer or an admin, and a correction
 * derived from the old value could silently undo that edit.
 *
 * Guarantees:
 *   1. Dry-run unless --apply is passed.
 *   2. Nothing is written unless its id is in an explicit allowlist.
 *   3. Every record is re-read first and compared against
 *      audit/pre-apply-snapshot.json. A changed updatedAt, or a changed value
 *      in any field the correction touches, aborts that record.
 *   4. Before/after is printed for every field.
 *   5. A backup of the pre-write state and a ready-to-run rollback file are
 *      written before the first write.
 *   6. Schedule and recurrence corrections are excluded unless
 *      --include-schedule is passed, because getting one wrong hides a live
 *      listing or resurrects an ended one.
 *   7. --limit caps how many records a single run may touch.
 *
 * Usage:
 *   # see what would happen (default)
 *   node --experimental-strip-types scripts/apply-corrections-safely.ts --allow-ids XGMtSTWbOiDniiMCn8IS
 *
 *   # same, from a file of ids (one per line, # comments allowed)
 *   node --experimental-strip-types scripts/apply-corrections-safely.ts --allow audit/approved-ids.txt
 *
 *   # actually write
 *   ADMIN_KEY=... node --experimental-strip-types scripts/apply-corrections-safely.ts \
 *     --allow audit/approved-ids.txt --apply
 *
 *   # roll back a run
 *   ADMIN_KEY=... node --experimental-strip-types scripts/apply-corrections-safely.ts \
 *     --allow audit/approved-ids.txt --from audit/rollback-<stamp>.json --apply
 *
 * Environment:
 *   ADMIN_KEY  CRON_SECRET value, required only with --apply
 *   BASE_URL   defaults to https://www.mahjnearme.com
 */

import fs from "node:fs";
import path from "node:path";

type Correction = {
  id: string;
  updates?: Record<string, unknown>;
  field?: string;
  newValue?: unknown;
  reason?: string;
  source?: string;
};

type Snapshot = {
  records: Record<string, { updatedAt: string | null; before: Record<string, unknown> }>;
};

/** Fields whose correction can hide a live listing or revive an ended one. */
const SCHEDULE_FIELDS = new Set([
  "isRecurring",
  "recurringSchedule",
  "eventDate",
  "eventEndDate",
  "eventStartTime",
  "eventEndTime",
  "status",
]);

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}
function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

const APPLY = flag("apply");
const INCLUDE_SCHEDULE = flag("include-schedule");
const LIMIT = Number(arg("limit") || 0) || Infinity;
const BASE_URL = (process.env.BASE_URL || "https://www.mahjnearme.com").replace(/\/$/, "");
const SOURCE_FILE = arg("from") || "audit/corrections.json";
const SNAPSHOT_FILE = arg("snapshot") || "audit/pre-apply-snapshot.json";

function loadAllowlist(): Set<string> {
  const ids = arg("allow-ids");
  if (ids) return new Set(ids.split(",").map((s) => s.trim()).filter(Boolean));
  const file = arg("allow");
  if (file) {
    return new Set(
      fs
        .readFileSync(file, "utf8")
        .split("\n")
        .map((l) => l.replace(/#.*$/, "").trim())
        .filter(Boolean)
    );
  }
  return new Set();
}

function normalize(c: Correction): { id: string; updates: Record<string, unknown> } | null {
  if (c.updates && Object.keys(c.updates).length) return { id: c.id, updates: c.updates };
  if (c.field) return { id: c.id, updates: { [c.field]: c.newValue } };
  return null;
}

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

async function getListing(id: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${BASE_URL}/api/listings?id=${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GET ${id} failed: HTTP ${res.status}`);
  const body = (await res.json()) as { listing: Record<string, unknown> | null };
  return body.listing;
}

async function putListing(payload: Record<string, unknown>): Promise<void> {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) throw new Error("ADMIN_KEY is required with --apply");
  const res = await fetch(`${BASE_URL}/api/listings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`PUT ${payload.id} failed: HTTP ${res.status} ${JSON.stringify(body)}`);
  }
  // The route echoes the stored record back; treat a missing echo as a failure
  // rather than assuming the write landed.
  if (!(body as { listing?: unknown }).listing) {
    throw new Error(`PUT ${payload.id}: server did not echo the stored record`);
  }
}

async function main() {
  const allow = loadAllowlist();
  if (allow.size === 0) {
    console.error(
      "Refusing to run with an empty allowlist.\n" +
        "Pass --allow-ids <id,id> or --allow <file>. This is deliberate: the queued\n" +
        "corrections file holds thousands of entries and none of them should be\n" +
        "applied just because they are present."
    );
    process.exit(2);
  }

  const corrections = JSON.parse(fs.readFileSync(SOURCE_FILE, "utf8")) as Correction[];
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, "utf8")) as Snapshot;

  // Collapse multiple corrections for one record into a single write, so a
  // record is read once, checked once and written once.
  const merged = new Map<string, { updates: Record<string, unknown>; reasons: string[] }>();
  let skippedNotAllowed = 0;
  let skippedSchedule = 0;

  for (const c of corrections) {
    const n = normalize(c);
    if (!n) continue;
    if (!allow.has(n.id)) {
      skippedNotAllowed++;
      continue;
    }
    const scheduleKeys = Object.keys(n.updates).filter((k) => SCHEDULE_FIELDS.has(k));
    if (scheduleKeys.length && !INCLUDE_SCHEDULE) {
      skippedSchedule++;
      console.log(
        `  SKIP  ${n.id}  schedule/status fields (${scheduleKeys.join(", ")}) ` +
          `require --include-schedule`
      );
      continue;
    }
    const entry = merged.get(n.id) || { updates: {}, reasons: [] };
    Object.assign(entry.updates, n.updates);
    if (c.reason) entry.reasons.push(c.reason);
    merged.set(n.id, entry);
  }

  console.log(
    `\nmode: ${APPLY ? "APPLY (writes)" : "DRY RUN (no writes)"}` +
      `   base: ${BASE_URL}\n` +
      `allowlisted ids: ${allow.size}   records to process: ${merged.size}\n` +
      `skipped (not allowlisted): ${skippedNotAllowed}   ` +
      `skipped (schedule, needs --include-schedule): ${skippedSchedule}\n`
  );

  const backup: Record<string, Record<string, unknown>> = {};
  const rollback: Correction[] = [];
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  let applied = 0;
  let blocked = 0;
  let noop = 0;

  for (const [id, { updates, reasons }] of merged) {
    if (applied >= LIMIT) {
      console.log(`\nreached --limit ${LIMIT}; stopping.`);
      break;
    }

    const live = await getListing(id);
    if (!live) {
      console.log(`  BLOCK ${id}  not found in the database`);
      blocked++;
      continue;
    }

    const snap = snapshot.records[id];
    if (!snap) {
      console.log(`  BLOCK ${id}  no precondition baseline; re-run the snapshot`);
      blocked++;
      continue;
    }

    // Precondition 1: the record has not been touched since the audit.
    if (snap.updatedAt && live.updatedAt !== snap.updatedAt) {
      console.log(
        `  BLOCK ${id}  changed since the audit\n` +
          `          updatedAt was ${snap.updatedAt}, now ${String(live.updatedAt)}`
      );
      blocked++;
      continue;
    }

    // Precondition 2: every field being corrected still holds the value the
    // audit saw. Catches an edit made without updatedAt moving.
    const drifted = Object.keys(updates).filter(
      (f) => f in snap.before && !same(live[f], snap.before[f])
    );
    if (drifted.length) {
      console.log(`  BLOCK ${id}  fields changed since the audit: ${drifted.join(", ")}`);
      for (const f of drifted) {
        console.log(
          `          ${f}: audit saw ${JSON.stringify(snap.before[f])}, now ${JSON.stringify(live[f])}`
        );
      }
      blocked++;
      continue;
    }

    // Nothing to do?
    const changing = Object.keys(updates).filter((f) => !same(live[f], updates[f]));
    if (changing.length === 0) {
      noop++;
      continue;
    }

    console.log(`  ${APPLY ? "WRITE" : "WOULD"} ${id}`);
    for (const f of changing) {
      console.log(`          ${f}: ${JSON.stringify(live[f])}  ->  ${JSON.stringify(updates[f])}`);
    }
    if (reasons.length) console.log(`          reason: ${reasons[0].slice(0, 160)}`);

    backup[id] = Object.fromEntries(changing.map((f) => [f, live[f] ?? null]));
    rollback.push({
      id,
      updates: Object.fromEntries(changing.map((f) => [f, live[f] ?? null])),
      reason: `Rollback of correction run ${stamp}`,
    });

    if (APPLY) {
      // Write the backup and rollback files BEFORE the first write, so an
      // interrupted run is still reversible.
      if (applied === 0) {
        fs.mkdirSync("audit", { recursive: true });
        fs.writeFileSync(
          path.join("audit", `backup-${stamp}.json`),
          JSON.stringify({ stamp, baseUrl: BASE_URL, backup }, null, 2)
        );
        fs.writeFileSync(
          path.join("audit", `rollback-${stamp}.json`),
          JSON.stringify(rollback, null, 2)
        );
      }
      await putListing({ id, ...updates });
      // Keep the rollback file current as the run proceeds.
      fs.writeFileSync(
        path.join("audit", `rollback-${stamp}.json`),
        JSON.stringify(rollback, null, 2)
      );
      fs.writeFileSync(
        path.join("audit", `backup-${stamp}.json`),
        JSON.stringify({ stamp, baseUrl: BASE_URL, backup }, null, 2)
      );
      applied++;
    } else {
      applied++;
    }
  }

  console.log(
    `\n${APPLY ? "applied" : "would apply"}: ${applied}   blocked: ${blocked}   ` +
      `already correct: ${noop}`
  );
  if (APPLY && applied > 0) {
    console.log(
      `backup:   audit/backup-${stamp}.json\n` +
        `rollback: audit/rollback-${stamp}.json\n` +
        `to revert: --from audit/rollback-${stamp}.json --apply (with the same --allow)`
    );
  }
  if (!APPLY) {
    console.log("\nno writes were made. add --apply, with ADMIN_KEY set, to write.");
  }
  if (blocked > 0) {
    console.log(
      `\n${blocked} record(s) were blocked. Re-read those records, confirm the` +
        ` correction is still right, regenerate the snapshot, and run again.`
    );
  }
}

main().catch((err) => {
  console.error("\nfailed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
