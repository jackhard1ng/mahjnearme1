import Link from "next/link";
import { getCitiesWithGames, getStatesWithGames, mockGames } from "@/lib/mock-data";
import { getStateName, slugify, getGameTypeLabel, getGameTypeColor, isEventExpired } from "@/lib/utils";
import { getCityTile } from "@/lib/city-tiles";
import { getMetrosWithGames, getMetroCitiesSubtitle } from "@/lib/metro-regions";
import { MapPin, ArrowRight, Users, GraduationCap, Trophy, CalendarDays } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Mahjong Games by City",
  description:
    "Find mahjong games, open play sessions, and events in cities across the United States. Browse by state and city to find games near you.",
};

function getGameTypeIcon(type: string) {
  switch (type) {
    case "open_play": return <Users className="w-4 h-4" />;
    case "lesson": return <GraduationCap className="w-4 h-4" />;
    case "league": return <Trophy className="w-4 h-4" />;
    case "event": return <CalendarDays className="w-4 h-4" />;
    default: return <Users className="w-4 h-4" />;
  }
}

export default function CitiesIndexPage() {
  const states = getStatesWithGames();
  const cities = getCitiesWithGames();
  const activeGames = mockGames.filter((g) => g.status === "active" && !isEventExpired(g));

  // Stats for the hero
  const totalGames = activeGames.length;
  const totalCities = cities.length;
  const totalStates = states.length;

  // Game type breakdown
  const typeCounts = activeGames.reduce((acc, g) => {
    acc[g.type] = (acc[g.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Featured cities (top 4 by game count)
  const featuredCities = [...cities].sort((a, b) => b.count - a.count).slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/40a8a8ed77d5469f174ff66a88f95aa5.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF1493]/85 via-[#FF69B4]/75 to-[#87CEEB]/80" />
        </div>
        <div className="max-w-5xl mx-auto px-4 pt-14 pb-10 sm:pt-20 sm:pb-14 text-center relative">
          <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-4xl sm:text-5xl text-white mb-3 tracking-tight drop-shadow-lg">
            Explore Mahjong Cities
          </h1>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            {totalGames} games across {totalCities} cities in {totalStates} states, and growing every week
          </p>

          {/* Quick stats */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {Object.entries(typeCounts).map(([type, count]) => (
              <div key={type} className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-white/90 ${getGameTypeColor(type)}`}>
                  {getGameTypeIcon(type)} {getGameTypeLabel(type)}
                </span>
                <span className="text-white font-bold text-sm">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Featured Cities */}
        {featuredCities.length > 0 && (
          <div className="mb-12">
            <div className="mahj-divider mb-8">
              <span className="text-xl">🀄</span>
            </div>
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-6 text-center">
              Popular Cities
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredCities.map((c) => {
                const cityGames = activeGames.filter(
                  (g) => g.city === c.city && g.state === c.state
                );
                const typeSet = new Set(cityGames.map((g) => g.type));
                const tile = getCityTile(c.city);
                return (
                  <Link
                    key={`${c.city}-${c.state}`}
                    href={`/cities/${slugify(getStateName(c.state))}/${slugify(c.city)}`}
                    className="mahj-tile p-5 hover:shadow-xl transition-shadow group relative overflow-hidden"
                  >
                    {/* Background tile watermark */}
                    {tile && (
                      <div className="absolute -right-2 -top-2 opacity-10 pointer-events-none">
                        <img src={tile} alt="" className="h-28 w-auto" />
                      </div>
                    )}
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-3">
                        {tile ? (
                          <img src={tile} alt={`${c.city} tile`} className="h-12 w-auto drop-shadow-md" />
                        ) : (
                          <div className="w-10 h-10 bg-hotpink-500 rounded-xl flex items-center justify-center shadow-md">
                            <MapPin className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-charcoal group-hover:text-hotpink-500 transition-colors">
                            {c.city}
                          </h3>
                          <p className="text-xs text-slate-500">{getStateName(c.state)}</p>
                        </div>
                      </div>
                      <p className="text-2xl font-extrabold text-hotpink-500 mb-1">
                        {c.count} <span className="text-sm font-medium text-slate-500">{c.count === 1 ? "game" : "games"}</span>
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Array.from(typeSet).map((type) => (
                          <span key={type} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getGameTypeColor(type)}`}>
                            {getGameTypeLabel(type)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Browse by State */}
        <div className="mb-12">
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-6">
            Browse by State
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {states.map((s) => (
              <Link
                key={s.state}
                href={`/states/${slugify(s.stateName)}`}
                className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 hover:border-hotpink-300 hover:shadow-sm transition-all group"
              >
                <div>
                  <h3 className="font-semibold text-charcoal group-hover:text-hotpink-500 transition-colors">{s.stateName}</h3>
                  <p className="text-sm text-slate-500">
                    {s.cityCount} {s.cityCount === 1 ? "city" : "cities"} &middot; {s.gameCount} {s.gameCount === 1 ? "game" : "games"}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-hotpink-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>
        </div>

        {/* Browse by Metro Region */}
        {(() => {
          const metros = getMetrosWithGames(cities);
          return metros.length > 0 ? (
            <div className="mb-12">
              <h2 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-6">
                Browse by Metro Region
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {metros.slice(0, 12).map((m) => {
                  // Link to the first (largest) city in this metro
                  const primaryCity = m.activeCities[0];
                  const cityData = cities.find((c) => c.city === primaryCity);
                  const stateSlug = cityData ? slugify(getStateName(cityData.state)) : slugify(getStateName(m.metro.state));
                  const citySlug = slugify(primaryCity);
                  return (
                    <Link
                      key={m.metro.abbreviation}
                      href={`/cities/${stateSlug}/${citySlug}`}
                      className="bg-white border border-slate-200 rounded-xl p-5 hover:border-hotpink-300 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-charcoal group-hover:text-hotpink-500 transition-colors">
                          {m.metro.metro}
                        </h3>
                        <span className="bg-hotpink-50 text-hotpink-600 font-bold px-2.5 py-0.5 rounded-full text-xs">
                          {m.totalGames} {m.totalGames === 1 ? "game" : "games"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {getMetroCitiesSubtitle(m.metro)}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null;
        })()}

        {/* All Cities */}
        <div className="mb-12">
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-6">
            All Cities
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {cities.map((c) => {
              const tile = getCityTile(c.city);
              return (
                <Link
                  key={`${c.city}-${c.state}`}
                  href={`/cities/${slugify(getStateName(c.state))}/${slugify(c.city)}`}
                  className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3 hover:border-hotpink-300 transition-all text-sm group"
                >
                  <div className="flex items-center gap-2">
                    {tile ? (
                      <img src={tile} alt="" className="h-6 w-auto" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5 text-hotpink-400" />
                    )}
                    <span className="font-medium text-slate-700 group-hover:text-hotpink-500 transition-colors">{c.city}, {c.state}</span>
                  </div>
                  <span className="bg-hotpink-50 text-hotpink-600 font-bold px-2 py-0.5 rounded-full text-xs">{c.count}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Don't see your city CTA */}
        <div className="bg-gradient-to-br from-hotpink-50 to-skyblue-50 rounded-xl border border-hotpink-200 p-8 text-center">
          <div className="text-3xl mb-3">🀇</div>
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-2">
            Don&apos;t see your city?
          </h2>
          <p className="text-slate-500 mb-6 text-sm max-w-md mx-auto">
            We&apos;re adding new cities every week. Let us know where you play and we&apos;ll get your area listed.
          </p>
          <Link
            href="/add-your-group"
            className="inline-flex items-center gap-2 bg-hotpink-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors"
          >
            List Your Group <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
