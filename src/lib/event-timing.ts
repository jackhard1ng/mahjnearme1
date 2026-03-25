import { Game } from "@/types";
import { formatTime } from "@/lib/utils";

// --- Time Urgency Tiers ---

export type UrgencyTier = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface EventTiming {
  /** The next occurrence as a Date (or null if incalculable). */
  nextDate: Date | null;
  /** Urgency tier 1-7 (1 = happening now, 7 = 30+ days out). */
  tier: UrgencyTier;
  /** Human-readable label: "Today at 1:00 PM", "Tomorrow at 7:00 PM", etc. */
  label: string;
  /** Badge text for high-urgency events, or null. */
  badge: "Happening Now" | "Today" | "Tomorrow" | null;
  /** Badge color class. */
  badgeColor: string;
  /** Numeric score for ranking (lower = sooner). */
  timeScore: number;
}

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEFAULT_DURATION_HOURS = 2;

/**
 * Calculate the event timing for a game relative to `now`.
 * This is the core engine: it determines when the next occurrence is,
 * what urgency tier it falls into, and generates the display label.
 */
export function getEventTiming(game: Game, now: Date = new Date()): EventTiming {
  if (game.isRecurring && game.recurringSchedule) {
    return getRecurringTiming(game, now);
  }

  if (game.eventDate) {
    return getOneTimeTiming(game, now);
  }

  // No schedule data at all — can't calculate timing
  return {
    nextDate: null,
    tier: 7,
    label: "Schedule TBD",
    badge: null,
    badgeColor: "",
    timeScore: 999,
  };
}

// --- Recurring Events ---

function getRecurringTiming(game: Game, now: Date): EventTiming {
  const sched = game.recurringSchedule!;
  const dayOfWeek = sched.dayOfWeek.toLowerCase();
  const hasTime = !!sched.startTime;
  const hasEndTime = !!sched.endTime;

  // Handle pipe-separated multiple days (e.g. "tuesday|thursday")
  const days = dayOfWeek.split("|").map((d) => d.trim());
  let soonest: Date | null = null;
  let soonestDay = "";

  for (const day of days) {
    const next = getNextOccurrenceDate(day, sched.frequency, now);
    if (next && (!soonest || next < soonest)) {
      soonest = next;
      soonestDay = day;
    }
  }

  if (!soonest) {
    // Fallback: can't compute next date
    const dayLabel = days.map((d) => capitalize(d)).join(" & ");
    return {
      nextDate: null,
      tier: 5,
      label: hasTime ? `Every ${dayLabel} at ${formatTime(sched.startTime)}` : `Every ${dayLabel}`,
      badge: null,
      badgeColor: "",
      timeScore: 50,
    };
  }

  // Set start time on the date
  if (hasTime) {
    const [h, m] = sched.startTime.split(":").map(Number);
    soonest.setHours(h, m, 0, 0);
  }

  // Check "happening now"
  if (hasTime) {
    const startMs = soonest.getTime();
    let endMs: number;
    if (hasEndTime) {
      const endDate = new Date(soonest);
      const [eh, em] = sched.endTime.split(":").map(Number);
      endDate.setHours(eh, em, 0, 0);
      endMs = endDate.getTime();
    } else {
      endMs = startMs + DEFAULT_DURATION_HOURS * 60 * 60 * 1000;
    }

    if (now.getTime() >= startMs && now.getTime() < endMs) {
      const endLabel = hasEndTime ? formatTime(sched.endTime) : formatTime(
        `${Math.floor((startMs + DEFAULT_DURATION_HOURS * 3600000) / 3600000 % 24)}:${String(new Date(endMs).getMinutes()).padStart(2, "0")}`
      );
      return {
        nextDate: soonest,
        tier: 1,
        label: `Happening Now — until ${hasEndTime ? formatTime(sched.endTime) : "~" + formatEndTime(soonest, DEFAULT_DURATION_HOURS)}`,
        badge: "Happening Now",
        badgeColor: "bg-hotpink-500 text-white",
        timeScore: 0,
      };
    }
  }

  return buildTimingFromDate(soonest, hasTime ? sched.startTime : null, now);
}

/** Calculate the next occurrence of a given day-of-week + frequency. */
function getNextOccurrenceDate(dayName: string, frequency: string, now: Date): Date | null {
  const targetDay = DAY_NAMES.indexOf(dayName);
  if (targetDay === -1) return null;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const currentDay = today.getDay();

  // Days until next occurrence of this weekday
  let daysUntil = (targetDay - currentDay + 7) % 7;
  if (daysUntil === 0) daysUntil = 0; // same day = today (will check time later)

  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntil);

  // For weekly events, the next occurrence is simply the next matching day
  if (frequency === "weekly") {
    return nextDate;
  }

  // For biweekly, if it's this week show it, otherwise add 7 days
  // (We can't know the exact biweekly cadence without an anchor date,
  //  so we show the nearest matching day as a reasonable approximation)
  if (frequency === "biweekly") {
    return nextDate;
  }

  // For monthly, show the next occurrence of this weekday within the next 31 days
  // (e.g., "monthly monday" = next monday within a month)
  if (frequency === "monthly") {
    return nextDate;
  }

  return nextDate;
}

// --- One-Time Events ---

function getOneTimeTiming(game: Game, now: Date): EventTiming {
  const [year, month, day] = game.eventDate!.split("-").map(Number);
  const eventDate = new Date(year, month - 1, day);
  const hasTime = !!game.eventStartTime;
  const hasEndTime = !!game.eventEndTime;

  if (hasTime) {
    const [h, m] = game.eventStartTime!.split(":").map(Number);
    eventDate.setHours(h, m, 0, 0);

    // Check "happening now"
    const startMs = eventDate.getTime();
    let endMs: number;
    if (hasEndTime) {
      const endDate = new Date(eventDate);
      const [eh, em] = game.eventEndTime!.split(":").map(Number);
      endDate.setHours(eh, em, 0, 0);
      endMs = endDate.getTime();
    } else {
      endMs = startMs + DEFAULT_DURATION_HOURS * 60 * 60 * 1000;
    }

    if (now.getTime() >= startMs && now.getTime() < endMs) {
      return {
        nextDate: eventDate,
        tier: 1,
        label: `Happening Now — until ${hasEndTime ? formatTime(game.eventEndTime!) : "~" + formatEndTime(eventDate, DEFAULT_DURATION_HOURS)}`,
        badge: "Happening Now",
        badgeColor: "bg-hotpink-500 text-white",
        timeScore: 0,
      };
    }
  }

  return buildTimingFromDate(eventDate, hasTime ? game.eventStartTime! : null, now);
}

// --- Shared Helpers ---

/**
 * Given a target date/time, determine the tier, label, and score.
 */
function buildTimingFromDate(target: Date, startTime: string | null, now: Date): EventTiming {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const targetDay = new Date(target);
  targetDay.setHours(0, 0, 0, 0);

  const diffMs = targetDay.getTime() - todayStart.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

  const timeStr = startTime ? ` at ${formatTime(startTime)}` : "";
  const dayIndex = target.getDay();
  const dayLabel = DAY_LABELS[dayIndex];

  // Tier 2: Today (hasn't started yet, or no time info)
  if (diffDays === 0) {
    // If it has a time and that time has passed, it's effectively "next occurrence"
    if (startTime) {
      const [h, m] = startTime.split(":").map(Number);
      const startToday = new Date(now);
      startToday.setHours(h, m, 0, 0);
      if (now > startToday) {
        // Start time already passed today, shift to next week
        // Score it as 7 days out
        return {
          nextDate: target,
          tier: 5,
          label: `Next ${dayLabel}${timeStr}`,
          badge: null,
          badgeColor: "",
          timeScore: 7 + getTimeOfDayFraction(startTime),
        };
      }
    }
    return {
      nextDate: target,
      tier: 2,
      label: `Today${timeStr}`,
      badge: "Today",
      badgeColor: "bg-amber-500 text-white",
      timeScore: 0.5 + getTimeOfDayFraction(startTime),
    };
  }

  // Tier 3: Tomorrow
  if (diffDays === 1) {
    return {
      nextDate: target,
      tier: 3,
      label: `Tomorrow${timeStr}`,
      badge: "Tomorrow",
      badgeColor: "bg-gold-400 text-charcoal",
      timeScore: 1 + getTimeOfDayFraction(startTime),
    };
  }

  // Tier 4: This week (2-6 days out)
  if (diffDays >= 2 && diffDays <= 6) {
    return {
      nextDate: target,
      tier: 4,
      label: `${dayLabel}${timeStr}`,
      badge: null,
      badgeColor: "",
      timeScore: diffDays + getTimeOfDayFraction(startTime),
    };
  }

  // Tier 5: Next week (7-13 days out)
  if (diffDays >= 7 && diffDays <= 13) {
    return {
      nextDate: target,
      tier: 5,
      label: `Next ${dayLabel}${timeStr}`,
      badge: null,
      badgeColor: "",
      timeScore: diffDays + getTimeOfDayFraction(startTime),
    };
  }

  // Tier 6: This month (14-30 days)
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  if (diffDays >= 14 && diffDays <= 30) {
    return {
      nextDate: target,
      tier: 6,
      label: `${monthNames[target.getMonth()]} ${target.getDate()}${timeStr}`,
      badge: null,
      badgeColor: "",
      timeScore: diffDays + getTimeOfDayFraction(startTime),
    };
  }

  // Tier 7: More than a month out
  return {
    nextDate: target,
    tier: 7,
    label: `${monthNames[target.getMonth()]} ${target.getDate()}${timeStr}`,
    badge: null,
    badgeColor: "",
    timeScore: diffDays + getTimeOfDayFraction(startTime),
  };
}

/** Fraction of day from time string for sub-day sorting (0-1). */
function getTimeOfDayFraction(time: string | null): number {
  if (!time) return 0.5; // no time = middle of day
  const [h, m] = time.split(":").map(Number);
  return (h * 60 + m) / (24 * 60);
}

function formatEndTime(start: Date, hoursLater: number): string {
  const end = new Date(start.getTime() + hoursLater * 3600000);
  const h = end.getHours();
  const m = end.getMinutes();
  const period = h >= 12 ? "PM" : "AM";
  const display = h % 12 || 12;
  return `${display}:${String(m).padStart(2, "0")} ${period}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// --- Combined Ranking ---

const TIME_WEIGHT = 0.6;
const DISTANCE_WEIGHT = 0.4;

// Normalize distance to a 0-100 scale (0 miles = 0, 50+ miles = 100)
const MAX_DISTANCE_FOR_SCORE = 50;

/**
 * Compute a combined priority score for ranking.
 * Lower score = higher priority (closer + sooner).
 */
export function computePriorityScore(
  timing: EventTiming,
  distanceMiles: number | null
): number {
  const timeScore = timing.timeScore;
  const distScore = distanceMiles !== null
    ? Math.min(distanceMiles / MAX_DISTANCE_FOR_SCORE, 1) * 100
    : 50; // no distance info = middle

  return TIME_WEIGHT * timeScore + DISTANCE_WEIGHT * distScore;
}

/**
 * Get the urgency-based map pin color for a game.
 * Overrides the default type-based coloring for urgent events.
 */
export function getUrgencyPinColor(tier: UrgencyTier): string | null {
  switch (tier) {
    case 1: return "#EF4444"; // red — happening now
    case 2: return "#F97316"; // orange — today
    case 3: return "#F59E0B"; // amber — tomorrow
    default: return null; // use default type-based color
  }
}
