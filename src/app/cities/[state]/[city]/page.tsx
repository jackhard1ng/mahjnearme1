import Link from "next/link";
import { mockGames, getCitiesWithGames } from "@/lib/mock-data";
import { slugify, getGameTypeLabel, getStateName } from "@/lib/utils";
import { SKILL_LEVEL_LABELS } from "@/lib/constants";
import { MapPin, Calendar, Users, ArrowRight, ChevronRight } from "lucide-react";
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
    (g) => slugify(g.city) === city && slugify(getStateName(g.state)) === state && g.status === "active"
  );

  return {
    title: `Mahjong Near Me in ${cityName}, ${stateName} — Find Games & Open Play`,
    description: `Find ${games.length} mahjong games, open play sessions, and lessons in ${cityName}, ${stateName}. Drop-in friendly groups, all skill levels. Updated weekly.`,
    openGraph: {
      title: `Mahjong Near Me in ${cityName}, ${stateName}`,
      description: `Find ${games.length} mahjong games and open play in ${cityName}. All skill levels welcome.`,
    },
  };
}

export default async function CityPage({ params }: Props) {
  const { state, city } = await params;
  const cityName = city.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const stateName = state.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const games = mockGames.filter(
    (g) => slugify(g.city) === city && slugify(getStateName(g.state)) === state && g.status === "active"
  );

  // Find nearby cities (same state, different city)
  const allCities = getCitiesWithGames();
  const nearbyCities = allCities.filter(
    (c) => slugify(c.city) !== city && slugify(getStateName(c.state)) === state
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/" className="hover:text-teal-600">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/cities" className="hover:text-teal-600">Cities</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/states/${state}`} className="hover:text-teal-600">{stateName}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-600">{cityName}</span>
      </nav>

      {/* Hero */}
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl sm:text-4xl text-slate-900 mb-3">
          Mahjong Games in {cityName}, {stateName}
        </h1>
        <p className="text-slate-500 text-lg">
          {games.length} mahjong {games.length === 1 ? "game" : "games"} found in {cityName}. Drop-in friendly groups, all skill levels.
        </p>
      </div>

      {/* Game Cards (teaser/SEO content) */}
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        {games.map((game) => (
          <div key={game.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                game.type === "open_play" ? "bg-teal-100 text-teal-800" :
                game.type === "lesson" ? "bg-orange-100 text-orange-800" :
                game.type === "league" ? "bg-yellow-100 text-yellow-800" :
                "bg-purple-100 text-purple-800"
              }`}>
                {getGameTypeLabel(game.type)}
              </span>
              {game.dropInFriendly && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  Drop-in Friendly
                </span>
              )}
            </div>

            <h3 className="font-semibold text-lg text-slate-800 mb-1">{game.name}</h3>
            <p className="text-sm text-slate-500 mb-3">{game.organizerName}</p>

            <div className="space-y-1.5 mb-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{game.generalArea}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{game.isRecurring && game.recurringSchedule ? `${game.recurringSchedule.dayOfWeek.charAt(0).toUpperCase() + game.recurringSchedule.dayOfWeek.slice(1)}s` : "See details"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users className="w-4 h-4 text-slate-400" />
                <span>{game.skillLevels.map((s) => SKILL_LEVEL_LABELS[s]).join(", ")}</span>
              </div>
            </div>

            <p className="text-sm text-slate-500 line-clamp-2 mb-4">{game.description}</p>

            <Link
              href={`/games/${slugify(game.city + "-" + game.state)}/${slugify(game.name)}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-700"
            >
              View Full Details <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>

      {/* Signup CTA */}
      <div className="bg-gradient-to-br from-teal-50 to-white rounded-xl border border-teal-200 p-8 text-center mb-10">
        <h2 className="font-semibold text-xl text-slate-800 mb-2">
          Want full details on every game?
        </h2>
        <p className="text-slate-500 mb-4 text-sm">
          Get exact addresses, contact info, schedules, and directions with a free trial.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-teal-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-teal-700 transition-colors"
        >
          Start Your 14-Day Free Trial
        </Link>
      </div>

      {/* City FAQ (for SEO) */}
      <div className="mb-10">
        <h2 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-slate-900 mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-800 mb-2">Where can I play mahjong in {cityName}?</h3>
            <p className="text-sm text-slate-600">
              There are {games.length} mahjong {games.length === 1 ? "group" : "groups"} in {cityName}, {stateName}, including open play sessions, lessons, and leagues.
              Sign up for free to see full details including exact locations and schedules.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-800 mb-2">Are there beginner-friendly mahjong groups in {cityName}?</h3>
            <p className="text-sm text-slate-600">
              {games.filter((g) => g.skillLevels.includes("beginner")).length > 0
                ? `Yes! ${games.filter((g) => g.skillLevels.includes("beginner")).length} ${games.filter((g) => g.skillLevels.includes("beginner")).length === 1 ? "group welcomes" : "groups welcome"} beginners in ${cityName}. Look for the "Beginner Friendly" badge on game listings.`
                : `We're still growing our listings in ${cityName}. Check back soon or request games for your area!`}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-800 mb-2">Can I drop in to a mahjong game in {cityName} without an RSVP?</h3>
            <p className="text-sm text-slate-600">
              {games.filter((g) => g.dropInFriendly).length > 0
                ? `Yes, ${games.filter((g) => g.dropInFriendly).length} ${games.filter((g) => g.dropInFriendly).length === 1 ? "group is" : "groups are"} drop-in friendly in ${cityName}. No RSVP required — just show up and play!`
                : `Some groups may require RSVP. Check individual listings for details.`}
            </p>
          </div>
        </div>
      </div>

      {/* Nearby Cities */}
      {nearbyCities.length > 0 && (
        <div>
          <h2 className="font-semibold text-xl text-slate-800 mb-4">
            Also Check Nearby Cities
          </h2>
          <div className="flex flex-wrap gap-3">
            {nearbyCities.map((c) => (
              <Link
                key={`${c.city}-${c.state}`}
                href={`/cities/${slugify(getStateName(c.state))}/${slugify(c.city)}`}
                className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2 hover:border-teal-300 transition-all text-sm"
              >
                <MapPin className="w-4 h-4 text-teal-500" />
                {c.city}, {c.state}
                <span className="text-teal-600 font-semibold">{c.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
