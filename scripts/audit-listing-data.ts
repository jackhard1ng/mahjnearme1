#!/usr/bin/env npx tsx
/**
 * Audit live listing data for the data-quality problems that are visible to
 * visitors, and emit a corrections file for apply-audit-corrections.ts.
 *
 * This does not write anything. It produces:
 *   - corrections.json  — safe, mechanical fixes, ready to apply
 *   - review.json       — problems that need a human decision (duplicates,
 *                         dead links), never auto-applied
 *
 * Usage:
 *   npx tsx scripts/audit-listing-data.ts
 *   npx tsx scripts/audit-listing-data.ts --url https://www.mahjnearme.com --out ./audit
 *   npx tsx scripts/audit-listing-data.ts --check-links        (slow: HTTP-checks every external URL)
 *
 * Then review corrections.json and apply it:
 *   ADMIN_KEY=... npx tsx scripts/apply-audit-corrections.ts audit/corrections.json --dry-run
 *   ADMIN_KEY=... npx tsx scripts/apply-audit-corrections.ts audit/corrections.json
 *
 * What gets auto-corrected (mechanical, no judgement required):
 *
 *   1. Leading/trailing whitespace in name, city, state, venueName.
 *      " Red Feather Lakes " sorts and groups separately from "Red Feather
 *      Lakes", so it fragments city pages and defeats duplicate detection.
 *
 *   2. A past `eventDate` on a recurring listing that has a real weekday
 *      schedule. `isEventExpired` deliberately never expires a recurring
 *      listing, so that stale date is dead data: the timing helper derives
 *      the next occurrence from `recurringSchedule` and ignores it. Clearing
 *      it prevents any surface that reads `eventDate` directly from
 *      rendering a date that has already passed.
 *
 * What is only reported, never auto-fixed:
 *
 *   - Duplicates. Merging means choosing which record's contact details,
 *     description and verification date survive. That is a human call.
 *   - Dead links. A 404 today may be a site reorganisation rather than a
 *     dead group, and removing a listing's only contact route is
 *     destructive. Verify before acting.
 *   - Recurring listings with a past eventDate but NO weekday schedule
 *     (e.g. annual retreats). For those the date may be the only timing
 *     information there is, so clearing it would lose data. Reported so the
 *     real recurrence can be filled in instead.
 */

import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const BASE_URL = args.includes("--url")
  ? args[args.indexOf("--url") + 1]
  : "https://www.mahjnearme.com";
const OUT_DIR = args.includes("--out") ? args[args.indexOf("--out") + 1] : "audit";
const CHECK_LINKS = args.includes("--check-links");

interface Listing {
  id: string;
  name: string;
  city: string;
  state: string;
  venueName?: string;
  type: string;
  status: string;
  isRecurring: boolean;
  eventDate: string | null;
  website?: string;
  registrationLink?: string;
  lastVerified?: string;
  recurringSchedule?: { dayOfWeek?: string } | null;
}

interface Correction {
  id: string;
  updates: Record<string, unknown>;
  reason: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}/;

/** Mirrors isEventExpired in src/lib/utils.ts. */
function isExpired(g: Listing, today: Date): boolean {
  if (g.isRecurring) return false;
  if (!g.eventDate || !DATE_RE.test(g.eventDate)) return false;
  const [y, m, d] = g.eventDate.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d) < today;
}

/** Normalised key for duplicate detection. */
function dupKey(g: Listing): string {
  const n = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return `${n(g.name)}|${n(g.city)}|${(g.state || "").trim().toUpperCase()}`;
}

async function checkUrl(url: string): Promise<number> {
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 20000);
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MahjNearMeLinkCheck/1.0)" },
    });
    clearTimeout(timer);
    return res.status;
  } catch {
    return 0; // unreachable: DNS failure, TLS error or timeout
  }
}

async function main() {
  console.log(`Fetching listings from ${BASE_URL}/api/listings ...`);
  const res = await fetch(`${BASE_URL}/api/listings`);
  if (!res.ok) {
    console.error(`Failed to fetch listings: ${res.status}`);
    process.exit(1);
  }
  const json = await res.json();
  const all: Listing[] = json.listings || json;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const visible = all.filter((g) => g.status === "active" && !isExpired(g, today));

  console.log(`\n  total listings   : ${all.length}`);
  console.log(`  visible to users : ${visible.length}`);
  console.log(`  hidden           : ${all.length - visible.length}\n`);

  const corrections: Correction[] = [];

  // --- 1. Whitespace ---
  let wsCount = 0;
  for (const g of all) {
    const updates: Record<string, string> = {};
    for (const f of ["name", "city", "state", "venueName"] as const) {
      const v = g[f];
      if (typeof v === "string" && v !== v.trim()) updates[f] = v.trim();
    }
    if (Object.keys(updates).length) {
      corrections.push({
        id: g.id,
        updates,
        reason: `Trim whitespace in ${Object.keys(updates).join(", ")} — untrimmed values fragment city grouping and defeat duplicate detection`,
      });
      wsCount++;
    }
  }

  // --- 2. Stale eventDate on scheduled recurring listings ---
  let staleCount = 0;
  const staleNoSchedule: Listing[] = [];
  for (const g of all) {
    if (g.status !== "active") continue;
    if (!g.isRecurring) continue;
    if (!g.eventDate || !DATE_RE.test(g.eventDate)) continue;
    const [y, m, d] = g.eventDate.slice(0, 10).split("-").map(Number);
    if (new Date(y, m - 1, d) >= today) continue;

    const hasWeekday = Boolean(g.recurringSchedule?.dayOfWeek?.trim());
    if (hasWeekday) {
      corrections.push({
        id: g.id,
        updates: { eventDate: null },
        reason: `Recurring listing carries a past one-off eventDate (${g.eventDate.slice(0, 10)}); timing comes from recurringSchedule.dayOfWeek="${g.recurringSchedule!.dayOfWeek}", so the stale date is dead data that can render as a false upcoming date`,
      });
      staleCount++;
    } else {
      staleNoSchedule.push(g);
    }
  }

  // --- 3. Duplicates (report only) ---
  const groups = new Map<string, Listing[]>();
  for (const g of visible) {
    const k = dupKey(g);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(g);
  }
  const duplicates = [...groups.entries()]
    .filter(([, v]) => v.length > 1)
    .map(([key, v]) => ({
      key,
      count: v.length,
      city: v[0].city.trim(),
      state: v[0].state.trim(),
      name: v[0].name.trim(),
      ids: v.map((x) => x.id),
    }))
    .sort((a, b) => b.count - a.count);
  const redundant = duplicates.reduce((a, d) => a + d.count - 1, 0);

  // --- 4. Links (report only, opt-in) ---
  const urlMap = new Map<string, string[]>();
  for (const g of visible) {
    for (const f of ["website", "registrationLink"] as const) {
      const u = g[f];
      if (u && /^https?:\/\//i.test(u)) {
        const key = u.trim();
        if (!urlMap.has(key)) urlMap.set(key, []);
        urlMap.get(key)!.push(g.id);
      }
    }
  }
  const brokenLinks: { url: string; status: number; listingIds: string[] }[] = [];
  if (CHECK_LINKS) {
    const urls = [...urlMap.keys()];
    console.log(`Checking ${urls.length} external URLs (this takes a while) ...`);
    const CONCURRENCY = 20;
    for (let i = 0; i < urls.length; i += CONCURRENCY) {
      const batch = urls.slice(i, i + CONCURRENCY);
      const statuses = await Promise.all(batch.map(checkUrl));
      batch.forEach((u, j) => {
        const s = statuses[j];
        // 403/406 are usually bot-blocking, not a dead page — don't flag them.
        if (s === 0 || s === 404 || s >= 500) {
          brokenLinks.push({ url: u, status: s, listingIds: urlMap.get(u)! });
        }
      });
      process.stdout.write(`  ${Math.min(i + CONCURRENCY, urls.length)}/${urls.length}\r`);
    }
    console.log("");
  }

  // --- Write output ---
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const correctionsPath = path.join(OUT_DIR, "corrections.json");
  const reviewPath = path.join(OUT_DIR, "review.json");

  fs.writeFileSync(correctionsPath, JSON.stringify(corrections, null, 2));
  fs.writeFileSync(
    reviewPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totals: {
          allListings: all.length,
          visibleListings: visible.length,
          hiddenListings: all.length - visible.length,
        },
        duplicates: { groups: duplicates.length, redundantListings: redundant, items: duplicates },
        recurringWithPastDateAndNoSchedule: staleNoSchedule.map((g) => ({
          id: g.id,
          name: g.name.trim(),
          city: g.city.trim(),
          state: g.state.trim(),
          eventDate: g.eventDate,
        })),
        brokenLinks: CHECK_LINKS ? brokenLinks : "not checked — rerun with --check-links",
      },
      null,
      2
    )
  );

  console.log("AUTO-CORRECTABLE");
  console.log(`  whitespace fixes                 : ${wsCount}`);
  console.log(`  stale eventDate cleared          : ${staleCount}`);
  console.log(`  -> ${correctionsPath} (${corrections.length} corrections)\n`);
  console.log("NEEDS REVIEW");
  console.log(`  duplicate groups                 : ${duplicates.length} (${redundant} redundant listings)`);
  console.log(`  recurring, past date, no schedule: ${staleNoSchedule.length}`);
  if (CHECK_LINKS) console.log(`  broken links                     : ${brokenLinks.length}`);
  console.log(`  -> ${reviewPath}\n`);
  console.log("Next:");
  console.log(`  ADMIN_KEY=... npx tsx scripts/apply-audit-corrections.ts ${correctionsPath} --dry-run`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
