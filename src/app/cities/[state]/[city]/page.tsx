import Link from "next/link";
import { mockGames, getCitiesWithGames } from "@/lib/mock-data";
import { slugify, getStateName, isEventExpired } from "@/lib/utils";
import { getCityTile } from "@/lib/city-tiles";
import { findMetroForCity, getMetroCitiesSubtitle } from "@/lib/metro-regions";
import { MapPin, ChevronRight, MessageSquare, Info } from "lucide-react";
import CityMap from "@/components/CityMap";
import CityGamesList from "@/components/CityGamesList";
import CityContributor from "@/components/CityContributor";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ state: string; city: string }>;
}

export async function generateStaticParams() {
  const cities = getCitiesWithGames();
  return cities.map((c) => ({
    state: slugify(getStateName(c.state)),
    city: slugify(c.city),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, city } = await params;
  const cityName = city.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const stateName = state.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const games = mockGames.filter(
    (g) => slugify(g.city) === city && slugify(getStateName(g.state)) === state && g.status === "active" && !isEventExpired(g)
  );

  return {
    title: `Mahjong Games in ${cityName}, ${stateName} | MahjNearMe`,
    description: `Find ${games.length} mahjong games, open play sessions, lessons, and events in ${cityName}, ${stateName}. Drop-in friendly groups for all skill levels. Browse schedules, venues, and contact info. Updated weekly.`,
    keywords: [
      `mahjong ${cityName}`,
      `mahjong near me ${cityName}`,
      `mah jongg ${cityName}`,
      `mahjongg ${cityName} ${stateName}`,
      `mahjong games ${cityName}`,
      `mahjong open play ${cityName}`,
    ],
    openGraph: {
      title: `Mahjong Games in ${cityName}, ${stateName}`,
      description: `Find ${games.length} mahjong games and open play in ${cityName}. All skill levels welcome.`,
    },
  };
}

export default async function CityPage({ params }: Props) {
  const { state, city } = await params;
  const cityName = city.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const stateName = state.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  // Resolve metro region
  const metro = findMetroForCity(cityName);

  // Get games for this city. If part of a metro, also include games from other metro cities.
  const cityGames = mockGames.filter(
    (g) => slugify(g.city) === city && slugify(getStateName(g.state)) === state && g.status === "active" && !isEventExpired(g)
  );

  // If metro exists, also get games from other cities in the metro
  const metroCitySlugs = metro
    ? metro.cities.map((c) => slugify(c))
    : [];
  const metroGames = metro
    ? mockGames.filter(
        (g) =>
          metroCitySlugs.includes(slugify(g.city)) &&
          slugify(g.city) !== city &&
          g.status === "active" &&
          !isEventExpired(g)
      )
    : [];

  // Show city-specific games first, then other metro games
  const games = [...cityGames, ...metroGames];

  // Find nearby cities (same state, different city, not in same metro)
  const allCities = getCitiesWithGames();
  const nearbyCities = allCities.filter(
    (c) =>
      slugify(c.city) !== city &&
      slugify(getStateName(c.state)) === state &&
      (!metro || !metro.cities.some((mc) => slugify(mc) === slugify(c.city)))
  );

  // Cities within the same metro (for display)
  const metroCities = metro
    ? allCities.filter(
        (c) =>
          slugify(c.city) !== city &&
          metro.cities.some((mc) => slugify(mc) === slugify(c.city))
      )
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/" className="hover:text-hotpink-500">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/cities" className="hover:text-hotpink-500">Cities</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/states/${state}`} className="hover:text-hotpink-500">{stateName}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-600">{cityName}</span>
      </nav>

      {/* Hero */}
      {(() => {
        const cityTile = getCityTile(cityName);
        return (
          <div className="mb-4">
            <div className="flex items-center gap-4">
              {cityTile && (
                <img src={cityTile} alt={`${cityName} mahjong tile`} className="h-20 sm:h-24 w-auto drop-shadow-lg" />
              )}
              <div>
                <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl sm:text-4xl text-charcoal mb-3">
                  Mahjong Games in {cityName}, {stateName}
                </h1>
                <p className="text-slate-500 text-lg">
                  {games.length} mahjong {games.length === 1 ? "game" : "games"} found{metro ? ` in the ${metro.metro} area` : ` in ${cityName}`}. Drop-in friendly groups, all skill levels.
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Metro Context Note */}
      {metro && metro.cities[0] !== cityName && (
        <div className="flex items-start gap-3 mb-6 bg-skyblue-50 border border-skyblue-200 rounded-lg px-4 py-3">
          <Info className="w-4 h-4 text-skyblue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-skyblue-700">
            {cityName} is part of the <strong>{metro.metro}</strong> area.
            Showing all {games.length} games within the region including{" "}
            {getMetroCitiesSubtitle(metro)}.
          </p>
        </div>
      )}

      {/* Contributor Attribution */}
      <CityContributor cityName={cityName} />

      {/* City Map */}
      <CityMap games={games} />

      {/* Game Cards: auth-aware, subscribers see all, free users see preview + paywall */}
      <CityGamesList games={games} cityName={cityName} metroAbbreviation={metro?.abbreviation || null} />

      {/* City FAQ (for SEO) */}
      <div className="mb-10">
        <h2 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-charcoal mb-2">Where can I play mahjong in {cityName}?</h3>
            <p className="text-sm text-slate-600">
              There are {games.length} mahjong {games.length === 1 ? "group" : "groups"} in {cityName}, {stateName}, including open play sessions, lessons, and leagues.
              Sign up for free to see full details including exact locations and schedules.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-charcoal mb-2">Are there beginner-friendly mahjong groups in {cityName}?</h3>
            <p className="text-sm text-slate-600">
              {games.filter((g) => g.skillLevels.includes("beginner")).length > 0
                ? `Yes! ${games.filter((g) => g.skillLevels.includes("beginner")).length} ${games.filter((g) => g.skillLevels.includes("beginner")).length === 1 ? "group welcomes" : "groups welcome"} beginners in ${cityName}. Look for the "Beginner Friendly" badge on game listings.`
                : `We're still growing our listings in ${cityName}. Check back soon or request games for your area!`}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-charcoal mb-2">Can I drop in to a mahjong game in {cityName} without an RSVP?</h3>
            <p className="text-sm text-slate-600">
              {games.filter((g) => g.dropInFriendly).length > 0
                ? `Yes, ${games.filter((g) => g.dropInFriendly).length} ${games.filter((g) => g.dropInFriendly).length === 1 ? "group is" : "groups are"} drop-in friendly in ${cityName}. No RSVP required, just show up and play!`
                : `Some groups may require RSVP. Check individual listings for details.`}
            </p>
          </div>
        </div>
      </div>

      {/* Community Forum Link */}
      <div className="mb-10 bg-softpink-100 border border-hotpink-200 rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-hotpink-500" />
          <div>
            <p className="font-semibold text-charcoal text-sm">Join the conversation</p>
            <p className="text-xs text-slate-500">
              Discuss games, verify listings, and connect with players in {cityName}.
            </p>
          </div>
        </div>
        <Link
          href={`/community`}
          className="text-hotpink-500 font-semibold text-sm hover:text-hotpink-600 whitespace-nowrap"
        >
          Visit Forum
        </Link>
      </div>

      {/* Metro Region Cities */}
      {metroCities.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-xl text-charcoal mb-4">
            More in the {metro!.metro} Area
          </h2>
          <div className="flex flex-wrap gap-3">
            {metroCities.map((c) => (
              <Link
                key={`${c.city}-${c.state}`}
                href={`/cities/${slugify(getStateName(c.state))}/${slugify(c.city)}`}
                className="inline-flex items-center gap-2 bg-skyblue-50 border border-skyblue-200 rounded-lg px-4 py-2 hover:border-hotpink-300 transition-all text-sm"
              >
                <MapPin className="w-4 h-4 text-skyblue-500" />
                {c.city}, {c.state}
                <span className="text-skyblue-500 font-semibold">{c.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Nearby Cities (outside metro) */}
      {nearbyCities.length > 0 && (
        <div>
          <h2 className="font-semibold text-xl text-charcoal mb-4">
            Also Check Nearby Cities
          </h2>
          <div className="flex flex-wrap gap-3">
            {nearbyCities.map((c) => (
              <Link
                key={`${c.city}-${c.state}`}
                href={`/cities/${slugify(getStateName(c.state))}/${slugify(c.city)}`}
                className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2 hover:border-hotpink-300 transition-all text-sm"
              >
                <MapPin className="w-4 h-4 text-hotpink-500" />
                {c.city}, {c.state}
                <span className="text-hotpink-500 font-semibold">{c.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
