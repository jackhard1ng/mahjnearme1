/**
 * Monthly themed-event configuration shared by:
 *   - src/components/SeasonalEvents.tsx (the homepage "New Card, New Plays"
 *     card carousel)
 *   - src/app/seasonal/page.tsx (the full dedicated themed-events page)
 *
 * Every month has a MonthTheme. Months that care about multiple distinct
 * sub-topics (April has NMJL card release + Masters + Derby + Cinco, May
 * has Cinco + Derby + Memorial Day, etc.) use `subthemes` to group keywords
 * by topic so the /seasonal page can render them as separate sections.
 *
 * Months without sub-themes just use a flat `keywords` list.
 *
 * Keyword matching rules (enforced by `gameMatchesKeywords` below):
 *   - Case-insensitive.
 *   - Match against the event NAME only, NOT the description. Descriptions
 *     on generic weekly leagues frequently mention "NMJL rules" as a rules
 *     note and would false-positive the whole page.
 *   - Word-boundary aware: the keyword must be preceded by a space or be at
 *     the very start of the name. Without this, "de mahjo" matches
 *     "eastside mahjong" and "masters" matches "grandmasters".
 */

import type { Game } from "@/types";

export interface Subtheme {
  /** Short label shown as the section header on /seasonal. */
  label: string;
  /** Emoji for the section header. */
  emoji: string;
  /** Keywords to match against `game.name` (lowercased, word-boundary). */
  keywords: string[];
}

export interface MonthTheme {
  /** Hero emoji. */
  emoji: string;
  /** Hero headline. */
  headline: string;
  /** Hero subhead (one-line description). */
  subhead: string;
  /**
   * Flat keyword list. Either provide this OR `subthemes`. If `subthemes`
   * is provided, this is derived automatically (do not set both).
   */
  keywords?: string[];
  /**
   * Grouped sub-themes. When provided, /seasonal renders one section per
   * sub-theme and the homepage section uses the flattened keyword list.
   */
  subthemes?: Subtheme[];
  /** Pre-filled query for the Find Games search (fallback when we can't
   *  link to /seasonal for some reason). */
  searchQuery?: string;
  /** Tailwind gradient applied to the hero. */
  gradient: string;
  /** Tailwind border class for event cards. */
  accent: string;
  /** Tailwind text color class for the accent. */
  accentText: string;
}

/**
 * Get all keywords for a theme, whether they live on the flat `keywords`
 * array or inside grouped `subthemes`.
 */
export function getAllKeywords(theme: MonthTheme): string[] {
  if (theme.subthemes && theme.subthemes.length > 0) {
    return theme.subthemes.flatMap((s) => s.keywords);
  }
  return theme.keywords || [];
}

/**
 * Case-insensitive, word-boundary-aware keyword match against a game's
 * name. See file header for the rules.
 */
export function gameMatchesKeywords(game: Game, keywords: string[]): boolean {
  const name = " " + (game.name || "").toLowerCase();
  return keywords.some((kw) => name.includes(" " + kw.toLowerCase()));
}

/**
 * Find which sub-theme (if any) a game belongs to. Returns the FIRST
 * matching sub-theme; keyword lists should be designed so they don't
 * overlap meaningfully. Returns null if the theme has no sub-themes or
 * the game doesn't match any of them.
 */
export function findSubthemeForGame(
  game: Game,
  theme: MonthTheme
): Subtheme | null {
  if (!theme.subthemes) return null;
  for (const sub of theme.subthemes) {
    if (gameMatchesKeywords(game, sub.keywords)) return sub;
  }
  return null;
}

export const MONTHLY_THEMES: Record<number, MonthTheme> = {
  0: {
    emoji: "🎉",
    headline: "New Year, New Games",
    subhead: "Kick off the year at a mahjong event near you",
    keywords: ["new year", "january", "winter", "resolution"],
    gradient: "from-indigo-500 to-blue-400",
    accent: "border-indigo-200 hover:border-indigo-400",
    accentText: "text-indigo-600",
  },
  1: {
    emoji: "💕",
    headline: "Mahj With Someone You Love",
    subhead: "Valentine's Day events, couple-friendly sessions, and more",
    keywords: ["valentine", "galentine", "love", "heart", "february"],
    searchQuery: "valentine",
    gradient: "from-pink-500 to-rose-400",
    accent: "border-pink-200 hover:border-pink-400",
    accentText: "text-pink-600",
  },
  2: {
    emoji: "🍀",
    headline: "Lucky Tiles This March",
    subhead: "St. Paddy's Day events, March Madness tournaments, and spring kick-offs",
    keywords: ["st patrick", "st. patrick", "paddy", "lucky", "shamrock", "march madness", "madness", "green"],
    searchQuery: "march",
    gradient: "from-emerald-500 to-green-400",
    accent: "border-emerald-200 hover:border-emerald-400",
    accentText: "text-emerald-600",
  },
  3: {
    emoji: "🃏",
    headline: "New Card, New Plays",
    subhead: "NMJL card release parties, Masters-themed tournaments, Kentucky Derby events, and Cinco de Mayo celebrations",
    // Sub-theme ORDER MATTERS: findSubthemeForGame assigns each game to the
    // FIRST matching sub-theme, so the narrowest / most specific occasions
    // must come before the broad "NMJL Card Release" bucket. Otherwise an
    // event like "Cinco De Mahjo - Learn the 2026 NMJL Card" gets bucketed
    // under NMJL (because "nmjl" matches the name) when it's really a
    // Cinco party with an NMJL learning component.
    subthemes: [
      {
        label: "The Masters",
        emoji: "⛳",
        keywords: ["masters"],
      },
      {
        label: "Kentucky Derby",
        emoji: "🐎",
        keywords: [
          "kentucky derby",
          "mahj derby",
          "derby-themed",
          "derby day",
          "run for the jokers",
        ],
      },
      {
        label: "Cinco de Mayo",
        emoji: "🌮",
        keywords: ["cinco", "de mahjo", "de mahj-o", "de mahjong"],
      },
      {
        label: "NMJL Card Release",
        emoji: "🃏",
        keywords: [
          "new card",
          "nmjl",
          "card release",
          "card party",
          "card class",
          "card workshop",
          "card walkthrough",
          "new-card",
        ],
      },
    ],
    searchQuery: "new card",
    gradient: "from-violet-500 to-purple-400",
    accent: "border-violet-200 hover:border-violet-400",
    accentText: "text-violet-600",
  },
  4: {
    emoji: "🌹",
    headline: "Derby Day & Cinco de Mahjo",
    subhead: "Kentucky Derby parties, Cinco de Mayo mahjong events, and Memorial Day tournaments",
    subthemes: [
      {
        label: "Kentucky Derby",
        emoji: "🐎",
        keywords: [
          "kentucky derby",
          "mahj derby",
          "derby-themed",
          "derby day",
          "run for the jokers",
          "run for the roses",
        ],
      },
      {
        label: "Cinco de Mayo",
        emoji: "🌮",
        keywords: ["cinco", "de mahjo", "de mahj-o", "de mahjong", "fiesta"],
      },
      {
        label: "Memorial Day",
        emoji: "🇺🇸",
        keywords: ["memorial day"],
      },
    ],
    searchQuery: "cinco",
    gradient: "from-amber-500 to-yellow-400",
    accent: "border-amber-200 hover:border-amber-400",
    accentText: "text-amber-600",
  },
  5: {
    emoji: "🏳️‍🌈",
    headline: "Pride & Tiles",
    subhead: "Pride month events, summer kick-offs, and outdoor sessions",
    keywords: ["pride", "rainbow", "summer", "june", "outdoor"],
    searchQuery: "pride",
    gradient: "from-pink-500 to-orange-400",
    accent: "border-pink-200 hover:border-pink-400",
    accentText: "text-pink-600",
  },
  6: {
    emoji: "🎆",
    headline: "Red, White & Mahjong",
    subhead: "Independence Day events, summer tournaments, and holiday sessions",
    keywords: ["independence", "july 4", "4th of july", "fourth", "patriot", "summer tournament"],
    searchQuery: "july",
    gradient: "from-red-500 to-blue-500",
    accent: "border-red-200 hover:border-red-400",
    accentText: "text-red-600",
  },
  7: {
    emoji: "☀️",
    headline: "Summer Send-Off",
    subhead: "Late summer tournaments, back-to-school events, and outdoor sessions",
    keywords: ["summer", "august", "back to school", "sendoff", "outdoor", "pool"],
    searchQuery: "summer",
    gradient: "from-orange-400 to-yellow-300",
    accent: "border-orange-200 hover:border-orange-400",
    accentText: "text-orange-600",
  },
  8: {
    emoji: "🍂",
    headline: "Fall Into Mahjong",
    subhead: "Labor Day events, fall league kick-offs, and autumn tournaments",
    keywords: ["labor day", "fall", "autumn", "september", "league kickoff", "kick off"],
    searchQuery: "fall",
    gradient: "from-orange-500 to-amber-400",
    accent: "border-orange-200 hover:border-orange-400",
    accentText: "text-orange-600",
  },
  9: {
    emoji: "🎃",
    headline: "Spooky Tiles",
    subhead: "Halloween events, costume tournaments, and haunted mahj nights",
    keywords: ["halloween", "spooky", "costume", "trick", "treat", "haunted", "october", "fall"],
    searchQuery: "halloween",
    gradient: "from-orange-600 to-purple-500",
    accent: "border-orange-200 hover:border-orange-400",
    accentText: "text-orange-700",
  },
  10: {
    emoji: "🦃",
    headline: "Grateful for the Game",
    subhead: "Thanksgiving week events, friendsgiving mahjong nights, and year-end tournaments",
    keywords: ["thanksgiving", "friendsgiving", "grateful", "november", "turkey", "holiday"],
    searchQuery: "thanksgiving",
    gradient: "from-amber-600 to-orange-500",
    accent: "border-amber-200 hover:border-amber-400",
    accentText: "text-amber-700",
  },
  11: {
    emoji: "🎄",
    headline: "Holiday Mahj Season",
    subhead: "Holiday parties, year-end tournaments, and festive open play",
    keywords: ["holiday", "christmas", "hanukkah", "chanukah", "new year", "december", "winter", "festive", "party"],
    searchQuery: "holiday",
    gradient: "from-red-500 to-green-500",
    accent: "border-red-200 hover:border-red-400",
    accentText: "text-red-600",
  },
};

/** Convenience: get the theme for the current month. */
export function getCurrentMonthTheme(): MonthTheme | null {
  const month = new Date().getMonth();
  return MONTHLY_THEMES[month] ?? null;
}
