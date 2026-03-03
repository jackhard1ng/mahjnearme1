import Link from "next/link";
import { getCitiesWithGames, getStatesWithGames } from "@/lib/mock-data";
import { getStateName, slugify } from "@/lib/utils";
import { MapPin } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Mahjong Games by City",
  description:
    "Find mahjong games, open play sessions, and events in cities across the United States. Browse by state and city to find games near you.",
};

export default function CitiesIndexPage() {
  const states = getStatesWithGames();
  const cities = getCitiesWithGames();

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl sm:text-4xl text-charcoal mb-3">
        Browse Mahjong Games by City
      </h1>
      <p className="text-slate-500 mb-10 max-w-2xl">
        Find mahjong open play, lessons, leagues, and events in cities across the United States.
      </p>

      {/* States Grid */}
      <h2 className="font-semibold text-xl text-charcoal mb-4">Browse by State</h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
        {states.map((s) => (
          <Link
            key={s.state}
            href={`/states/${slugify(s.stateName)}`}
            className="flex items-center justify-between bg-lavender-100 border border-lavender-200 rounded-xl p-4 hover:border-hotpink-300 hover:shadow-sm transition-all"
          >
            <div>
              <h3 className="font-semibold text-charcoal">{s.stateName}</h3>
              <p className="text-sm text-slate-500">
                {s.cityCount} {s.cityCount === 1 ? "city" : "cities"} &middot; {s.gameCount} {s.gameCount === 1 ? "game" : "games"}
              </p>
            </div>
            <MapPin className="w-5 h-5 text-hotpink-500" />
          </Link>
        ))}
      </div>

      {/* Cities List */}
      <h2 className="font-semibold text-xl text-charcoal mb-4">All Cities with Games</h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {cities.map((c) => (
          <Link
            key={`${c.city}-${c.state}`}
            href={`/cities/${slugify(getStateName(c.state))}/${slugify(c.city)}`}
            className="flex items-center justify-between bg-lavender-100 border border-lavender-200 rounded-lg px-4 py-3 hover:border-hotpink-300 transition-all text-sm"
          >
            <span className="font-medium text-slate-700">{c.city}, {c.state}</span>
            <span className="text-hotpink-500 font-semibold">{c.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
