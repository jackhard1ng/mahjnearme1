"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { mockGames } from "@/lib/mock-data";
import { formatSchedule, slugify, capitalize } from "@/lib/utils";
import { getCityTile } from "@/lib/city-tiles";
import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  Clock,
  X,
  Users,
  GraduationCap,
  Trophy,
} from "lucide-react";

function getGameTypeIcon(type: string) {
  switch (type) {
    case "open_play": return <Users className="w-3.5 h-3.5" />;
    case "lesson": return <GraduationCap className="w-3.5 h-3.5" />;
    case "league": return <Trophy className="w-3.5 h-3.5" />;
    case "event": return <CalendarDays className="w-3.5 h-3.5" />;
    default: return <Users className="w-3.5 h-3.5" />;
  }
}

function getNextOccurrence(game: (typeof mockGames)[0]): Date | null {
  if (game.isRecurring && game.recurringSchedule) {
    const dayMap: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
      thursday: 4, friday: 5, saturday: 6,
    };
    const targetDay = dayMap[game.recurringSchedule.dayOfWeek.toLowerCase()] ?? 0;
    const now = new Date();
    const today = now.getDay();
    const daysUntil = (targetDay - today + 7) % 7 || 7;
    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + daysUntil);
    const [h, m] = game.recurringSchedule.startTime.split(":").map(Number);
    nextDate.setHours(h, m, 0, 0);
    return nextDate;
  }
  if (game.eventDate) {
    const d = new Date(game.eventDate);
    if (game.eventStartTime) {
      const [h, m] = game.eventStartTime.split(":").map(Number);
      d.setHours(h, m, 0, 0);
    }
    return d;
  }
  return null;
}

// Group events by date
function groupByDate(games: typeof mockGames): Map<string, typeof mockGames> {
  const groups = new Map<string, typeof mockGames>();
  const sorted = [...games].sort((a, b) => {
    const da = getNextOccurrence(a);
    const db = getNextOccurrence(b);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da.getTime() - db.getTime();
  });

  for (const game of sorted) {
    const next = getNextOccurrence(game);
    const key = next
      ? next.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
      : "No Date Set";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(game);
  }
  return groups;
}

export default function CalendarPage() {
  const { user, userProfile, updateUserProfile, hasAccess, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const savedGames = useMemo(() => {
    if (!userProfile?.savedEvents?.length) return [];
    return mockGames.filter((g) => userProfile.savedEvents.includes(g.id));
  }, [userProfile?.savedEvents]);

  const grouped = useMemo(() => groupByDate(savedGames), [savedGames]);

  function removeEvent(gameId: string) {
    if (!userProfile) return;
    updateUserProfile({
      savedEvents: (userProfile.savedEvents || []).filter((id) => id !== gameId),
    });
  }

  if (loading || !user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="animate-shimmer h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <CalendarDays className="w-8 h-8 text-hotpink-500" />
        <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-charcoal">
          My Calendar
        </h1>
      </div>

      {savedGames.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <CalendarDays className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="font-semibold text-lg text-charcoal mb-2">No saved events yet</h3>
          <p className="text-slate-500 text-sm mb-6">
            Browse games and tap &ldquo;Add to Calendar&rdquo; to save events you&apos;re interested in.
          </p>
          <Link
            href="/search"
            className="inline-block bg-hotpink-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors"
          >
            Find Games
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {[...grouped.entries()].map(([dateLabel, games]) => (
            <div key={dateLabel}>
              <h2 className="font-semibold text-sm text-hotpink-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                {dateLabel}
              </h2>
              <div className="space-y-3">
                {games.map((game) => {
                  const tile = getCityTile(game.city);
                  const gameSlug = slugify(`${game.city}-${game.state}`) + "/" + slugify(game.name);
                  const schedule = formatSchedule(game);

                  return (
                    <div
                      key={game.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-4 hover:shadow-md transition-shadow"
                    >
                      {/* Tile or colored dot */}
                      <div className="shrink-0 mt-1">
                        {tile ? (
                          <img src={tile} alt="" className="w-10 h-10 object-contain" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-hotpink-50 flex items-center justify-center">
                            {getGameTypeIcon(game.type)}
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        {hasAccess ? (
                          <Link
                            href={`/games/${gameSlug}`}
                            className="font-semibold text-charcoal hover:text-hotpink-500 transition-colors text-base leading-tight block truncate"
                          >
                            {game.name}
                          </Link>
                        ) : (
                          <span className="font-semibold text-charcoal text-base leading-tight block truncate">
                            {game.name}
                          </span>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-hotpink-400" />
                            {schedule}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 text-sm text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-skyblue-500 shrink-0" />
                          <span>{game.city}, {game.state}</span>
                        </div>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => removeEvent(game.id)}
                        className="shrink-0 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove from calendar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
