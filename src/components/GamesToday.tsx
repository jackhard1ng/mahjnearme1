"use client";

import { useState } from "react";
import Link from "next/link";
import { mockGames } from "@/lib/mock-data";
import { isEventExpired } from "@/lib/utils";
import { haversineDistance, formatDistance } from "@/lib/distance";
import { getEventTiming, computePriorityScore } from "@/lib/event-timing";
import { MapPin, Clock, ArrowRight, Navigation, Loader2 } from "lucide-react";

type GameResult = {
  name: string; city: string; state: string; distance: string;
  timing: string; badge: string | null; badgeColor: string; type: string; searchUrl: string;
};

export default function GamesToday() {
  const [games, setGames] = useState<GameResult[]>([]);
  const [locationName, setLocationName] = useState("");
  const [locating, setLocating] = useState(false);
  const [denied, setDenied] = useState(false);
  const [located, setLocated] = useState(false);

  const findNearMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    setDenied(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            { headers: { "User-Agent": "MahjNearMe/1.0" } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            setLocationName(addr.city || addr.town || addr.village || addr.county || "your area");
          }
        } catch {
          setLocationName("your area");
        }

        const now = new Date();
        const active = mockGames.filter((g) => g.status === "active" && !isEventExpired(g));

        const ranked = active
          .map((g) => {
            const dist = g.geopoint.lat !== 0
              ? haversineDistance(latitude, longitude, g.geopoint.lat, g.geopoint.lng)
              : null;
            const timing = getEventTiming(g, now);
            const score = computePriorityScore(timing, dist);
            return { game: g, dist, timing, score };
          })
          .filter((r) => r.dist !== null && r.dist <= 50 && r.timing.tier <= 4)
          .sort((a, b) => a.score - b.score)
          .slice(0, 5);

        setGames(
          ranked.map((r) => ({
            name: r.game.name,
            city: r.game.city,
            state: r.game.state,
            distance: formatDistance(r.dist!),
            timing: r.timing.label,
            badge: r.timing.badge,
            badgeColor: r.timing.badgeColor,
            type: r.game.type,
            searchUrl: `/search?q=${encodeURIComponent(r.game.city + ", " + r.game.state)}`,
          }))
        );
        setLocated(true);
        setLocating(false);
      },
      () => {
        setDenied(true);
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  };

  // Before location requested — show the prompt button
  if (!located) {
    return (
      <section className="py-8 section-blue">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <button
            onClick={findNearMe}
            disabled={locating}
            className="inline-flex items-center gap-2 bg-hotpink-500 hover:bg-hotpink-600 text-white px-6 py-3 rounded-xl font-semibold text-sm transition disabled:opacity-60 shadow-sm"
          >
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            {locating ? "Finding games near you..." : "Find games near me"}
          </button>
          {denied && (
            <p className="text-xs text-slate-500 mt-2">Location access was denied. <Link href="/search" className="text-hotpink-500 underline">Search manually</Link></p>
          )}
        </div>
      </section>
    );
  }

  // No results found nearby
  if (games.length === 0) {
    return (
      <section className="py-8 section-blue">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-slate-600 text-sm mb-3">No games found within 50 miles of {locationName} this week.</p>
          <Link href="/search" className="text-hotpink-500 font-medium text-sm hover:underline flex items-center justify-center gap-1">
            Search a different location <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 section-blue">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-4">
          <Navigation className="w-4 h-4 text-hotpink-500" />
          <h2 className="font-semibold text-lg text-charcoal">
            Games this week near {locationName}
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {games.map((g, i) => (
            <Link
              key={i}
              href={g.searchUrl}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:border-hotpink-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm text-charcoal group-hover:text-hotpink-500 transition-colors line-clamp-2 flex-1 mr-2">
                  {g.name}
                </h3>
                {g.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${g.badgeColor}`}>
                    {g.badge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {g.distance}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {g.timing}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-4 text-center">
          <Link href={`/search?q=${encodeURIComponent(locationName)}`} className="text-sm font-medium text-hotpink-500 hover:text-hotpink-600 flex items-center justify-center gap-1">
            See all games near {locationName} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
