/**
 * Recover a recurring listing's day and start time when the structured
 * `recurringSchedule` is missing them.
 *
 * 1,870 of 2,253 visible recurring listings (83%) carry no `dayOfWeek`.
 * Without one, getEventTiming cannot compute a next occurrence, so the card
 * renders a bare "Schedule TBD", sorts last wherever the site orders by
 * soonest, and never appears in the homepage carousels or any "what's on this
 * week" surface — all of which filter on a non-null nextDate.
 *
 * The information is usually still in the record. Applying this at render time
 * rather than only as a data migration means the site is correct on deploy,
 * without waiting for anyone to run a correction script against Firestore, and
 * it stays correct for any future import that drops the field again.
 *
 * Sources, most trustworthy first:
 *
 *   1. The id. Ids were generated from structured data at import
 *      (`aauw-prescott-mah-jongg-prescott-az-tuesday-13-00-0312a13c`), so the
 *      day — and often the start time — was known and simply lost on the way
 *      into recurringSchedule. Machine-written, not prose.
 *   2. The name ("Thursday Social Play").
 *   3. The description ("Weekly Monday afternoon mahjong at the Davis Senior
 *      Center").
 *
 * Validated offline against the full production dataset: on the 425 listings
 * where the text independently names a day, the recovered day agreed 425 times
 * and disagreed zero times.
 *
 * This never overwrites a value that is already set, and returns the schedule
 * unchanged when nothing can be recovered.
 */

import type { RecurringSchedule } from "@/types";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

/** Full-word day forms. Unambiguous, always trusted. */
const DAY_FULL: [string, RegExp][] = [
  ["monday", /\bmondays?\b/i],
  ["tuesday", /\btuesdays?\b/i],
  ["wednesday", /\bwednesdays?\b/i],
  ["thursday", /\bthursdays?\b/i],
  ["friday", /\bfridays?\b/i],
  ["saturday", /\bsaturdays?\b/i],
  ["sunday", /\bsundays?\b/i],
];

/**
 * A day named right after a negation is the day the group does NOT meet:
 * "(Skipped on Tuesdays the Travel Group meets.)". Only discards a day when
 * every mention of it is negated, since that same listing also states
 * "Tuesdays 1-3pm" as its actual schedule.
 */
const NEGATION = /\b(skip(?:ped|ping)?|except|excluding|closed|cancell?ed|no|not|other than)\b/i;

const ID_DAY_TIME = new RegExp(`-(${DAYS.join("|")})-(\\d{1,2})-(\\d{2})(?:-|$)`);
const ID_DAY = new RegExp(`-(${DAYS.join("|")})(?:-|$)`);

/** The subset of a listing this needs — so scripts can pass a plain record. */
interface RecoverableGame {
  id: string;
  name: string;
  description?: string | null;
  isRecurring: boolean;
  recurringSchedule: RecurringSchedule | null;
}

/** Day and start time encoded in the listing id, when present. */
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

/**
 * The single weekday named in a blob of text, or null when there is none or
 * more than one. Two days with no explicit range is ambiguous, and a guess is
 * worse than leaving the card as-is.
 */
function singleDayFromText(text: string): string | null {
  if (!text) return null;
  const found: string[] = [];

  for (const [day, re] of DAY_FULL) {
    const m = text.match(re);
    if (!m) continue;
    const idx = m.index ?? 0;
    const before = text.slice(Math.max(0, idx - 30), idx);
    if (NEGATION.test(before)) {
      // Negated here, but it may be stated positively elsewhere.
      const all = [...text.matchAll(new RegExp(re.source, "gi"))];
      const anyPositive = all.some((mm) => {
        const i = mm.index ?? 0;
        return !NEGATION.test(text.slice(Math.max(0, i - 30), i));
      });
      if (!anyPositive) continue;
    }
    found.push(day);
  }
  return found.length === 1 ? found[0] : null;
}

/**
 * The schedule to actually use for a listing: its own, with `dayOfWeek` and
 * `startTime` filled in from the id or text when they are missing.
 *
 * Returns null only when the listing has no schedule and nothing recoverable,
 * which is the same "Schedule TBD" outcome as before.
 */
export function resolveRecurringSchedule(game: RecoverableGame): RecurringSchedule | null {
  const current = game.recurringSchedule;
  const currentDay = (current?.dayOfWeek || "").trim();

  // Already usable — nothing to do. This is the common path, so it stays cheap.
  if (currentDay) return current;
  if (!game.isRecurring) return current;

  const idHit = fromId(game.id);
  const textDay = singleDayFromText(`${game.name} ${game.description || ""}`);

  let day = "";
  if (idHit) {
    // Where the text also names exactly one day it must agree; a disagreement
    // means one of the two is wrong and there is no way to tell which.
    if (textDay && textDay !== idHit.day) return current;
    day = idHit.day;
  } else if (textDay) {
    day = textDay;
  }

  if (!day) return current;

  return {
    dayOfWeek: day,
    startTime: (current?.startTime || "").trim() || idHit?.startTime || "",
    endTime: current?.endTime || "",
    frequency: current?.frequency || "weekly",
  };
}
