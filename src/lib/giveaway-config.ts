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

  /** Month label shown in the hero. e.g. "April" */
  month: "May",

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

  /** Draw date and time. */
  drawDate: "May 31, 2026 at 3:00 PM CT",
};
