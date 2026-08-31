#!/usr/bin/env npx tsx
/**
 * Check every listing in research/mahjong-listings-*.json before anyone
 * imports it into Firestore.
 *
 *   npx tsx scripts/validate-research-listings.ts
 *   npx tsx scripts/validate-research-listings.ts --dir research
 *
 * These files are written by hand and by scripts/discover-meetup-groups.ts,
 * and they accumulate across batches, so the checks that matter are the ones
 * a single batch cannot make: an id reused between batches, the same session
 * written up twice from two different runs, an enum value that is nearly right.
 *
 * Each rule below exists because something actually got through:
 *
 *   - A one-off event carried frequency "weekly", which asserts a cadence the
 *     event does not have. Non-recurring listings must leave dayOfWeek and
 *     frequency empty.
 *   - A recurring listing with no dayOfWeek renders "Schedule TBD", sorts
 *     last, and never appears in any "what's on this week" surface.
 *   - An address arrived as "12911 Pacific Point Pl, San Diego, CA 92130".
 *     The event JSON-LD emits streetAddress next to addressLocality and
 *     addressRegion, so a locality inside the street field produces a
 *     PostalAddress that repeats itself — bad structured data for a directory
 *     that lives on local search.
 *   - Round 3 rediscovered a venue round 1 had already written up, because
 *     dedupe only ran against the live site.
 *
 * The locality check anchors on a comma. Without that it flags "1199 Wilmette
 * Ave" in Wilmette and "39352 Fremont Blvd" in Fremont, which are streets
 * named after their town, not addresses with the town appended.
 */

import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const DIR = args.includes("--dir") ? args[args.indexOf("--dir") + 1] : "research";

const TYPES = new Set(["open_play", "lesson", "league", "event", "private"]);
const STYLES = new Set(["american", "chinese", "riichi", "other"]);
const FREQ = new Set(["weekly", "biweekly", "monthly", "first_tuesday", "first_wednesday", "first_thursday", "last_friday"]);
const DAYS = new Set(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]);

const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const esc = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

type Listing = Record<string, unknown>;

/**
 * Venue -> address as the discovery runs actually recorded it.
 *
 * The listing JSONs are written by hand from those runs, and a hand-written
 * address can be wrong in a way nothing else catches: this batch shipped
 * Element Eatery at "3729 Spring Grove Ave" when its Meetup venue record says
 * 5350 Medpace Way. An address that looks plausible and is not the one in the
 * source is worse than a missing one, because nothing about it reads as wrong.
 */
/** Case, whitespace and trailing punctuation are not differences worth failing on. */
function normAddr(v: string): string {
  return v.toLowerCase().replace(/\s+/g, " ").replace(/[.,\s]+$/, "").trim();
}

function discoveredAddresses(dir: string): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const f of fs.readdirSync(dir)) {
    if (!/^meetup-discovery-.*\.json$/.test(f)) continue;
    let run: { candidates?: { venueName?: string; address?: string; city?: string }[] };
    try {
      run = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    } catch {
      continue;
    }
    for (const c of run.candidates || []) {
      const v = s(c.venueName);
      const a = s(c.address);
      if (!v || !a) continue;
      const key = `${v.toLowerCase()}|${s(c.city).toLowerCase()}`;
      if (!out.has(key)) out.set(key, new Set());
      out.get(key)!.add(a);
    }
  }
  return out;
}

const problems: string[] = [];
const warnings: string[] = [];
const ids = new Map<string, string>();
const sessions = new Map<string, string>();
let total = 0;

const discovered = discoveredAddresses(DIR);

const files = fs
  .readdirSync(DIR)
  .filter((f) => /^mahjong-listings-.*\.json$/.test(f))
  .sort();

for (const file of files) {
  let listings: Listing[];
  try {
    listings = JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8")).listings || [];
  } catch (e) {
    problems.push(`${file}: could not be parsed — ${(e as Error).message}`);
    continue;
  }

  for (const l of listings) {
    total++;
    const id = s(l.id);
    const at = `${file}:${id || "(no id)"}`;
    if (!id) problems.push(`${at}  has no id`);

    if (ids.has(id)) problems.push(`${at}  reuses an id already used in ${ids.get(id)}`);
    else ids.set(id, file);

    if (!TYPES.has(s(l.type))) problems.push(`${at}  type "${s(l.type)}" is not a GameType`);
    if (!STYLES.has(s(l.gameStyle))) problems.push(`${at}  gameStyle "${s(l.gameStyle)}" is not a GameStyle`);
    if (!s(l.city)) problems.push(`${at}  has no city`);
    if (!/^[A-Z]{2}$/.test(s(l.state))) problems.push(`${at}  state "${s(l.state)}" is not a 2-letter code (production uses codes, not names)`);

    const day = s(l.dayOfWeek);
    if (l.isRecurring) {
      if (!day) problems.push(`${at}  is recurring but has no dayOfWeek — it would render "Schedule TBD"`);
      if (!FREQ.has(s(l.frequency))) problems.push(`${at}  frequency "${s(l.frequency)}" is not a Frequency`);
      if (s(l.eventDate)) problems.push(`${at}  is recurring but also carries an eventDate`);
    } else {
      if (!s(l.eventDate)) problems.push(`${at}  is not recurring and has no eventDate — nothing can place it in time`);
      if (day || s(l.frequency)) problems.push(`${at}  is a one-off but carries a schedule (dayOfWeek "${day}", frequency "${s(l.frequency)}")`);
    }
    for (const d of day.split("|").filter(Boolean)) {
      if (!DAYS.has(d)) problems.push(`${at}  dayOfWeek contains "${d}"`);
    }

    const addr = s(l.address);
    const city = s(l.city);
    const state = s(l.state);
    if (addr && city && new RegExp(`,\\s*${esc(city)}\\b`, "i").test(addr)) {
      problems.push(`${at}  address repeats the city: "${addr}"`);
    }
    if (addr && state && new RegExp(`,\\s*${esc(state)}\\b`, "i").test(addr)) {
      problems.push(`${at}  address repeats the state: "${addr}"`);
    }
    // Cross-check the address against what the discovery run recorded. Venue
    // names differ slightly between a run and a write-up ("Dengeos" vs
    // "Dengeos - Buffalo Grove"), so match either direction of containment.
    if (addr && s(l.venueName)) {
      const vn = s(l.venueName).toLowerCase();
      const cy = city.toLowerCase();
      for (const [key, addrs] of discovered) {
        const [dv, dc] = key.split("|");
        if (dc !== cy) continue;
        if (!dv.startsWith(vn) && !vn.startsWith(dv)) continue;
        // Compare normalised: the write-up legitimately trims the locality out
        // of the street field and drops trailing punctuation, so the listing
        // value being a prefix of the recorded one is correct, not a defect.
        const na = normAddr(addr);
        const okAddr = [...addrs].some((x) => {
          const nx = normAddr(x);
          return nx === na || nx.startsWith(na + ",") || nx.startsWith(na + " ");
        });
        if (!okAddr) {
          problems.push(`${at}  address "${addr}" is not what discovery recorded for ${s(l.venueName)} in ${city} (${[...addrs].map((x) => `"${x}"`).join(", ")})`);
        }
        break;
      }
    }
    if (addr && !s(l.venueName)) {
      // Real, and sometimes correct: a couple of Meetup organisers type the
      // street into the venue-name field, leaving no name to record.
      warnings.push(`${at}  has an address but no venueName`);
    }

    // The same place, day and time written up twice across batches.
    if (s(l.venueName)) {
      const key = [s(l.venueName).toLowerCase(), city.toLowerCase(), day, s(l.startTime), s(l.eventDate)].join("|");
      if (sessions.has(key)) problems.push(`${at}  duplicates a session already in ${sessions.get(key)} (${s(l.venueName)}, ${city}, ${day || s(l.eventDate)} ${s(l.startTime)})`);
      else sessions.set(key, file);
    }
  }
}

console.log(`${files.length} batch file(s), ${total} listings\n`);
for (const w of warnings) console.log(`  note   ${w}`);
if (warnings.length) console.log("");
for (const p of problems) console.log(`  ERROR  ${p}`);

if (problems.length) {
  console.log(`\n${problems.length} problem(s). Do not import until these are resolved.`);
  process.exit(1);
}
console.log("All listings valid.");
