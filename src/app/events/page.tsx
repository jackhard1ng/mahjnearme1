"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";
import { Game } from "@/types";
import { useFirestoreListings } from "@/hooks/useFirestoreListings";
import { useEnrichedGames } from "@/hooks/useOrganizerOverrides";
import { isEventExpired, slugify, formatTime, getStateName, getGameTypeColor, getGameTypeLabel } from "@/lib/utils";
import { MapPin, Lock, ArrowRight, Search, Plane, Star } from "lucide-react";

const DestinationMap = dynamic(() => import("@/components/DestinationMap"), {
  ssr: false,
  loading: () => (
    <div className="bg-skyblue-100 rounded-xl border-2 border-softpink-300 h-full flex items-center justify-center">
      <p className="text-slate-400 text-sm">Loading map...</p>
    </div>
  ),
});

// Word-boundary keyword patterns for destination events
const DESTINATION_PATTERNS = [
  /\bcruise\b/i,
  /\bretreat\b/i,
  /\bgetaway\b/i,
  /\bresort\b/i,
  /\bdestination\b/i,
  /\bmulti[- ]day\b/i,
  /\bweekend event\b/i,
  /\bstaycation\b/i,
];

// "camp" needs special handling — match "camp" but not "campbell", "campus", "campaign"
const CAMP_PATTERN = /\bcamp\b(?!bell|us|aign)/i;

function isDestinationEvent(game: { type: string; name: string; description?: string; isDestinationEvent?: boolean }): boolean {
  // Organizer-flagged destination events
  if (game.isDestinationEvent) return true;
  // Only events qualify via keyword matching
  if (game.type !== "event") return false;
  const text = game.name + " " + (game.description || "");
  if (DESTINATION_PATTERNS.some((p) => p.test(text))) return true;
  if (CAMP_PATTERN.test(text)) return true;
  return false;
}

export default function EventsPage() {
  const { hasAccess } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "retreats" | "tournaments" | "cruises" | "camps">("all");

  const baseGames = useFirestoreListings();
  const enrichedGames = useEnrichedGames(baseGames);

  const events = useMemo(() => {
    return enrichedGames
      .filter((g) => {
        if (g.status !== "active" || isEventExpired(g)) return false;
        return isDestinationEvent(g);
      })
      .sort((a, b) => {
        // 1. Featured (paid subscriber organizer) first
        if (a.promoted !== b.promoted) return a.promoted ? -1 : 1;
        // 2. Organizer-submitted/edited events next (verified organizer accounts)
        const aOrg = a.organizerEdited ? 1 : 0;
        const bOrg = b.organizerEdited ? 1 : 0;
        if (aOrg !== bOrg) return bOrg - aOrg;
        // 3. Then by date ascending
        if (a.eventDate && b.eventDate) return a.eventDate.localeCompare(b.eventDate);
        if (a.eventDate) return -1;
        if (b.eventDate) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [enrichedGames]);

  const filtered = useMemo(() => {
    let result = events;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.city.toLowerCase().includes(q) ||
          g.state.toLowerCase().includes(q) ||
          (g.description || "").toLowerCase().includes(q)
      );
    }

    if (filter === "retreats") {
      result = result.filter((g) => {
        const text = (g.name + " " + (g.description || "")).toLowerCase();
        return text.includes("retreat") || text.includes("getaway") || text.includes("staycation");
      });
    } else if (filter === "tournaments") {
      result = result.filter((g) => {
        const text = (g.name + " " + (g.description || "")).toLowerCase();
        return text.includes("tournament") || text.includes("championship") || text.includes("classic") || text.includes("derby") || text.includes("mania");
      });
    } else if (filter === "cruises") {
      result = result.filter((g) => {
        const text = (g.name + " " + (g.description || "")).toLowerCase();
        return text.includes("cruise") || text.includes("trip");
      });
    } else if (filter === "camps") {
      result = result.filter((g) => {
        const text = (g.name + " " + (g.description || "")).toLowerCase();
        return text.includes("camp") || text.includes("boot camp") || text.includes("bootcamp") || text.includes("resort");
      });
    }

    return result;
  }, [events, search, filter]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/c2d2c03301c201e23fd4816059b397c4.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF1493]/85 via-[#FF69B4]/75 to-[#87CEEB]/80" />
        </div>
        <div className="max-w-5xl mx-auto px-4 pt-14 pb-10 sm:pt-20 sm:pb-14 text-center relative">
          <Plane className="w-10 h-10 text-skyblue-200 mx-auto mb-4" />
          <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-3xl sm:text-5xl text-white mb-3 tracking-tight drop-shadow-lg">
            Destination Events
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Plan your next mahj trip around the tiles. Retreats, cruises, tournaments, and camps across the country.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search events, cities, states..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "all" as const, label: "All" },
              { key: "retreats" as const, label: "Retreats" },
              { key: "tournaments" as const, label: "Tournaments" },
              { key: "cruises" as const, label: "Cruises" },
              { key: "camps" as const, label: "Camps & Resorts" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f.key
                    ? "bg-hotpink-500 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-hotpink-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          {filtered.length} destination events found.
          {" "}Looking for local tournaments? <Link href="/search?type=tournament" className="text-hotpink-500 font-medium hover:underline">Browse all 70+ tournaments</Link>
        </p>

        {/* Map — visible to everyone, locked pins for free users */}
        {filtered.length > 0 && (
          <>
            <div className="mb-4 rounded-xl border border-slate-200 overflow-hidden" style={{ height: "500px" }}>
              <DestinationMap games={filtered} hasAccess={hasAccess} />
            </div>
            {!hasAccess && (
              <div className="mb-6 bg-gradient-to-r from-hotpink-50 to-skyblue-50 border border-hotpink-200 rounded-xl p-6 text-center">
                <p className="font-semibold text-charcoal mb-1">
                  {filtered.length} destination events across the country
                </p>
                <p className="text-sm text-slate-500 mb-3">Subscribe to see event details, dates, and locations.</p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 bg-hotpink-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors text-sm"
                >
                  View Plans <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </>
        )}

        {/* Event cards - Featured visible to everyone, rest to subscribers */}
        {(() => {
          const featuredEvents = filtered.filter((g) => g.promoted);
          const otherEvents = filtered.filter((g) => !g.promoted);

          return (
            <>
              {/* Featured events - visible to everyone */}
              {featuredEvents.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  {featuredEvents.map((g) => (
                    <EventCard key={g.id} game={g} hasAccess={true} />
                  ))}
                </div>
              )}

              {/* Rest of events */}
              {hasAccess ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {otherEvents.map((g) => (
                    <EventCard key={g.id} game={g} hasAccess={true} />
                  ))}
                </div>
              ) : otherEvents.length > 0 ? (
                <div className="relative">
                  <div className="grid sm:grid-cols-2 gap-4 opacity-30 blur-[3px] pointer-events-none select-none" aria-hidden="true">
                    {otherEvents.slice(0, 4).map((g) => (
                      <EventCard key={g.id} game={g} hasAccess={false} />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 text-center max-w-sm mx-4">
                      <Lock className="w-8 h-8 text-hotpink-400 mx-auto mb-3" />
                      <h3 className="font-bold text-slate-800 mb-1">{otherEvents.length}+ more destination events</h3>
                      <p className="text-sm text-slate-500 mb-4">Subscribe to see all events with full details and registration links</p>
                      <Link href="/pricing" className="inline-flex items-center gap-2 bg-hotpink-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-hotpink-600 transition text-sm">
                        View Plans <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          );
        })()}
      </div>
    </>
  );
}

function EventCard({ game: g, hasAccess }: { game: Game; hasAccess: boolean }) {
              const eventDate = g.eventDate ? new Date(g.eventDate + "T00:00:00") : null;

              return (
                <div className={`bg-white border rounded-xl overflow-hidden hover:shadow-md transition-all ${g.promoted ? "border-amber-300" : "border-slate-200"}`}>
                  {g.promoted && (
                    <div className="bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-0.5 text-white text-xs font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white" /> Featured Event
                    </div>
                  )}
                  {!g.promoted && g.organizerEdited && (
                    <div className="bg-gradient-to-r from-violet-500 to-violet-600 px-3 py-0.5 text-white text-xs font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white" /> Verified Organizer
                    </div>
                  )}
                  <div className="p-5">
                    {/* Date + Type */}
                    <div className="flex items-start justify-between mb-3">
                      {eventDate ? (
                        <div className="shrink-0 w-14 text-center mr-4">
                          <div className="bg-hotpink-500 text-white text-[10px] font-bold uppercase rounded-t-lg py-0.5">
                            {eventDate.toLocaleDateString("en-US", { month: "short" })}
                          </div>
                          <div className="border border-t-0 border-slate-200 rounded-b-lg py-1">
                            <p className="text-xl font-bold text-charcoal leading-none">{eventDate.getDate()}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="shrink-0 w-14 text-center mr-4">
                          <div className="bg-skyblue-400 text-white text-[10px] font-bold uppercase rounded-t-lg py-0.5">
                            TBD
                          </div>
                          <div className="border border-t-0 border-slate-200 rounded-b-lg py-1">
                            <p className="text-sm font-bold text-slate-400 leading-none">2026</p>
                          </div>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getGameTypeColor(g.type)}`}>
                            {getGameTypeLabel(g.type)}
                          </span>
                        </div>

                        <Link href={`/games/${slugify(g.city + "-" + g.state)}/${slugify(g.name)}`} className="hover:text-hotpink-500 transition-colors">
                          <h3 className="font-semibold text-charcoal text-sm line-clamp-2">{g.name}</h3>
                        </Link>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{g.city}, {g.state}</span>
                          {g.eventStartTime && (
                            <span className="ml-1">&middot; {formatTime(g.eventStartTime)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {g.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-2">{g.description}</p>
                    )}

                    {g.cost && g.cost !== "Contact for price" && (
                      <p className="text-xs font-medium text-charcoal mt-2">{g.cost}</p>
                    )}
                  </div>
                </div>
              );
}
