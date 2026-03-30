"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { mockGames } from "@/lib/mock-data";
import { isEventExpired, slugify, formatTime, getStateName, getGameTypeColor, getGameTypeLabel } from "@/lib/utils";
import { CalendarDays, MapPin, Lock, ArrowRight, Search, Plane } from "lucide-react";

// Keywords that indicate a multi-day / destination event (not a local one-day tournament)
const DESTINATION_KEYWORDS = ["cruise", "retreat", "getaway", "camp", "destination", "spa", "resort", "multi-day", "weekend event", "staycation", "trip"];
// These only count as destination events when paired with a destination keyword
const CONDITIONAL_KEYWORDS = ["tournament", "championship", "classic", "derby"];

function isDestinationEvent(name: string, description: string): boolean {
  const text = (name + " " + description).toLowerCase();
  // Direct match on destination keywords
  if (DESTINATION_KEYWORDS.some((k) => text.includes(k))) return true;
  // "Destination" tournaments (e.g. "Destination Mah Jongg - San Diego Tournament")
  if (text.includes("destination") && CONDITIONAL_KEYWORDS.some((k) => text.includes(k))) return true;
  return false;
}

export default function EventsPage() {
  const { hasAccess } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "upcoming" | "retreats" | "tournaments" | "cruises" | "camps">("all");

  const events = useMemo(() => {
    return mockGames
      .filter((g) => {
        if (g.status !== "active" || isEventExpired(g)) return false;
        return isDestinationEvent(g.name, g.description || "");
      })
      .sort((a, b) => {
        // Events with dates sort by date, others go to end
        if (a.eventDate && b.eventDate) return a.eventDate.localeCompare(b.eventDate);
        if (a.eventDate) return -1;
        if (b.eventDate) return 1;
        return a.name.localeCompare(b.name);
      });
  }, []);

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

    if (filter === "upcoming") {
      result = result.filter((g) => g.eventDate);
    } else if (filter === "retreats") {
      result = result.filter((g) => {
        const text = (g.name + " " + (g.description || "")).toLowerCase();
        return text.includes("retreat") || text.includes("getaway") || text.includes("spa") || text.includes("staycation");
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
            Retreats, cruises, camps, and destination mahjong experiences worth traveling for
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
              { key: "upcoming" as const, label: "Has Date" },
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

        <p className="text-sm text-slate-500 mb-4">{filtered.length} destination events found</p>

        {/* Subscribers-only content */}
        {hasAccess ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map((g) => {
              const eventDate = g.eventDate ? new Date(g.eventDate + "T00:00:00") : null;

              return (
                <div key={g.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-all">
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
            })}
          </div>
        ) : (
          /* Full paywall for non-subscribers */
          <div className="bg-gradient-to-br from-hotpink-50 via-white to-skyblue-50 border border-hotpink-200 rounded-xl p-10 text-center">
            <Lock className="w-12 h-12 text-hotpink-400 mx-auto mb-4" />
            <h2 className="font-semibold text-2xl text-charcoal mb-2">
              {filtered.length} Destination Events
            </h2>
            <p className="text-slate-500 mb-2 max-w-md mx-auto">
              Retreats, cruises, camps, and destination mahjong experiences are exclusive to subscribers.
            </p>
            <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
              Subscribe to browse all destination events with full details, dates, venues, and registration links.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-hotpink-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors"
            >
              View Plans <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
