/**
 * The two mutually exclusive schedule shapes a listing can be stored in.
 *
 * A listing is either a recurring session (dayOfWeek + times + frequency) or a
 * dated one-off (eventDate + times). Storing both is what produced records
 * like "Mahjong in the Mountains": a weekly Tuesday 10:00-22:00 schedule
 * sitting on a dated three-day retreat, which `isEventExpired()` then refuses
 * to retire because `isRecurring` is true.
 *
 * This lives in one place, and is pure, because the two admin screens built
 * the payload independently and drifted: one wrote `isRecurring: true` onto
 * everything it saved, the other inferred recurrence from a non-empty
 * dayOfWeek and left any eventDate in place underneath.
 *
 * ## Why explicit nulls rather than FieldValue.delete()
 *
 * The unselected shape's fields are set to `null`, not deleted. Both work for
 * this schema, because `docToGame` coalesces a missing field and an explicit
 * null to the same value (`(data.eventDate as string) || null`), so a reader
 * cannot tell them apart. Null is preferred here because the payload crosses
 * two JSON boundaries on its way to Firestore (client -> /api/admin-proxy ->
 * route), and `JSON.stringify` preserves `null` while silently dropping
 * `undefined`. A dropped key under `{ merge: true }` leaves the old value in
 * place — which is exactly the stale-field bug this function exists to
 * prevent. A sentinel object like FieldValue.delete() would not survive those
 * JSON hops either; it would have to be reconstructed server-side.
 */

export type ScheduleMode = "recurring" | "one_time";

export interface ScheduleInput {
  mode: ScheduleMode;
  dayOfWeek: string;
  frequency: string;
  /** Start time, "HH:MM". Used for both shapes. */
  startTime: string;
  /** End time, "HH:MM". Used for both shapes. */
  endTime: string;
  /** "YYYY-MM-DD". Required when mode is "one_time". */
  eventDate: string;
  /** "YYYY-MM-DD". Optional last day of a multi-day one-off. */
  eventEndDate?: string;
}

export interface ScheduleFields {
  isRecurring: boolean;
  recurringSchedule: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    frequency: string;
  } | null;
  eventDate: string | null;
  eventEndDate: string | null;
  eventStartTime: string | null;
  eventEndTime: string | null;
}

/**
 * Build the stored schedule fields for one mode, nulling the other's.
 *
 * Every field of both shapes is always present in the return value, so a
 * `{ merge: true }` write cannot leave a stale field from the previous shape
 * behind.
 */
export function scheduleFieldsFor(input: ScheduleInput): ScheduleFields {
  if (input.mode === "one_time") {
    return {
      isRecurring: false,
      recurringSchedule: null,
      eventDate: input.eventDate || null,
      // A single-day event stores no end date rather than repeating the start,
      // so "is this multi-day?" has one answer everywhere.
      eventEndDate:
        input.eventEndDate && input.eventEndDate !== input.eventDate
          ? input.eventEndDate
          : null,
      // Times are preserved across a mode change rather than discarded: a
      // 10:00-22:00 session keeps its hours when it becomes a dated event.
      eventStartTime: input.startTime || null,
      eventEndTime: input.endTime || null,
    };
  }
  return {
    isRecurring: true,
    recurringSchedule: {
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      frequency: input.frequency || "weekly",
    },
    eventDate: null,
    eventEndDate: null,
    eventStartTime: null,
    eventEndTime: null,
  };
}

/**
 * Which shape is a stored record actually in?
 *
 * `isRecurring` alone is not enough to go on, because the old admin form wrote
 * `isRecurring: true` onto every record it saved while leaving any eventDate
 * in place. Prefer the explicit flag, and fall back to the presence of a date.
 */
export function scheduleModeOf(game: {
  isRecurring: boolean;
  eventDate: string | null;
}): ScheduleMode {
  if (game.isRecurring) return "recurring";
  return game.eventDate ? "one_time" : "recurring";
}

/**
 * True when a record stores both shapes at once.
 *
 * Public surfaces prefer the recurring shape and drop the date silently
 * (`formatSchedule`, `getEventTiming`), so a conflicted record reads as an
 * ordinary weekly game with its real date invisible — and never expires.
 */
export function hasConflictingSchedule(game: {
  isRecurring: boolean;
  recurringSchedule: unknown;
  eventDate: string | null;
}): boolean {
  return Boolean(game.isRecurring && game.recurringSchedule && game.eventDate);
}
