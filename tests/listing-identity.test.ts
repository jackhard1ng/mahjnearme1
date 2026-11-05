/**
 * Duplicate-submission identity tests.
 *
 * The organizer endpoint folds a re-submit into the existing record instead of
 * creating a second one. The danger of getting this wrong is in BOTH
 * directions, so both are tested: too loose a key rejects the 86 live records
 * that legitimately share a name and city, and too tight a key lets the
 * "Mahjong in the Mountains" double-submit through again.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { scheduleSignature, listingIdentityKey, isSameSession } from "../src/lib/listing-identity.ts";

const weekly = (dayOfWeek: string, startTime: string, endTime = "22:00", frequency = "weekly") => ({
  name: "Mahjong in the Mountains",
  city: "Red Feather Lakes",
  state: "CO",
  isRecurring: true,
  recurringSchedule: { dayOfWeek, startTime, endTime, frequency },
  eventDate: null,
});

describe("a re-submit of the same session collides", () => {
  test("identical submissions share a key", () => {
    assert.ok(isSameSession(weekly("tuesday", "10:00"), weekly("tuesday", "10:00")));
  });

  test("casing and padding do not create a false distinction", () => {
    const a = { ...weekly("Tuesday", "10:00"), name: "  Mahjong in the  Mountains ", city: "Red Feather Lakes " };
    const b = { ...weekly("tuesday", "10:00"), state: "co" };
    assert.ok(isSameSession(a, b), "the live records carry exactly this padding");
  });

  test("an endTime correction does not look like a new session", () => {
    // The Mobile lesson has 16:30 and 16:00 variants; an organizer fixing the
    // end time is editing one session.
    assert.ok(isSameSession(weekly("friday", "14:00", "16:30"), weekly("friday", "14:00", "16:00")));
  });

  test("the same one-off date collides", () => {
    const a = { name: "Retreat", city: "X", state: "CO", isRecurring: false, eventDate: "2026-07-21", eventEndDate: "2026-07-23" };
    assert.ok(isSameSession(a, { ...a }));
  });
});

describe("genuinely different sessions do NOT collide", () => {
  test("a different day of the week", () => {
    // Rocky Hill Senior Center and Livingston Senior Center both run
    // same-named groups on several days.
    assert.ok(!isSameSession(weekly("monday", "10:00"), weekly("wednesday", "10:00")));
  });

  test("a different start time on the same day", () => {
    assert.ok(!isSameSession(weekly("tuesday", "10:00"), weekly("tuesday", "18:00")));
  });

  test("a different frequency", () => {
    assert.ok(!isSameSession(weekly("tuesday", "10:00", "22:00", "weekly"), weekly("tuesday", "10:00", "22:00", "monthly")));
  });

  test("two one-off dates for the same named event", () => {
    // Mahjong 101 in Alpharetta runs 15 April and 29 April.
    const base = { name: "Mahjong 101", city: "Alpharetta", state: "GA", isRecurring: false };
    assert.ok(!isSameSession({ ...base, eventDate: "2026-04-15" }, { ...base, eventDate: "2026-04-29" }));
  });

  test("a one-off and a recurring session with the same name", () => {
    const a = { name: "Open Play", city: "X", state: "NY", isRecurring: false, eventDate: "2026-04-15" };
    assert.ok(!isSameSession(a, weekly("tuesday", "10:00")));
  });

  test("a different city", () => {
    assert.ok(!isSameSession(weekly("tuesday", "10:00"), { ...weekly("tuesday", "10:00"), city: "Fort Collins" }));
  });

  test("a multi-day span differs from a single day with the same start", () => {
    const base = { name: "Retreat", city: "X", state: "CO", isRecurring: false, eventDate: "2026-07-21" };
    assert.ok(!isSameSession(base, { ...base, eventEndDate: "2026-07-23" }));
  });
});

describe("signature shape", () => {
  test("a record with no schedule gets a distinct 'none' signature", () => {
    assert.equal(scheduleSignature({ name: "X", isRecurring: false }), "none");
  });

  test("two unscheduled records collide only if name/city/state match", () => {
    // 44.6% of listings store no schedule, so "none" must not be a wildcard
    // that merges unrelated records.
    const a = { name: "Club", city: "Austin", state: "TX" };
    assert.ok(isSameSession(a, { ...a }));
    assert.ok(!isSameSession(a, { ...a, city: "Dallas" }));
  });

  test("the key is a string with all four components", () => {
    const k = listingIdentityKey(weekly("tuesday", "10:00"));
    assert.match(k, /mahjong in the mountains::red feather lakes::CO::recurring\|tuesday\|10:00\|weekly/);
  });
});

describe("the endpoint wires the key in correctly", () => {
  const route = readFileSync("src/app/api/organizer-listings/route.ts", "utf8");

  test("it uses the shared signature rather than a private copy", () => {
    assert.match(route, /from "@\/lib\/listing-identity"/);
    assert.doesNotMatch(route, /const scheduleSignature = /);
  });

  test("an unowned record is still claimable", () => {
    assert.match(route, /!d\.organizerId && !d\.claimedBy/);
  });

  test("a record owned by the SAME organizer with the same signature is folded in", () => {
    assert.match(route, /d\.organizerId === profile\.organizerProfileId/);
    assert.match(route, /scheduleSignature\(d\) === incomingSignature/);
  });

  test("the organizer's own record is preferred over claiming an unowned one", () => {
    assert.match(route, /ownDuplicateId \|\| existingUnownedId/);
  });

  test("the response says whether a re-submit was folded in", () => {
    assert.match(route, /deduplicated: !!ownDuplicateId/);
  });
});

describe("the client already prevents a double click", () => {
  const page = readFileSync("src/app/organizer/page.tsx", "utf8");

  test("the add-event button is disabled while a submit is in flight", () => {
    assert.match(page, /onClick=\{handleSubmit\}\s*\n\s*disabled=\{submitting\}/);
  });

  test("the in-flight flag is cleared in a finally block", () => {
    // Without finally, one thrown error leaves the button disabled forever.
    assert.match(page, /finally \{\s*\n\s*setSubmitting\(false\);/);
  });
});
