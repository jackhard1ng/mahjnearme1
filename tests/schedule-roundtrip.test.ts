/**
 * Event schedule round-trip tests.
 *
 * Pins the invariant that a listing is stored as EITHER a recurring session OR
 * a dated one-off, never both, and that switching mode clears the other
 * shape's fields rather than leaving them underneath.
 *
 * The real record that motivated this: both "Mahjong in the Mountains" rows
 * store a weekly Tuesday 10:00-22:00 schedule AND eventDate 2026-07-21, for a
 * three-day retreat that ended in July. Because isRecurring is true,
 * isEventExpired() returns false and the listing never retires.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  scheduleFieldsFor,
  scheduleModeOf,
  hasConflictingSchedule,
  type ScheduleInput,
} from "../src/lib/schedule-fields.ts";
import { isEventExpired, formatSchedule } from "../src/lib/utils.ts";

const base: ScheduleInput = {
  mode: "recurring",
  dayOfWeek: "tuesday",
  frequency: "weekly",
  startTime: "10:00",
  endTime: "22:00",
  eventDate: "2026-07-21",
};

describe("recurring -> one-time", () => {
  const out = scheduleFieldsFor({ ...base, mode: "one_time" });

  test("clears the recurring shape with explicit nulls, not by omission", () => {
    // Omitting a key under { merge: true } leaves the stored value in place.
    // The key must be present and null for the write to actually clear it.
    assert.ok("recurringSchedule" in out, "recurringSchedule key must be present");
    assert.equal(out.recurringSchedule, null);
    assert.equal(out.isRecurring, false);
  });

  test("sets the date", () => {
    assert.equal(out.eventDate, "2026-07-21");
  });

  test("preserves start and end times rather than discarding them", () => {
    assert.equal(out.eventStartTime, "10:00");
    assert.equal(out.eventEndTime, "22:00");
  });
});

describe("one-time -> recurring", () => {
  const out = scheduleFieldsFor({ ...base, mode: "recurring" });

  test("clears every one-time field with explicit nulls", () => {
    for (const key of ["eventDate", "eventStartTime", "eventEndTime"] as const) {
      assert.ok(key in out, `${key} key must be present`);
      assert.equal(out[key], null, `${key} must be null`);
    }
  });

  test("sets the recurring shape, including frequency", () => {
    assert.equal(out.isRecurring, true);
    assert.deepEqual(out.recurringSchedule, {
      dayOfWeek: "tuesday",
      startTime: "10:00",
      endTime: "22:00",
      frequency: "weekly",
    });
  });

  test("defaults a blank frequency to weekly rather than storing empty", () => {
    const o = scheduleFieldsFor({ ...base, mode: "recurring", frequency: "" });
    assert.equal(o.recurringSchedule?.frequency, "weekly");
  });
});

describe("nulls survive the JSON hops to Firestore", () => {
  // The payload crosses client -> /api/admin-proxy -> route, each a
  // JSON.stringify. undefined is dropped silently; null is preserved. A
  // dropped key under { merge: true } is the stale-field bug.
  test("no field is undefined", () => {
    for (const mode of ["recurring", "one_time"] as const) {
      const out = scheduleFieldsFor({ ...base, mode });
      for (const [k, v] of Object.entries(out)) {
        assert.notEqual(v, undefined, `${mode}: ${k} must not be undefined`);
      }
    }
  });

  test("every clearing null survives two JSON round-trips", () => {
    const out = scheduleFieldsFor({ ...base, mode: "recurring" });
    const hopped = JSON.parse(JSON.stringify(JSON.parse(JSON.stringify(out))));
    assert.ok("eventDate" in hopped, "eventDate key lost in transit");
    assert.equal(hopped.eventDate, null);
    assert.ok("eventStartTime" in hopped);
    assert.equal(hopped.eventStartTime, null);
  });

  test("round-tripping both shapes leaves no key behind", () => {
    const a = scheduleFieldsFor({ ...base, mode: "recurring" });
    const b = scheduleFieldsFor({ ...base, mode: "one_time" });
    // Identical key sets in both directions is what guarantees a merge write
    // cannot retain a field from the previous shape.
    assert.deepEqual(Object.keys(a).sort(), Object.keys(b).sort());
  });
});

describe("mode detection on stored records", () => {
  test("a conflicted record (both shapes) is read as recurring", () => {
    // Matches the live Mountains rows, and matches what formatSchedule and
    // getEventTiming already do, so the form shows what the site shows.
    assert.equal(scheduleModeOf({ isRecurring: true, eventDate: "2026-07-21" }), "recurring");
  });

  test("a dated record with isRecurring false is read as one-time", () => {
    assert.equal(scheduleModeOf({ isRecurring: false, eventDate: "2026-08-25" }), "one_time");
  });

  test("a record with neither defaults to recurring", () => {
    assert.equal(scheduleModeOf({ isRecurring: false, eventDate: null }), "recurring");
  });
});

describe("conflict detection matches the real records", () => {
  const mountains = {
    isRecurring: true,
    recurringSchedule: { dayOfWeek: "tuesday", startTime: "10:00", endTime: "22:00", frequency: "weekly" },
    eventDate: "2026-07-21",
  };

  test("flags the live Mountains shape", () => {
    assert.equal(hasConflictingSchedule(mountains), true);
  });

  test("does not flag a clean recurring record", () => {
    assert.equal(hasConflictingSchedule({ ...mountains, eventDate: null }), false);
  });

  test("does not flag a clean one-time record", () => {
    assert.equal(
      hasConflictingSchedule({ isRecurring: false, recurringSchedule: null, eventDate: "2026-07-21" }),
      false
    );
  });

  test("the conflict is why an ended retreat never expires", () => {
    // isEventExpired short-circuits on isRecurring, so the stored date is
    // ignored entirely while the record claims to recur.
    assert.equal(isEventExpired({ isRecurring: true, eventDate: "2026-07-21" }), false);
    // Recorded correctly as one-time, the same date does expire.
    assert.equal(isEventExpired({ isRecurring: false, eventDate: "2026-07-21" }), true);
  });

  test("the public schedule label hides the date while the conflict stands", () => {
    const label = formatSchedule({
      ...mountains,
      eventStartTime: null,
      eventEndTime: null,
    });
    assert.match(label, /Tuesday/i);
    assert.doesNotMatch(label, /2026|July/, "the real date is invisible publicly");
  });
});

describe("multi-day events", () => {
  test("a multi-day event stores only its start date — flagged, not silently handled", () => {
    // The schema has no end-date field for a one-off (leagueStartDate /
    // leagueEndDate exist but are a different concept). A three-day retreat
    // therefore round-trips as its first day. The times are preserved, so
    // nothing is lost that the schema can hold, but operators should know the
    // span lives only in the description.
    const out = scheduleFieldsFor({ ...base, mode: "one_time", eventDate: "2026-07-21" });
    assert.equal(out.eventDate, "2026-07-21");
    assert.equal(out.eventStartTime, "10:00");
    assert.equal(out.eventEndTime, "22:00");
  });
});
