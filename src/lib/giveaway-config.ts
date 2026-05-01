/**
 * Giveaway configuration.
 *
 * Jack: edit this file to update the current month's giveaway.
 * Change the prize name, value, and description before each draw.
 */

export const CURRENT_GIVEAWAY = {
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

