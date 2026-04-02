"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, ExternalLink } from "lucide-react";
import { useFirestoreListings } from "@/hooks/useFirestoreListings";
import { useEnrichedGames } from "@/hooks/useOrganizerOverrides";
import { isEventExpired, slugify, formatTime } from "@/lib/utils";

interface MonthTheme {
  emoji: string;
  headline: string;
  subhead: string;
  keywords: string[];
  searchQuery?: string;
  gradient: string;
  accent: string;
  accentText: string;
}

const MONTHLY_THEMES: Record<number, MonthTheme> = {
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
    subhead: "NMJL card release parties, walkthroughs, Masters watch events, and spring tournaments",
    keywords: ["new card", "nmjl", "card release", "card party", "walkthrough", "masters", "spring", "april"],
    searchQuery: "new card",
    gradient: "from-violet-500 to-purple-400",
    accent: "border-violet-200 hover:border-violet-400",
    accentText: "text-violet-600",
  },
  4: {
    emoji: "🌮",
    headline: "Cinco de Mahjo",
    subhead: "May fiestas, Memorial Day retreats, and spring events",
    keywords: ["cinco", "mahjo", "memorial", "fiesta", "may", "spring retreat"],
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

export default function SeasonalEvents() {
  const month = new Date().getMonth();
  const theme = MONTHLY_THEMES[month];

  const baseGames = useFirestoreListings();
  const enrichedGames = useEnrichedGames(baseGames);

  const { seasonalEvents, upcomingFallback } = useMemo(() => {
    const now = new Date();
    const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const active = enrichedGames.filter((g) => g.status === "active" && !isEventExpired(g));

    const seasonal = theme
      ? active
          .filter((g) => {
            const text = ((g.name || "") + " " + (g.description || "")).toLowerCase();
            return theme.keywords.some((kw) => text.includes(kw.toLowerCase()));
          })
          .sort((a, b) => {
            if (a.eventDate && b.eventDate) return a.eventDate.localeCompare(b.eventDate);
            if (a.eventDate) return -1;
            if (b.eventDate) return 1;
            return 0;
          })
          .slice(0, 6)
      : [];

    const fallback = active
      .filter((g) => {
        if (g.isRecurring || !g.eventDate) return false;
        const eventDate = new Date(g.eventDate + "T00:00:00");
        return eventDate >= now && eventDate <= thirtyDaysOut;
      })
      .sort((a, b) => {
        const dateA = new Date(a.eventDate! + "T00:00:00");
        const dateB = new Date(b.eventDate! + "T00:00:00");
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 6);

    return { seasonalEvents: seasonal, upcomingFallback: fallback };
  }, [enrichedGames, theme]);

  // Seasonal theme with matches
  if (theme && seasonalEvents.length > 0) {
    const searchUrl = theme.searchQuery
      ? `/search?q=${encodeURIComponent(theme.searchQuery)}`
      : `/events`;

    return (
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          {/* Header */}
          <div className={`rounded-2xl bg-gradient-to-r ${theme.gradient} p-6 sm:p-8 mb-8 text-white relative overflow-hidden`}>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-7xl sm:text-8xl opacity-20 select-none pointer-events-none">
              {theme.emoji}
            </div>
            <div className="relative">
              <span className="text-3xl mr-3">{theme.emoji}</span>
              <h2 className="font-[family-name:var(--font-heading)] font-extrabold text-2xl sm:text-3xl inline">
                {theme.headline}
              </h2>
              <p className="text-white/80 mt-2 text-sm sm:text-base">{theme.subhead}</p>
            </div>
          </div>

          {/* Event cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {seasonalEvents.map((g) => {
              const eventDate = g.eventDate ? new Date(g.eventDate + "T00:00:00") : null;
              const gameUrl = `/games/${slugify(g.city + "-" + g.state)}/${slugify(g.name)}`;
              return (
                <Link
                  key={g.id}
                  href={gameUrl}
                  className={`block bg-white border-2 ${theme.accent} rounded-xl p-4 hover:shadow-md transition-all group`}
                >
                  <div className="flex items-start gap-3">
                    {eventDate && (
                      <div className="shrink-0 text-center w-12">
                        <div className={`bg-gradient-to-b ${theme.gradient} text-white text-[9px] font-bold uppercase rounded-t-lg py-0.5`}>
                          {eventDate.toLocaleDateString("en-US", { month: "short" })}
                        </div>
                        <div className="border border-t-0 border-slate-200 rounded-b-lg py-1">
                          <p className="text-lg font-bold text-charcoal leading-none">{eventDate.getDate()}</p>
                        </div>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-charcoal text-sm line-clamp-2 group-hover:text-hotpink-500 transition-colors">
                        {g.name}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{g.city}, {g.state}</span>
                      </div>
                      {g.cost && g.cost !== "Contact for price" && (
                        <p className="text-xs text-slate-400 mt-1">{g.cost}</p>
                      )}
                    </div>
                    <ExternalLink className={`w-3.5 h-3.5 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${theme.accentText}`} />
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center">
            <Link
              href={searchUrl}
              className="inline-flex items-center gap-2 text-sm font-semibold text-hotpink-500 hover:text-hotpink-600 transition-colors"
            >
              Find more {theme.emoji} events near you <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // Fallback: plain upcoming events
  if (upcomingFallback.length === 0) return null;

  return (
    <section className="py-10 sm:py-12 section-pink">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-lg text-charcoal flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-hotpink-500" />
            Upcoming Events
          </h2>
          <Link href="/events" className="text-sm font-medium text-hotpink-500 hover:text-hotpink-600 flex items-center gap-1">
            See all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {upcomingFallback.map((g) => {
            const eventDate = new Date(g.eventDate! + "T00:00:00");
            const monthShort = eventDate.toLocaleDateString("en-US", { month: "short" });
            const day = eventDate.getDate();
            const dayOfWeek = eventDate.toLocaleDateString("en-US", { weekday: "short" });

            return (
              <Link
                key={g.id}
                href={`/games/${slugify(g.city + "-" + g.state)}/${slugify(g.name)}`}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:border-hotpink-300 hover:shadow-sm transition-all group flex gap-4"
              >
                <div className="shrink-0 w-14 text-center">
                  <div className="bg-hotpink-500 text-white text-[10px] font-bold uppercase rounded-t-lg py-0.5">
                    {monthShort}
                  </div>
                  <div className="border border-t-0 border-slate-200 rounded-b-lg py-1">
                    <p className="text-xl font-bold text-charcoal leading-none">{day}</p>
                    <p className="text-[10px] text-slate-400">{dayOfWeek}</p>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-charcoal group-hover:text-hotpink-500 transition-colors line-clamp-2 mb-1">
                    {g.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{g.city}, {g.state}</span>
                  </div>
                  {g.eventStartTime && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatTime(g.eventStartTime)}
                      {g.eventEndTime && ` – ${formatTime(g.eventEndTime)}`}
                    </p>
                  )}
                </div>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-hotpink-400" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
