"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, ExternalLink, CalendarDays, Search } from "lucide-react";
import { useFirestoreListings } from "@/hooks/useFirestoreListings";
import { useEnrichedGames } from "@/hooks/useOrganizerOverrides";
import { isEventExpired, slugify } from "@/lib/utils";
import { getEventTiming } from "@/lib/event-timing";
import {
  MONTHLY_THEMES,
  getAllKeywords,
  gameMatchesKeywords,
  findSubthemeForGame,
  type Subtheme,
} from "@/lib/seasonal-themes";
import type { Game } from "@/types";

/**
 * /seasonal — the full themed-events landing page.
 *
 * Automatically renders the current month's theme from MONTHLY_THEMES.
 * If the theme has sub-themes, events are grouped by sub-theme (e.g. in
 * April: NMJL Card Release / The Masters / Kentucky Derby / Cinco de
 * Mayo). Otherwise events are shown as a flat date-sorted grid.
 *
 * All keyword / next-occurrence logic is imported from
 * @/lib/seasonal-themes so this page and the homepage SeasonalEvents
 * component can't drift apart.
 */
export default function SeasonalPage() {
  const month = new Date().getMonth();
  const theme = MONTHLY_THEMES[month];

  const baseGames = useFirestoreListings();
  const enrichedGames = useEnrichedGames(baseGames);

  const { grouped, flat, totalMatches } = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    if (!theme) {
      return { grouped: null, flat: [], totalMatches: 0 };
    }

    const keywords = getAllKeywords(theme);
    const active = enrichedGames.filter(
      (g) => g.status === "active" && !isEventExpired(g)
    );

    // Tag every candidate game with its next occurrence (so recurring
    // weekly events show the next Wednesday/Saturday/etc. instead of a
    // stale start date), then keep only games that match a theme keyword
    // AND have a real upcoming date.
    type Candidate = { game: Game; nextDate: Date };
    const candidates: Candidate[] = [];
    for (const game of active) {
      if (!gameMatchesKeywords(game, keywords)) continue;
      const nextDate = getEventTiming(game, now).nextDate;
      if (!nextDate || nextDate < todayStart) continue;
      candidates.push({ game, nextDate });
    }
    candidates.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());

    // If the theme has sub-themes, bucket the candidates so each sub-theme
    // gets its own section on the page.
    if (theme.subthemes && theme.subthemes.length > 0) {
      const buckets = new Map<string, Candidate[]>();
      for (const sub of theme.subthemes) {
        buckets.set(sub.label, []);
      }
      for (const cand of candidates) {
        const sub = findSubthemeForGame(cand.game, theme);
        if (sub && buckets.has(sub.label)) {
          buckets.get(sub.label)!.push(cand);
        }
      }
      return {
        grouped: theme.subthemes.map((sub) => ({
          sub,
          events: buckets.get(sub.label) || [],
        })),
        flat: candidates,
        totalMatches: candidates.length,
      };
    }

    return { grouped: null, flat: candidates, totalMatches: candidates.length };
  }, [enrichedGames, theme]);

  // No theme configured for this month — extremely unlikely (every month
  // 0-11 has one) but handle it gracefully.
  if (!theme) {
    return <EmptyState />;
  }

  return (
    <div className="min-h-screen section-warm">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-hotpink-500 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {/* Hero */}
        <div
          className={`rounded-2xl bg-gradient-to-r ${theme.gradient} p-6 sm:p-10 mb-10 text-white relative overflow-hidden`}
        >
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[7rem] sm:text-[10rem] opacity-20 select-none pointer-events-none leading-none">
            {theme.emoji}
          </div>
          <div className="relative max-w-2xl">
            <p className="text-white/70 text-xs uppercase tracking-wider font-bold mb-2">
              This month on MahjNearMe
            </p>
            <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-3xl sm:text-4xl lg:text-5xl mb-3">
              {theme.emoji} {theme.headline}
            </h1>
            <p className="text-white/90 text-sm sm:text-base">{theme.subhead}</p>
            {totalMatches > 0 && (
              <p className="text-white/70 text-xs mt-4">
                {totalMatches} themed event{totalMatches !== 1 ? "s" : ""} coming
                up
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        {totalMatches === 0 ? (
          <NoMatches theme={theme} />
        ) : grouped ? (
          <GroupedView grouped={grouped} theme={theme} />
        ) : (
          <FlatView events={flat} theme={theme} />
        )}

        {/* Footer CTA */}
        <div className="mt-16 text-center">
          <p className="text-sm text-slate-500 mb-3">
            Looking for something else?
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-white border-2 border-hotpink-300 text-hotpink-600 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-hotpink-50 transition-colors"
          >
            <Search className="w-4 h-4" />
            Browse all games near me
          </Link>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function GroupedView({
  grouped,
  theme,
}: {
  grouped: { sub: Subtheme; events: { game: Game; nextDate: Date }[] }[];
  theme: { accent: string; accentText: string; gradient: string };
}) {
  return (
    <div className="space-y-12">
      {grouped.map(({ sub, events }) => {
        if (events.length === 0) return null;
        return (
          <section key={sub.label}>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-[family-name:var(--font-heading)] font-bold text-xl sm:text-2xl text-charcoal flex items-center gap-2">
                <span className="text-2xl">{sub.emoji}</span>
                {sub.label}
              </h2>
              <span className="text-xs text-slate-400">
                {events.length} event{events.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map(({ game, nextDate }) => (
                <EventCard
                  key={game.id}
                  game={game}
                  nextDate={nextDate}
                  theme={theme}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function FlatView({
  events,
  theme,
}: {
  events: { game: Game; nextDate: Date }[];
  theme: { accent: string; accentText: string; gradient: string };
}) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map(({ game, nextDate }) => (
        <EventCard key={game.id} game={game} nextDate={nextDate} theme={theme} />
      ))}
    </div>
  );
}

function EventCard({
  game,
  nextDate,
  theme,
}: {
  game: Game;
  nextDate: Date;
  theme: { accent: string; accentText: string; gradient: string };
}) {
  const gameUrl = `/games/${slugify(game.city + "-" + game.state)}/${slugify(
    game.name
  )}`;
  return (
    <Link
      href={gameUrl}
      className={`block bg-white border-2 ${theme.accent} rounded-xl p-4 hover:shadow-md transition-all group`}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 text-center w-12">
          <div
            className={`bg-gradient-to-b ${theme.gradient} text-white text-[9px] font-bold uppercase rounded-t-lg py-0.5`}
          >
            {nextDate.toLocaleDateString("en-US", { month: "short" })}
          </div>
          <div className="border border-t-0 border-slate-200 rounded-b-lg py-1">
            <p className="text-lg font-bold text-charcoal leading-none">
              {nextDate.getDate()}
            </p>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-charcoal text-sm line-clamp-2 group-hover:text-hotpink-500 transition-colors">
            {game.name}
          </p>
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
            <MapPin className="w-3 h-3 shrink-0" />
            <span>
              {game.city}, {game.state}
            </span>
          </div>
          {game.cost && game.cost !== "Contact for price" && (
            <p className="text-xs text-slate-400 mt-1">{game.cost}</p>
          )}
        </div>
        <ExternalLink
          className={`w-3.5 h-3.5 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${theme.accentText}`}
        />
      </div>
    </Link>
  );
}

function NoMatches({
  theme,
}: {
  theme: { emoji: string; headline: string };
}) {
  return (
    <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
      <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <h2 className="font-semibold text-lg text-charcoal mb-2">
        No themed events yet
      </h2>
      <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
        We couldn&apos;t find any {theme.emoji} {theme.headline.toLowerCase()}{" "}
        events on the site yet — organizers usually add them closer to the
        date. In the meantime, browse all the games near you:
      </p>
      <Link
        href="/search"
        className="inline-flex items-center gap-2 bg-hotpink-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-hotpink-600 transition-colors"
      >
        <Search className="w-4 h-4" />
        Find games
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="min-h-screen section-warm flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-3">
          No seasonal events this month
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Check back soon, or browse all the mahjong games near you.
        </p>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 bg-hotpink-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-hotpink-600 transition-colors"
        >
          <Search className="w-4 h-4" />
          Find games
        </Link>
      </div>
    </div>
  );
}
