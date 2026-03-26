/**
 * Giveaway configuration.
 *
 * Jack: edit this file to update the current month's giveaway.
 * Change the prize name, value, and description before each draw.
 */

export const CURRENT_GIVEAWAY = {
  /** Month label shown in the hero. e.g. "April" */
  month: "April",

  /** Prize name. Shown prominently. */
  prizeName: "Premium Mahjong Accessory",

  /** Prize value. Shown in parentheses. Set to null to hide. */
  prizeValue: null as string | null,

  /** One-line description under the prize name. */
  prizeDescription: "A premium mahjong accessory — revealed at the start of each month",

  /** Number of winners this month. */
  numberOfWinners: 1,

  /** Draw date. */
  drawDate: "April 30, 2026",
};
