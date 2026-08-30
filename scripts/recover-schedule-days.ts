#!/usr/bin/env npx tsx
/**
 * Recover the missing `recurringSchedule.dayOfWeek` on recurring listings by
 * reading the day out of the listing's own name and description.
 *
 * Why this matters more than it looks. Of 2,253 visible recurring listings,
 * 1,870 (83%) carry no day of week — either `recurringSchedule` is null or its
 * `dayOfWeek` is an empty string. getEventTiming cannot compute a next
 * occurrence without a weekday, so every one of those listings:
 *
 *   - renders a bare "Recurring" label instead of a real next date,
 *   - sorts last wherever the site orders by soonest,
 *   - and never appears in the homepage carousels or any "what's on this week"
 *     surface, all of which filter on a non-null nextDate.
 *
 * For a directory whose whole promise is "find a game near you", 83% of the
 * inventory currently cannot answer "when".
 *
 * The day is very often already written in the listing text — "Thursday Social
 * Play", "Weekly Monday afternoon mahjong meetup at the Davis Senior Center".
 * This extracts it into the structured field so the timing helper can use it.
 *
 * Usage:
 *   npx tsx scripts/recover-schedule-days.ts
 *   npx tsx scripts/recover-schedule-days.ts --out ./audit
 *
 * Then review and apply:
 *   ADMIN_KEY=... npx tsx scripts/apply-audit-corrections.ts audit/schedule-days.json --dry-run
 *
 * Guards, each of which exists because the naive version got it wrong on real
 * data:
 *
 *   Negation. "(Skipped on Tuesdays the AAUW Travel Group meets.)" names the
 *   day the group does NOT meet. Matching that would schedule the listing on
 *   precisely the wrong day, so a day preceded by skip/except/closed/no/
 *   excluding within a short window is discarded.
 *
 *   Ordinals. "on the 3rd Tuesday at 6pm" and "first and third Wednesdays" are
 *   monthly, not weekly. Those set frequency "monthly" rather than inheriting
 *   the "weekly" default, which would otherwise promise a game every week that
 *   does not happen.
 *
 *   Ambiguity. If more than one distinct weekday survives, the listing is
 *   skipped rather than guessed at. Multi-day sessions do exist and the schema
 *   supports "tuesday|thursday", but a description that merely mentions two
 *   days is not evidence of one.
 *
 *   Name beats description. A day in the title is far more likely to be the
 *   schedule than one buried in prose.
 *
 * This only ever fills a field that is currently empty. It never overwrites an
 * existing dayOfWeek.
 */

import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const BASE_URL = args.includes("--url")
  ? args[args.indexOf("--url") + 1]
  : "https://www.mahjnearme.com";
const OUT_DIR = args.includes("--out") ? args[args.indexOf("--out") + 1] : "audit";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_RE = new RegExp(`\\b(${DAYS.join("|")})s?\\b`, "gi");

/** Words that mean "not this day" when they appear just before it. */
const NEGATION = /\b(skip(?:ped|ping)?|except|excluding|closed|cancell?ed|no|not|other than)\b/i;
/** Ordinal qualifiers that make a weekday monthly rather than weekly. */
const ORDINAL = /\b(1st|2nd|3rd|4th|5th|first|second|third|fourth|last)\b/i;

/**
 * Many ids encode the day, and often the start time, directly:
 *   aauw-prescott-mah-jongg-prescott-az-tuesday-13-00-0312a13c
 * These ids were generated from structured data at import time, which means
 * the day WAS known and was simply lost on the way into recurringSchedule.
 * That makes the id the most reliable source available — it is machine
 * written, not prose — so it is tried before the name or description.
 */
const ID_DAY_TIME = new RegExp(`-(${DAYS.join("|")})-(\\d{1,2})-(\\d{2})(?:-|$)`);
const ID_DAY = new RegExp(`-(${DAYS.join("|")})(?:-|$)`);

function fromId(id: string): { day: string; startTime: string } | null {
  const withTime = id.match(ID_DAY_TIME);
  if (withTime) {
    const h = Number(withTime[2]);
    const m = withTime[3];
    if (h <= 23 && Number(m) <= 59) {
      return { day: withTime[1], startTime: `${String(h).padStart(2, "0")}:${m}` };
    }
  }
  const dayOnly = id.match(ID_DAY);
  return dayOnly ? { day: dayOnly[1], startTime: "" } : null;
}

interface Listing {
  id: string;
  name: string;
  city: string;
  state: string;
  status: string;
  isRecurring: boolean;
  eventDate: string | null;
  description?: string;
  howToJoin?: string;
  recurringSchedule?: { dayOfWeek?: string; startTime?: string; endTime?: string; frequency?: string } | null;
}

interface Correction {
  id: string;
  updates: Record<string, unknown>;
  reason: string;
}

function isExpired(g: Listing, today: Date): boolean {
  if (g.isRecurring) return false;
  if (!g.eventDate || !/^\d{4}-\d{2}-\d{2}/.test(g.eventDate)) return false;
  const [y, m, d] = g.eventDate.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d) < today;
}

interface Extraction {
  days: string[];
  monthly: boolean;
  negatedDays: string[];
}

/** Pull weekday mentions out of a blob, applying the negation and ordinal guards. */
function extract(text: string): Extraction {
  // Count positive and negated mentions separately per day. A day is only
  // discarded when EVERY mention of it is negated.
  const positive = new Map<string, number>();
  const negatedCount = new Map<string, number>();
  let monthly = false;

  for (const m of text.matchAll(DAY_RE)) {
    const day = m[0].toLowerCase().replace(/s$/, "");
    const idx = m.index ?? 0;
    // Look back far enough to catch "skipped on Tuesdays" / "closed Mondays"
    // but not so far that an unrelated earlier clause poisons the match.
    const before = text.slice(Math.max(0, idx - 30), idx);

    if (NEGATION.test(before)) {
      negatedCount.set(day, (negatedCount.get(day) || 0) + 1);
      continue;
    }
    if (ORDINAL.test(before)) monthly = true;
    positive.set(day, (positive.get(day) || 0) + 1);
  }

  // "Weekly mah jongg ... Tuesdays 1-3pm. (Skipped on Tuesdays the Travel
  // Group meets.)" states the schedule AND an exception to it. Tuesday is
  // still the day, so only drop a day with no positive mention at all.
  const negatedOnly = [...negatedCount.keys()].filter((d) => !positive.has(d));
  return { days: [...positive.keys()], monthly, negatedDays: negatedOnly };
}

async function main() {
  console.log(`Fetching listings from ${BASE_URL}/api/listings ...`);
  const res = await fetch(`${BASE_URL}/api/listings`);
  if (!res.ok) {
    console.error(`Failed to fetch listings: ${res.status}`);
    process.exit(1);
  }
  const all: Listing[] = (await res.json()).listings;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const recurring = all.filter((g) => g.status === "active" && !isExpired(g, today) && g.isRecurring);
  const missing = recurring.filter(
    (g) => !g.recurringSchedule || !(g.recurringSchedule.dayOfWeek || "").trim()
  );

  console.log(`\n  visible recurring        : ${recurring.length}`);
  console.log(`  already have a dayOfWeek : ${recurring.length - missing.length}`);
  console.log(`  missing a dayOfWeek      : ${missing.length}\n`);

  const corrections: Correction[] = [];
  const stats = {
    fromId: 0, fromName: 0, fromDescription: 0, timeAlsoRecovered: 0, monthly: 0,
    skippedAmbiguous: 0, skippedNegated: 0, skippedConflict: 0, noDay: 0,
  };
  const ambiguous: { id: string; name: string; days: string[] }[] = [];
  const conflicts: { id: string; name: string; idDay: string; textDay: string }[] = [];

  for (const g of missing) {
    const idHit = fromId(g.id);
    const nameHit = extract(g.name);
    const descHit = extract(`${g.description || ""} ${g.howToJoin || ""}`);
    const textHit = nameHit.days.length ? nameHit : descHit;

    let day: string | null = null;
    let via = "";
    let startTime = g.recurringSchedule?.startTime || "";
    let monthly = false;

    if (idHit) {
      // Where the text also names a single day, it must agree. A disagreement
      // means one of the two is wrong and there is no way to tell which, so
      // the listing goes to review rather than being guessed at.
      if (textHit.days.length === 1 && textHit.days[0] !== idHit.day) {
        stats.skippedConflict++;
        conflicts.push({ id: g.id, name: g.name.trim(), idDay: idHit.day, textDay: textHit.days[0] });
        continue;
      }
      day = idHit.day;
      via = "id";
      if (!startTime && idHit.startTime) {
        startTime = idHit.startTime;
        stats.timeAlsoRecovered++;
      }
      monthly = textHit.days.length === 1 && textHit.monthly;
      stats.fromId++;
    } else {
      if (!textHit.days.length) {
        if (nameHit.negatedDays.length || descHit.negatedDays.length) stats.skippedNegated++;
        else stats.noDay++;
        continue;
      }
      if (textHit.days.length > 1) {
        stats.skippedAmbiguous++;
        ambiguous.push({ id: g.id, name: g.name.trim(), days: textHit.days });
        continue;
      }
      day = textHit.days[0];
      via = nameHit.days.length ? "name" : "description";
      monthly = textHit.monthly;
      if (via === "name") stats.fromName++;
      else stats.fromDescription++;
    }

    const frequency = monthly ? "monthly" : g.recurringSchedule?.frequency || "weekly";
    if (monthly) stats.monthly++;

    const sched = {
      dayOfWeek: day,
      startTime,
      endTime: g.recurringSchedule?.endTime || "",
      frequency,
    };

    corrections.push({
      id: g.id,
      updates: { recurringSchedule: sched },
      reason:
        `Recovered dayOfWeek "${day}"${monthly ? " (monthly — ordinal qualifier present)" : ""} from the listing ${via}` +
        `${via === "id" && idHit?.startTime ? `, along with startTime ${idHit.startTime}` : ""}. ` +
        `Was empty, so the card could not show a next date and never appeared in any "what's on" surface.`,
    });
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, "schedule-days.json");
  const reviewPath = path.join(OUT_DIR, "schedule-days-review.json");
  fs.writeFileSync(outPath, JSON.stringify(corrections, null, 2));
  fs.writeFileSync(
    reviewPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), stats, ambiguous, conflicts }, null, 2)
  );

  const recovered = corrections.length;
  console.log("RECOVERED");
  console.log(`  from the listing id          : ${stats.fromId}`);
  console.log(`    ...with a start time too   : ${stats.timeAlsoRecovered}`);
  console.log(`  from the listing name        : ${stats.fromName}`);
  console.log(`  from the description         : ${stats.fromDescription}`);
  console.log(`  of which monthly, not weekly : ${stats.monthly}`);
  console.log(`  -> ${outPath} (${recovered} corrections)\n`);
  console.log("SKIPPED");
  console.log(`  ambiguous (2+ distinct days) : ${stats.skippedAmbiguous}`);
  console.log(`  id and text disagree         : ${stats.skippedConflict}`);
  console.log(`  only a negated day present   : ${stats.skippedNegated}`);
  console.log(`  no weekday in the text       : ${stats.noDay}`);
  console.log(`  -> ${reviewPath}\n`);
  const before = recurring.length - missing.length;
  console.log(
    `Listings able to show a real next date: ${before} -> ${before + recovered} ` +
      `(+${((recovered / Math.max(before, 1)) * 100).toFixed(0)}%)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
