"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, ExternalLink } from "lucide-react";
import { useFirestoreListings } from "@/hooks/useFirestoreListings";
import { useEnrichedGames } from "@/hooks/useOrganizerOverrides";
import { isEventExpired, slugify, formatTime } from "@/lib/utils";
import { getEventTiming } from "@/lib/event-timing";
import {
  MONTHLY_THEMES,
  getAllKeywords,
  gameMatchesKeywords,
} from "@/lib/seasonal-themes";
import type { Game } from "@/types";

export default function SeasonalEvents() {
  const month = new Date().getMonth();
  const theme = MONTHLY_THEMES[month];

  const baseGames = useFirestoreListings();
  const enrichedGames = useEnrichedGames(baseGames);

  const { seasonalEvents, upcomingFallback } = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const sixtyDaysOut = new Date(todayStart.getTime() + 60 * 24 * 60 * 60 * 1000);

    const active = enrichedGames.filter(
      (g) => g.status === "active" && !isEventExpired(g)
    );

    // For each game, compute its next real occurrence (via getEventTiming,
    // which handles both recurring day-of-week math and one-time eventDate).
    // Without this the cards blindly display the stale `eventDate` field on
    // recurring events — which is how a Monday league with `eventDate:
    // "2026-03-30"` ended up showing "MAR 30" on the homepage long after
    // March 30 had passed.
    const withTiming = active.map((g: Game) => ({
      game: g,
      nextDate: getEventTiming(g, now).nextDate,
    }));

    // Seasonal (themed) events: keyword match on the event NAME + must have
    // a computable future occurrence. Matching rules (name-only,
    // word-boundary aware) live in @/lib/seasonal-themes so this component
    // and the /seasonal page can't drift apart.
    const themeKeywords = theme ? getAllKeywords(theme) : [];
    const seasonal = theme
      ? withTiming
          .filter(({ game, nextDate }) => {
            if (!nextDate || nextDate < todayStart) return false;
            return gameMatchesKeywords(game, themeKeywords);
          })
          .sort((a, b) => a.nextDate!.getTime() - b.nextDate!.getTime())
          .slice(0, 6)
      : [];

    // Fallback: upcoming events in the next 60 days. Uses the same
    // next-occurrence helper so recurring events are ranked by their
    // actual next date, not a stale start date.
    const fallback = withTiming
      .filter(({ nextDate }) => {
        if (!nextDate) return false;
        return nextDate >= todayStart && nextDate <= sixtyDaysOut;
      })
      .sort((a, b) => a.nextDate!.getTime() - b.nextDate!.getTime())
      .slice(0, 6);

    return { seasonalEvents: seasonal, upcomingFallback: fallback };
  }, [enrichedGames, theme]);

  // Seasonal theme with matches
  if (theme && seasonalEvents.length > 0) {
    // "Find more" goes to the dedicated /seasonal page, which shows every
    // matching themed event for the current month grouped by sub-theme
    // (NMJL Card Release / Masters / Derby / Cinco etc.). The homepage
    // section is the teaser — /seasonal is the full list.
    const searchUrl = "/seasonal";

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
            {seasonalEvents.map(({ game: g, nextDate }) => {
              const gameUrl = `/games/${slugify(g.city + "-" + g.state)}/${slugify(g.name)}`;
              return (
                <Link
                  key={g.id}
                  href={gameUrl}
                  className={`block bg-white border-2 ${theme.accent} rounded-xl p-4 hover:shadow-md transition-all group`}
                >
                  <div className="flex items-start gap-3">
                    {nextDate && (
                      <div className="shrink-0 text-center w-12">
                        <div className={`bg-gradient-to-b ${theme.gradient} text-white text-[9px] font-bold uppercase rounded-t-lg py-0.5`}>
                          {nextDate.toLocaleDateString("en-US", { month: "short" })}
                        </div>
                        <div className="border border-t-0 border-slate-200 rounded-b-lg py-1">
                          <p className="text-lg font-bold text-charcoal leading-none">{nextDate.getDate()}</p>
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
          {upcomingFallback.map(({ game: g, nextDate }) => {
            if (!nextDate) return null;
            const monthShort = nextDate.toLocaleDateString("en-US", { month: "short" });
            const day = nextDate.getDate();
            const dayOfWeek = nextDate.toLocaleDateString("en-US", { weekday: "short" });

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
