"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { mockGames } from "@/lib/mock-data";
import { isEventExpired } from "@/lib/utils";
import { haversineDistance, formatDistance } from "@/lib/distance";
import { getEventTiming, computePriorityScore } from "@/lib/event-timing";
import { MapPin, Clock, ArrowRight, Navigation } from "lucide-react";

export default function GamesToday() {
  const [games, setGames] = useState<
    { name: string; city: string; state: string; distance: string; timing: string; badge: string | null; badgeColor: string; type: string; searchUrl: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState("");

  useEffect(() => {
    // Only try geolocation if the browser supports it
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Reverse geocode for display name
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

        // Find nearby games happening soon
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
          .filter((r) => r.dist !== null && r.dist <= 50 && r.timing.tier <= 4) // within 50mi, this week
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
        setLoading(false);
      },
      () => {
        // Permission denied or error — silently hide the section
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  }, []);

  // Don't render anything if no results or still loading
  if (loading || games.length === 0) return null;

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
              {g.badge && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold mb-2 ${g.badgeColor}`}>
                  {g.badge === "Happening Now" && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                  {g.badge}
                </span>
              )}
              <h3 className="font-semibold text-charcoal text-sm group-hover:text-hotpink-500 transition-colors mb-1 line-clamp-1">
                {g.name}
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-hotpink-400" />
                  {g.timing}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-skyblue-500" />
                  {g.distance}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-4">
          <Link href="/search" className="inline-flex items-center gap-1 text-sm font-semibold text-hotpink-500 hover:text-hotpink-600">
            See all games near you <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
