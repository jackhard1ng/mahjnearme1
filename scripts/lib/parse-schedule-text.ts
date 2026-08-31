/**
 * Parse weekdays and times out of free-text listing copy.
 *
 * Split out of the recovery scripts so the parsing rules can be unit-tested
 * on their own — time ranges in particular are easy to get subtly wrong, and
 * a wrong time is worse than no time on a directory listing.
 */

export const DAY_NAMES = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
] as const;

/** Abbreviations seen in real listing copy, longest first so "thurs" wins over "thu". */
const DAY_ALIASES: [RegExp, string][] = [
  [/\bmondays?\b/i, "monday"],
  [/\btuesdays?\b/i, "tuesday"],
  [/\bwednesdays?\b/i, "wednesday"],
  [/\bthursdays?\b/i, "thursday"],
  [/\bfridays?\b/i, "friday"],
  [/\bsaturdays?\b/i, "saturday"],
  [/\bsundays?\b/i, "sunday"],
  [/\bmon\b\.?/i, "monday"],
  [/\btues?\b\.?/i, "tuesday"],
  [/\bweds?\b\.?/i, "wednesday"],
  [/\bthur?s?\b\.?/i, "thursday"],
  [/\bfri\b\.?/i, "friday"],
  [/\bsat\b\.?/i, "saturday"],
  [/\bsun\b\.?/i, "sunday"],
];

const DAY_TOKEN =
  "mondays?|tuesdays?|wednesdays?|thursdays?|fridays?|saturdays?|sundays?|mon|tues?|weds?|thur?s?|fri|sat|sun";

/** "Mon-Fri", "Monday through Friday", "Tue–Thu". */
const DAY_RANGE = new RegExp(
  `\\b(${DAY_TOKEN})\\b\\.?\\s*(?:[-–—]|through|thru|to)\\s*\\b(${DAY_TOKEN})\\b\\.?`,
  "i"
);

function canonicalDay(token: string): string | null {
  for (const [re, day] of DAY_ALIASES) {
    if (re.test(token)) return day;
  }
  return null;
}

/** Expand "monday".."friday" into the days between, inclusive. */
export function expandDayRange(fromDay: string, toDay: string): string[] {
  const a = DAY_NAMES.indexOf(fromDay as (typeof DAY_NAMES)[number]);
  const b = DAY_NAMES.indexOf(toDay as (typeof DAY_NAMES)[number]);
  if (a === -1 || b === -1) return [];
  const out: string[] = [];
  // Walk forward, wrapping, so "saturday-sunday" and "sunday-tuesday" both work.
  for (let i = a; ; i = (i + 1) % 7) {
    out.push(DAY_NAMES[i]);
    if (i === b) break;
    if (out.length > 7) return []; // guard against a malformed range
  }
  return out;
}

/**
 * Find a day RANGE ("Mon-Fri") and return every day it covers.
 * Returns [] when the text has no range.
 */
export function parseDayRange(text: string): string[] {
  const m = text.match(DAY_RANGE);
  if (!m) return [];
  const from = canonicalDay(m[1]);
  const to = canonicalDay(m[2]);
  if (!from || !to || from === to) return [];
  return expandDayRange(from, to);
}

/** Every distinct weekday named in the text, abbreviations included. */
export function parseDays(text: string): string[] {
  const found = new Set<string>();
  for (const [re, day] of DAY_ALIASES) {
    if (re.test(text)) found.add(day);
  }
  return [...found];
}

export interface TimeRange {
  startTime: string; // "HH:MM", 24-hour
  endTime: string; // "HH:MM" or "" when only a start was stated
  matched: string;
}

const HOUR = "(1[0-2]|0?[1-9])";
const MIN = "(?::([0-5][0-9]))?";
const MERIDIEM = "\\s*([ap])\\.?\\s*m\\.?";

/** "3-5pm", "12–4 PM", "10 a.m.-noon", "9:30-11:30am", "11am-1pm" */
const RANGE_RE = new RegExp(
  `\\b${HOUR}${MIN}(?:${MERIDIEM})?\\s*(?:[-–—]|to|until|till|til)\\s*(?:${HOUR}${MIN}(?:${MERIDIEM})?|(noon|midnight))`,
  "i"
);
/** A lone time: "at 1 PM", "6pm", "10:30 a.m." */
const SINGLE_RE = new RegExp(`\\b${HOUR}${MIN}${MERIDIEM}`, "i");

function to24(hour: number, minute: number, meridiem: string | null): number | null {
  if (hour < 1 || hour > 12) return null;
  if (!meridiem) return null;
  const pm = meridiem.toLowerCase() === "p";
  let h = hour % 12;
  if (pm) h += 12;
  return h * 60 + minute;
}

const fmt = (mins: number) =>
  `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

/**
 * Pull a start (and where stated, end) time out of free text.
 *
 * The hard part is meridiem inheritance. "12–4 PM" and "3-5pm" only mark the
 * end, so the start has to borrow it — but borrowing blindly breaks "10-2pm",
 * where a literal 10 PM start would sit after the 2 PM end. So when the
 * borrowed meridiem produces start > end, the start flips to the other half
 * of the day. Anything still inconsistent is discarded rather than guessed.
 */
export function parseTimeRange(text: string): TimeRange | null {
  const m = text.match(RANGE_RE);
  if (m) {
    const [, sh, sm, smer, eh, em, emer, word] = m;

    let endMins: number | null;
    if (word) {
      endMins = word.toLowerCase() === "noon" ? 12 * 60 : 0;
    } else {
      endMins = to24(Number(eh), Number(em || 0), emer || null);
    }

    // The start borrows the end's meridiem when it states none of its own.
    const startMer = smer || (word ? (word.toLowerCase() === "noon" ? "a" : null) : emer) || null;
    let startMins = to24(Number(sh), Number(sm || 0), startMer);

    if (startMins === null || endMins === null) return null;

    if (startMins > endMins) {
      // Try the other half of the day for the start ("10-2pm" -> 10:00, 14:00).
      const flipped = to24(Number(sh), Number(sm || 0), startMer === "p" ? "a" : "p");
      if (flipped !== null && flipped < endMins) startMins = flipped;
      else return null; // still inconsistent — don't guess
    }
    if (startMins === endMins) return null;

    return { startTime: fmt(startMins), endTime: fmt(endMins), matched: m[0] };
  }

  const s = text.match(SINGLE_RE);
  if (s) {
    const mins = to24(Number(s[1]), Number(s[2] || 0), s[3]);
    if (mins === null) return null;
    return { startTime: fmt(mins), endTime: "", matched: s[0] };
  }
  return null;
}
