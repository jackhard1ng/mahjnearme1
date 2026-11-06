#!/usr/bin/env npx tsx
/**
 * Audit live listing data for the data-quality problems that are visible to
 * visitors, and emit a corrections file for apply-audit-corrections.ts.
 *
 * This does not write anything. It produces:
 *   - corrections.json  — safe, mechanical fixes, ready to apply
 *   - dedupe.json       — duplicate merges, kept separate so they can be
 *                         reviewed and applied independently
 *   - review.json       — what needs a human decision, never auto-applied
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
 *   3. Duplicate merges, written to a SEPARATE dedupe.json so they can be
 *      reviewed and applied independently of the mechanical fixes.
 *      Records are grouped by name+city+state+day+startTime — NOT by name
 *      alone. A club meeting several times a week files one listing per
 *      session under one name, so a name-only key treats real sessions as
 *      duplicates. One record per group is kept and the rest are set to
 *      status "inactive" — never deleted, so the decision is reversible. The keeper is chosen by, in order: a human-owned record
 *      (claimed or organizer-edited) > promoted > verified > most fields
 *      filled > most recently verified > lowest id for determinism.
 *      Before the losers are deactivated, any field the keeper is missing
 *      is backfilled from them, so merging cannot drop a phone number,
 *      website or address that only the duplicate had.
 *
 *      A group with two or more human-owned records is skipped entirely:
 *      deactivating a listing an organizer claimed is not a call to make
 *      automatically.
 *
 * What is only reported, never auto-fixed:
 *
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
import { streetAddressOnly, normalizeWebsiteUrl, instagramHandle } from "../src/lib/utils";

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
  address?: string;
  type: string;
  status: string;
  isRecurring: boolean;
  eventDate: string | null;
  website?: string;
  instagram?: string;
  registrationLink?: string;
  lastVerified?: string;
  recurringSchedule?: { dayOfWeek?: string; startTime?: string } | null;
  claimedBy?: string | null;
  organizerEdited?: boolean;
  promoted?: boolean;
  verified?: boolean;
  [key: string]: unknown;
}

/**
 * Fields worth carrying from a duplicate onto the keeper when the keeper has
 * nothing in them. Deliberately excludes geopoint, eventDate,
 * recurringSchedule, status, counts and flags — those describe *which*
 * record this is, and mixing them across records would produce a listing
 * that never existed.
 */
const BACKFILL_FIELDS = [
  "website", "registrationLink", "contactEmail", "contactPhone", "contactName",
  "organizerName", "address", "venueName", "description", "howToJoin",
  "instagram", "facebookGroup", "costAmount", "whatToBring", "typicalGroupSize",
  "generalArea", "metroRegion",
] as const;

function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
}

/** Human-owned records are maintained by a real person — never auto-deactivate one. */
function isHumanOwned(g: Listing): boolean {
  return Boolean(g.claimedBy) || Boolean(g.organizerEdited);
}

function filledCount(g: Listing): number {
  return Object.keys(g).filter((k) => !isEmpty(g[k])).length;
}

/**
 * Rank duplicates so the most authoritative, most complete record survives.
 * Lower sorts first (= kept).
 */
function compareForKeep(a: Listing, b: Listing): number {
  const score = (g: Listing) =>
    (isHumanOwned(g) ? 8 : 0) + (g.promoted ? 4 : 0) + (g.verified ? 2 : 0);
  if (score(a) !== score(b)) return score(b) - score(a);
  const fa = filledCount(a), fb = filledCount(b);
  if (fa !== fb) return fb - fa;
  const va = a.lastVerified || "", vb = b.lastVerified || "";
  if (va !== vb) return vb.localeCompare(va);
  return a.id.localeCompare(b.id); // deterministic
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

const DAY_NAMES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const ID_DAY_RE = new RegExp(`-(${DAY_NAMES.join("|")})(?:-|$)`);

/**
 * The day a listing actually runs, preferring the structured field and falling
 * back to the day encoded in the id (ids were generated from structured data
 * at import, so `...-huntersville-nc-tuesday-...` is trustworthy).
 */
function scheduleDay(g: Listing): string {
  const s = (g.recurringSchedule?.dayOfWeek || "").trim().toLowerCase();
  if (s) return s;
  const m = g.id.match(ID_DAY_RE);
  return m ? m[1] : "";
}

/**
 * Normalised key for duplicate detection.
 *
 * The day and start time are part of the key, not just name+city+state. A club
 * that meets several times a week files one listing per session under the same
 * name — Huntersville NC has four separate "American Mahjong" sessions on
 * Monday, Tuesday, Wednesday and Thursday. Keying on the name alone treats
 * those as duplicates and would deactivate three real sessions, deleting
 * inventory rather than cleaning it.
 */
function dupKey(g: Listing): string {
  const n = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const day = scheduleDay(g);
  const time = (g.recurringSchedule?.startTime || "").trim();
  return `${n(g.name)}|${n(g.city)}|${(g.state || "").trim().toUpperCase()}|${day}|${time}`;
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

  // --- 1b. Addresses with the locality baked in ---
  // The event JSON-LD sets streetAddress from this field while also emitting
  // addressLocality and addressRegion, so a stored "410 15th Street, Oakland,
  // CA 94612" hands search engines a PostalAddress that repeats the city and
  // state inside the street. For a directory that depends on local search,
  // that is worth correcting in the data as well as at render time.
  let addrCount = 0;
  let addrCleared = 0;
  for (const g of all) {
    if (g.status !== "active") continue;
    const current = (g.address || "").trim();
    if (!current) continue;
    const street = streetAddressOnly(current, g.city, g.state);
    if (street === current) continue;
    if (street === "") addrCleared++;
    corrections.push({
      id: g.id,
      updates: { address: street },
      reason:
        street === ""
          ? `Address held only the locality ("${current}"), which addressLocality/addressRegion already carry — cleared so streetAddress is not populated with a city`
          : `Strip locality from address: "${current}" -> "${street}". The schema and the JSON-LD both expect street-only`,
    });
    addrCount++;
  }

  // --- 1c. Broken and swapped link fields ---
  // A website with no scheme ("beachmahj.com") resolves RELATIVE to the
  // current page once it reaches an href, so the link lands back on
  // mahjnearme.com instead of the organiser. The two fields are also mixed
  // up in both directions: Instagram handles filed under website, and full
  // URLs filed under instagram (which produced instagram.com/https://...).
  let linkFixes = 0;
  for (const g of all) {
    if (g.status !== "active") continue;
    const rawSite = (g.website || "").trim();
    const rawIg = (g.instagram || "").trim();
    const updates: Record<string, unknown> = {};
    const notes: string[] = [];

    // A handle sitting in website belongs in instagram.
    if (rawSite.startsWith("@")) {
      updates.website = "";
      notes.push(`moved "${rawSite}" out of website (it is a handle, not a site)`);
      if (!rawIg) {
        updates.instagram = rawSite;
        notes.push("filed it under instagram instead");
      }
    } else if (rawSite && !/^https?:\/\//i.test(rawSite)) {
      const fixed = normalizeWebsiteUrl(rawSite);
      if (fixed) {
        updates.website = fixed;
        notes.push(`added the missing scheme: "${rawSite}" -> "${fixed}"`);
      }
    }

    // Normalise instagram to a bare @handle; blank it when it is not one.
    if (rawIg) {
      const handle = instagramHandle(rawIg);
      if (handle && rawIg !== `@${handle}`) {
        updates.instagram = `@${handle}`;
        notes.push(`normalised instagram "${rawIg}" -> "@${handle}"`);
      } else if (!handle) {
        const asSite = normalizeWebsiteUrl(rawIg);
        updates.instagram = "";
        notes.push(`cleared instagram "${rawIg}" — not an Instagram profile, so it linked to instagram.com/${rawIg}`);
        if (asSite && !rawSite) {
          updates.website = asSite;
          notes.push(`kept it as the website instead`);
        }
      }
    }

    if (Object.keys(updates).length) {
      corrections.push({ id: g.id, updates, reason: notes.join("; ") });
      linkFixes++;
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
      day: scheduleDay(v[0]) || "(unknown)",
      ids: v.map((x) => x.id),
    }))
    .sort((a, b) => b.count - a.count);
  const redundant = duplicates.reduce((a, d) => a + d.count - 1, 0);

  // --- 3b. Duplicate merges (separate file, opt-in via --dedupe) ---
  const dedupe: Correction[] = [];
  const dedupeSkipped: { key: string; reason: string; ids: string[] }[] = [];
  let deactivated = 0;
  let backfilled = 0;

  for (const [key, members] of groups) {
    if (members.length < 2) continue;

    const owned = members.filter(isHumanOwned);
    if (owned.length > 1) {
      dedupeSkipped.push({
        key,
        reason: `${owned.length} records are claimed or organizer-edited — deactivating a listing a real organizer maintains needs a human decision`,
        ids: members.map((m) => m.id),
      });
      continue;
    }

    const ranked = [...members].sort(compareForKeep);
    const keeper = ranked[0];
    const losers = ranked.slice(1);

    // Backfill anything the keeper is missing, so merging loses no contact route.
    const fill: Record<string, unknown> = {};
    for (const f of BACKFILL_FIELDS) {
      if (!isEmpty(keeper[f])) continue;
      const donor = losers.find((l) => !isEmpty(l[f]));
      if (donor) fill[f] = donor[f];
    }
    if (Object.keys(fill).length) {
      dedupe.push({
        id: keeper.id,
        updates: fill,
        reason: `Merge duplicates of "${keeper.name.trim()}" (${keeper.city.trim()}, ${keeper.state.trim()}): backfill ${Object.keys(fill).join(", ")} from ${losers.length} duplicate record(s) before deactivating them`,
      });
      backfilled++;
    }

    for (const l of losers) {
      dedupe.push({
        id: l.id,
        updates: { status: "inactive" },
        reason: `Duplicate of ${keeper.id} — same name+city+state. Keeper chosen by human-owned > promoted > verified > most complete > most recently verified. Set inactive rather than deleted, so this is reversible.`,
      });
      deactivated++;
    }
  }

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
  const dedupePath = path.join(OUT_DIR, "dedupe.json");
  fs.writeFileSync(dedupePath, JSON.stringify(dedupe, null, 2));
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
        duplicates: { groups: duplicates.length, redundantListings: redundant, skippedForReview: dedupeSkipped, items: duplicates },
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
  console.log(`  addresses reduced to street only : ${addrCount}`);
  console.log(`    ...of which cleared entirely   : ${addrCleared}`);
  console.log(`  broken / swapped link fields     : ${linkFixes}`);
  console.log(`  -> ${correctionsPath} (${corrections.length} corrections)\n`);
  console.log("DUPLICATE MERGE (apply separately, after reviewing)");
  console.log(`  duplicate groups                 : ${duplicates.length} (${redundant} redundant listings)`);
  console.log(`  listings deactivated             : ${deactivated}`);
  console.log(`  keepers backfilled first         : ${backfilled}`);
  console.log(`  groups skipped (multi-owner)     : ${dedupeSkipped.length}`);
  console.log(`  -> ${dedupePath} (${dedupe.length} operations)\n`);
  console.log("NEEDS REVIEW");
  console.log(`  recurring, past date, no schedule: ${staleNoSchedule.length}`);
  if (CHECK_LINKS) console.log(`  broken links                     : ${brokenLinks.length}`);
  console.log(`  -> ${reviewPath}\n`);
  console.log("Next:");
  console.log(`  ADMIN_KEY=... npx tsx scripts/apply-audit-corrections.ts ${correctionsPath} --dry-run`);
  console.log(`  ADMIN_KEY=... npx tsx scripts/apply-audit-corrections.ts ${dedupePath} --dry-run`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
