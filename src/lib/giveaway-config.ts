/**
 * Giveaway configuration.
 *
 * Jack: edit this file to update the current month's giveaway.
 * Change the prize name, value, and description before each draw.
 *
 * To PAUSE giveaways (no active drawing right now), set `paused: true`.
 * The /giveaways page then stops advertising a prize and a draw date, and
 * instead shows `pausedMessage`. Past winners, "How It Works" and the
 * milestone section stay visible so the page is still worth landing on.
 *
 * `paused` can also be flipped from the admin panel without a deploy — the
 * Firestore siteConfig/giveaway doc overrides this file. This value is the
 * fallback used when that doc is missing or doesn't set `paused`.
 */

export const CURRENT_GIVEAWAY = {
  /**
   * When true, no giveaway is currently running. Set to false and update
   * the fields below when you start the next one.
   */
  paused: true,

  /** Shown on /giveaways while `paused` is true. */
  pausedMessage:
    "Our monthly giveaway is on a short break. Paid members are automatically entered whenever a drawing is running — subscribe now and you'll be in for the next one.",



  /** Prize name. Shown prominently. */
  prizeName: "3 Premium Mahjong Mats",

  /** Prize value. Shown in parentheses. Set to null to hide. */
  prizeValue: "$270 value ($90 each)" as string | null,

  /** One-line description under the prize name. */
  prizeDescription: "Three winners each receive a premium mahjong mat. Free shipping in the continental US.",

  /** Link to the prize (optional). Set to null to hide. */
  prizeLink: null as string | null,

  /** Partner logo image path (optional). Only use if there's an actual partnership. Set to null to hide. */
  partnerLogo: null as string | null,

  /** Partner name for alt text. */
  partnerName: null as string | null,

  /** Number of winners this month. */
  numberOfWinners: 3,

  /**
   * Draw date and time.
   *
   * Leave as null and it is computed from the calendar: the last day of the
   * current month at 3:00 PM CT, rolling to next month once that has passed.
   * Set a string here (or from the admin panel) only to override a specific
   * month, and remember to clear it afterwards.
   *
   * This used to be a hardcoded string. It said "May 31, 2026 at 3:00 PM CT"
   * on the last day of August, which is what a visitor saw on the page the
   * subscription is sold from.
   */
  drawDate: null as string | null,

  /**
   * Month label shown in the hero, e.g. "September".
   *
   * Null means "whatever month the draw is in", derived the same way. Same
   * reasoning as drawDate: it read "May Giveaway" in August.
   */
  monthLabel: null as string | null,
};

/** Last day of `d`'s month, at 15:00 US Central. */
function drawMomentFor(year: number, monthIndex: number): Date {
  // Day 0 of the next month is the last day of this one.
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  // Central is UTC-5 in daylight time and UTC-6 in standard time. US DST runs
  // from the second Sunday in March to the first Sunday in November, and the
  // last day of a month always falls inside one or the other, so a month-based
  // test is exact here without pulling in a timezone library.
  const isDst = monthIndex > 2 && monthIndex < 10;
  const offset = isDst ? 5 : 6;
  return new Date(Date.UTC(year, monthIndex, lastDay, 15 + offset, 0, 0));
}

/**
 * The next draw: last day of this month at 3:00 PM CT, or next month's if
 * this month's has already happened.
 */
export function nextDrawMoment(now: Date = new Date()): Date {
  const thisMonth = drawMomentFor(now.getUTCFullYear(), now.getUTCMonth());
  if (now.getTime() <= thisMonth.getTime()) return thisMonth;
  return drawMomentFor(now.getUTCFullYear(), now.getUTCMonth() + 1);
}

/** e.g. "September 30, 2026 at 3:00 PM CT" */
export function defaultDrawDate(now: Date = new Date()): string {
  const d = nextDrawMoment(now);
  const label = d.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric", timeZone: "America/Chicago",
  });
  return `${label} at 3:00 PM CT`;
}

/** e.g. "September" — the month the next draw falls in. */
export function defaultMonthLabel(now: Date = new Date()): string {
  return nextDrawMoment(now).toLocaleDateString("en-US", {
    month: "long", timeZone: "America/Chicago",
  });
}
