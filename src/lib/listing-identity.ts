/**
 * Identity of a listing for duplicate detection.
 *
 * Used by the organizer submission endpoint to decide whether an incoming
 * listing is a NEW session or a re-submit of one that already exists.
 *
 * ## Why the schedule is part of the key
 *
 * A name + city + state key looks sufficient and is not. 86 live records share
 * a name, city and state with another record while being genuinely different
 * sessions: the Rocky Hill Senior Center and Livingston Senior Center run
 * same-named groups on several days, Mahjong 101 in Alpharetta runs on two
 * separate dates, and the Mobile lesson has two sittings with different end
 * times. Keying on the name alone would reject those submissions.
 *
 * Including the schedule makes the key precise: two submissions collide only
 * when they describe the same session at the same time.
 *
 * ## Why this is needed at all
 *
 * The endpoint already looked for an existing listing to claim, but only
 * matched records with no owner (`!organizerId && !claimedBy`). On a
 * re-submit, the organizer's first record already has both set, so it failed
 * that test and a second record was created. Both "Mahjong in the Mountains"
 * records were created that way, 27 seconds apart.
 *
 * The client's submit button is already disabled while a request is in flight,
 * so this is not protecting against a double click: 27 seconds is a second
 * deliberate attempt, most likely after the first appeared not to work.
 */

/** The shape this module needs; a full Game satisfies it. */
export interface IdentityInput {
  name?: unknown;
  city?: unknown;
  state?: unknown;
  isRecurring?: unknown;
  recurringSchedule?: unknown;
  eventDate?: unknown;
  eventEndDate?: unknown;
}

/**
 * A stable string describing WHEN a listing happens.
 *
 * Deliberately excludes endTime: an organizer correcting 16:30 to 16:00 is
 * editing one session, not creating another. dayOfWeek, startTime and
 * frequency are enough to separate genuinely different sittings.
 */
export function scheduleSignature(d: IdentityInput): string {
  if (d.isRecurring && d.recurringSchedule && typeof d.recurringSchedule === "object") {
    const sc = d.recurringSchedule as Record<string, unknown>;
    return [
      "recurring",
      String(sc.dayOfWeek ?? "").toLowerCase().trim(),
      String(sc.startTime ?? "").trim(),
      String(sc.frequency ?? "weekly").toLowerCase().trim(),
    ].join("|");
  }
  if (d.eventDate) {
    return `one_off|${String(d.eventDate).trim()}|${String(d.eventEndDate ?? "").trim()}`;
  }
  return "none";
}

/** Case- and whitespace-insensitive name + city + state + schedule. */
export function listingIdentityKey(d: IdentityInput): string {
  return [
    String(d.name ?? "").toLowerCase().trim().replace(/\s+/g, " "),
    String(d.city ?? "").toLowerCase().trim().replace(/\s+/g, " "),
    String(d.state ?? "").toUpperCase().trim(),
    scheduleSignature(d),
  ].join("::");
}

/** True when two listings describe the same session. */
export function isSameSession(a: IdentityInput, b: IdentityInput): boolean {
  return listingIdentityKey(a) === listingIdentityKey(b);
}
