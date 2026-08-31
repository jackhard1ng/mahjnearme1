#!/usr/bin/env npx tsx
/**
 * Fill in missing `recurringSchedule` day and time on recurring listings by
 * reading them out of the listing's own id, name and description.
 *
 * Why this matters more than it looks. Of 2,253 visible recurring listings,
 * 1,870 (83%) carry no day of week — either `recurringSchedule` is null or its
 * `dayOfWeek` is an empty string. getEventTiming cannot compute a next
 * occurrence without a weekday, so every one of those listings:
 *
 *   - renders a bare "Schedule TBD" instead of a real next date,
 *   - sorts last wherever the site orders by soonest,
 *   - and never appears in the homepage carousels or any "what's on this week"
 *     surface, all of which filter on a non-null nextDate.
 *
 * For a directory whose whole promise is "find a game near you", 83% of the
 * inventory could not answer "when".
 *
 * Times matter too, if less dramatically: "Thursday" is a much weaker card
 * than "Thursday at 3:00 PM", and the timing helper needs a start time to work
 * out whether a game is happening right now.
 *
 * Usage:
 *   npx tsx scripts/recover-schedule-days.ts
 *   npx tsx scripts/recover-schedule-days.ts --out ./audit
 *
 * Then review and apply:
 *   ADMIN_KEY=... npx tsx scripts/apply-audit-corrections.ts audit/schedule-days.json --dry-run
 *
 * SOURCES, most trustworthy first:
 *
 *   1. The id. Ids were generated from structured data at import
 *      (`...-prescott-az-tuesday-13-00-0312a13c`), so the day — and often the
 *      start time — was known and simply lost on the way into
 *      recurringSchedule. Machine-written, not prose.
 *   2. The name. "Thursday Social Play".
 *   3. The description. "Weekly Monday afternoon mahjong at the Davis Senior
 *      Center, 12-4 PM."
 *
 * GUARDS, each added because real data broke the naive version:
 *
 *   Negation. "Tuesdays 1-3pm. (Skipped on Tuesdays the Travel Group meets.)"
 *   states a schedule AND an exception to it, so a day is only discarded when
 *   EVERY mention of it is negated — not merely when one is.
 *
 *   Ordinals. "on the 3rd Tuesday at 6pm", "first and third Wednesdays" are
 *   monthly. Those set frequency "monthly" rather than inheriting the "weekly"
 *   default, which would promise a weekly game that does not happen.
 *
 *   Conflict. Where the id and the text disagree on the day, the listing goes
 *   to review. There is no way to tell which is right.
 *
 *   Ambiguity. Two or more distinct weekdays with no explicit range goes to
 *   review rather than a guess. An explicit range ("Mon-Fri") is different —
 *   that IS a statement about multiple days, and the schema supports
 *   "monday|tuesday|...".
 *
 * Existing values are never overwritten. This only fills empty fields.
 */

import fs from "fs";
import path from "path";
import { parseDayRange, parseTimeRange } from "./lib/parse-schedule-text";

const args = process.argv.slice(2);
const BASE_URL = args.includes("--url")
  ? args[args.indexOf("--url") + 1]
  : "https://www.mahjnearme.com";
const OUT_DIR = args.includes("--out") ? args[args.indexOf("--out") + 1] : "audit";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/** Words that mean "not this day" when they appear just before it. */
const NEGATION = /\b(skip(?:ped|ping)?|except|excluding|closed|cancell?ed|no|not|other than)\b/i;
/** Ordinal qualifiers that make a weekday monthly rather than weekly. */
const ORDINAL = /\b(1st|2nd|3rd|4th|5th|first|second|third|fourth|last)\b/i;

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

interface Schedule {
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
  frequency?: string;
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
  recurringSchedule?: Schedule | null;
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

/**
 * Weekday mentions in a blob, with the negation and ordinal guards applied.
 * `days` excludes any day whose every mention was negated.
 */
/** Unambiguous full-word forms. Always trusted. */
const DAY_FULL: Record<string, RegExp> = {
  monday: /\bmondays?\b/gi,
  tuesday: /\btuesdays?\b/gi,
  wednesday: /\bwednesdays?\b/gi,
  thursday: /\bthursdays?\b/gi,
  friday: /\bfridays?\b/gi,
  saturday: /\bsaturdays?\b/gi,
  sunday: /\bsundays?\b/gi,
};

/**
 * Three-letter forms. These collide with ordinary words and proper nouns —
 * real listings contain "Valley of the Sun JCC", "Neon Sun Cafe" and "Rising
 * Sun Games", every one of which would otherwise register as a Sunday game.
 * So an abbreviation only counts inside an obvious schedule context: wrapped
 * in parentheses ("Mah Jongg (Thu)"), joined to another day ("Mon-Fri",
 * "Wed & Fri"), or immediately followed by a time ("Thu 9 AM").
 *
 * "sun" is omitted entirely. It is by far the most collision-prone of the
 * seven and the handful of listings it would win are not worth the false
 * positives; a genuine Sunday game almost always writes "Sunday" in full.
 */
const DAY_ABBR: Record<string, RegExp> = {
  monday: /\bmon\b\.?/gi,
  tuesday: /\btues?\b\.?/gi,
  wednesday: /\bweds?\b\.?/gi,
  thursday: /\bthur?s?\b\.?/gi,
  friday: /\bfri\b\.?/gi,
  saturday: /\bsat\b\.?/gi,
};

const OTHER_DAY_TOKEN =
  "mon|tues?|weds?|thur?s?|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday";

/** Does this abbreviation sit somewhere that actually reads as a schedule? */
function inScheduleContext(text: string, start: number, end: number): boolean {
  const before = text.slice(Math.max(0, start - 3), start);
  const after = text.slice(end, end + 16);
  if (/\($/.test(before) && /^\s*\)/.test(after)) return true; // "(Thu)"
  if (new RegExp(`^\\s*[-–—&,/]\\s*(${OTHER_DAY_TOKEN})\\b`, "i").test(after)) return true; // "Mon-Fri"
  if (new RegExp(`(${OTHER_DAY_TOKEN})\\s*[-–—&,/]\\s*$`, "i").test(before)) return true;
  if (/^\.?\s*\d{1,2}(:\d{2})?\s*(a\.?m|p\.?m|[-–—])/i.test(after)) return true; // "Thu 9 AM"
  return false;
}

function extractDays(text: string): { days: string[]; monthly: boolean; negatedOnly: string[] } {
  const positive = new Set<string>();
  const negated = new Set<string>();
  let monthly = false;

  const record = (day: string, idx: number) => {
    const before = text.slice(Math.max(0, idx - 30), idx);
    if (NEGATION.test(before)) {
      negated.add(day);
      return;
    }
    if (ORDINAL.test(before)) monthly = true;
    positive.add(day);
  };

  for (const [day, re] of Object.entries(DAY_FULL)) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) record(day, m.index ?? 0);
  }
  for (const [day, re] of Object.entries(DAY_ABBR)) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      const i = m.index ?? 0;
      if (inScheduleContext(text, i, i + m[0].length)) record(day, i);
    }
  }

  const negatedOnly = [...negated].filter((d) => !positive.has(d));
  return { days: [...positive], monthly, negatedOnly };
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

  const corrections: Correction[] = [];
  const stats = {
    dayFromId: 0, dayFromName: 0, dayFromDescription: 0, dayFromRange: 0,
    timeFromId: 0, timeFromText: 0, endTimeRecovered: 0,
    monthly: 0, skippedAmbiguous: 0, skippedConflict: 0, skippedNegated: 0,
    alreadyComplete: 0, nothingFound: 0,
  };
  const ambiguous: { id: string; name: string; days: string[] }[] = [];
  const conflicts: { id: string; name: string; idDay: string; textDay: string }[] = [];

  for (const g of recurring) {
    const cur: Schedule = g.recurringSchedule || {};
    const curDay = (cur.dayOfWeek || "").trim();
    const curStart = (cur.startTime || "").trim();
    const curEnd = (cur.endTime || "").trim();

    if (curDay && curStart && curEnd) {
      stats.alreadyComplete++;
      continue;
    }

    const text = `${g.name} ${g.description || ""} ${g.howToJoin || ""}`;
    const idHit = fromId(g.id);
    const nameHit = extractDays(g.name);
    const descHit = extractDays(`${g.description || ""} ${g.howToJoin || ""}`);
    const textHit = nameHit.days.length ? nameHit : descHit;
    const via = nameHit.days.length ? "name" : "description";

    // ---- day ----
    let day = curDay;
    let daySource = "";
    let monthly = false;

    if (!day) {
      if (idHit) {
        if (textHit.days.length === 1 && textHit.days[0] !== idHit.day) {
          stats.skippedConflict++;
          conflicts.push({ id: g.id, name: g.name.trim(), idDay: idHit.day, textDay: textHit.days[0] });
          continue;
        }
        day = idHit.day;
        daySource = "id";
        monthly = textHit.days.length === 1 && textHit.monthly;
        stats.dayFromId++;
      } else if (textHit.days.length === 1) {
        day = textHit.days[0];
        daySource = via;
        monthly = textHit.monthly;
        if (via === "name") stats.dayFromName++;
        else stats.dayFromDescription++;
      } else if (textHit.days.length > 1) {
        // An explicit range IS a statement about several days; a bare mention
        // of two days is not.
        const range = parseDayRange(text);
        if (range.length > 1) {
          day = range.join("|");
          daySource = "day range";
          stats.dayFromRange++;
        } else {
          stats.skippedAmbiguous++;
          ambiguous.push({ id: g.id, name: g.name.trim(), days: textHit.days });
          continue;
        }
      } else if (nameHit.negatedOnly.length || descHit.negatedOnly.length) {
        stats.skippedNegated++;
        continue;
      }
    }

    // ---- times ----
    let startTime = curStart;
    let endTime = curEnd;
    let timeSource = "";

    if (!startTime && idHit?.startTime) {
      startTime = idHit.startTime;
      timeSource = "id";
      stats.timeFromId++;
    }
    if (!startTime || !endTime) {
      const t = parseTimeRange(text);
      if (t) {
        if (!startTime) {
          startTime = t.startTime;
          timeSource = timeSource || "text";
          stats.timeFromText++;
        }
        // The start may have come from the id and the end from prose. Those
        // are different sources, so they can contradict — only accept an end
        // that actually sits after the start we already have.
        if (!endTime && t.endTime && (!startTime || t.endTime > startTime)) {
          endTime = t.endTime;
          timeSource = timeSource || "text";
          stats.endTimeRecovered++;
        }
      }
    }

    const changedDay = day !== curDay;
    const changedTime = startTime !== curStart || endTime !== curEnd;
    if (!changedDay && !changedTime) {
      stats.nothingFound++;
      continue;
    }
    if (monthly) stats.monthly++;

    const parts: string[] = [];
    if (changedDay) parts.push(`dayOfWeek "${day}" from the ${daySource}`);
    if (startTime !== curStart) parts.push(`startTime ${startTime} from the ${timeSource}`);
    if (endTime !== curEnd) parts.push(`endTime ${endTime} from the ${timeSource}`);

    corrections.push({
      id: g.id,
      updates: {
        recurringSchedule: {
          dayOfWeek: day,
          startTime,
          endTime,
          frequency: monthly ? "monthly" : cur.frequency || "weekly",
        },
      },
      reason:
        `Recovered ${parts.join(", ")}${monthly ? " (monthly — ordinal qualifier present)" : ""}. ` +
        (changedDay
          ? `Day was empty, so the card could not show a next date and never appeared in any "what's on" surface.`
          : `Day was already set; this fills in the missing time.`),
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

  const dayRecovered =
    stats.dayFromId + stats.dayFromName + stats.dayFromDescription + stats.dayFromRange;

  console.log(`\n  visible recurring : ${recurring.length}\n`);
  console.log("DAY RECOVERED");
  console.log(`  from the id            : ${stats.dayFromId}`);
  console.log(`  from the name          : ${stats.dayFromName}`);
  console.log(`  from the description   : ${stats.dayFromDescription}`);
  console.log(`  from a day range       : ${stats.dayFromRange}`);
  console.log(`  monthly, not weekly    : ${stats.monthly}`);
  console.log(`  total                  : ${dayRecovered}\n`);
  console.log("TIME RECOVERED");
  console.log(`  start time from the id : ${stats.timeFromId}`);
  console.log(`  start time from text   : ${stats.timeFromText}`);
  console.log(`  end time from text     : ${stats.endTimeRecovered}\n`);
  console.log("SKIPPED");
  console.log(`  ambiguous (2+ days, no range) : ${stats.skippedAmbiguous}`);
  console.log(`  id and text disagree          : ${stats.skippedConflict}`);
  console.log(`  only a negated day present    : ${stats.skippedNegated}`);
  console.log(`  nothing found in the text     : ${stats.nothingFound}`);
  console.log(`  already complete              : ${stats.alreadyComplete}\n`);
  console.log(`  -> ${outPath} (${corrections.length} corrections)`);
  console.log(`  -> ${reviewPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
