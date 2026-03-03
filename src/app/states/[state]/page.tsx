import Link from "next/link";
import { mockGames, getStatesWithGames, getCitiesWithGames } from "@/lib/mock-data";
import { slugify, getStateName, getGameTypeLabel } from "@/lib/utils";
import { MapPin, ChevronRight, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ state: string }>;
}

export async function generateStaticParams() {
  const states = getStatesWithGames();
  return states.map((s) => ({
    state: slugify(s.stateName),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const stateName = state.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return {
    title: `Mahjong Games in ${stateName}`,
    description: `Find mahjong games, open play sessions, and events in ${stateName}. Browse cities with active mahjong groups.`,
  };
}

export default async function StatePage({ params }: Props) {
  const { state } = await params;
  const stateName = state.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  // Find matching state abbreviation
  const stateAbbr = Object.entries(require("@/lib/constants").US_STATES).find(
    ([, name]) => slugify(name as string) === state
  )?.[0];

  const games = mockGames.filter(
    (g) => (stateAbbr ? g.state === stateAbbr : slugify(getStateName(g.state)) === state) && g.status === "active"
  );

  const cities = getCitiesWithGames().filter(
    (c) => stateAbbr ? c.state === stateAbbr : slugify(getStateName(c.state)) === state
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/" className="hover:text-hotpink-500">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/cities" className="hover:text-hotpink-500">Cities</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-600">{stateName}</span>
      </nav>

      <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl sm:text-4xl text-charcoal mb-3">
        Mahjong Games in {stateName}
      </h1>
      <p className="text-slate-500 text-lg mb-10">
        {games.length} mahjong {games.length === 1 ? "game" : "games"} across {cities.length} {cities.length === 1 ? "city" : "cities"} in {stateName}.
      </p>

      {/* Cities */}
      <h2 className="font-semibold text-xl text-charcoal mb-4">Cities with Mahjong Games</h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {cities.map((c) => (
          <Link
            key={`${c.city}-${c.state}`}
            href={`/cities/${state}/${slugify(c.city)}`}
            className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-5 hover:border-hotpink-300 hover:shadow-sm transition-all"
          >
            <div>
              <h3 className="font-semibold text-charcoal">{c.city}</h3>
              <p className="text-sm text-slate-500">
                {c.count} mahjong {c.count === 1 ? "game" : "games"}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-hotpink-500" />
          </Link>
        ))}
      </div>

      {/* All Games in State */}
      <h2 className="font-semibold text-xl text-charcoal mb-4">All Games in {stateName}</h2>
      <div className="space-y-3 mb-10">
        {games.map((game) => (
          <Link
            key={game.id}
            href={`/games/${slugify(game.city + "-" + game.state)}/${slugify(game.name)}`}
            className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-4 hover:border-hotpink-300 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                game.type === "open_play" ? "bg-hotpink-400" :
                game.type === "lesson" ? "bg-skyblue-400" :
                game.type === "league" ? "bg-hotpink-300" :
                "bg-skyblue-400"
              }`} />
              <div>
                <p className="font-medium text-charcoal">{game.name}</p>
                <p className="text-sm text-slate-500">{game.city} &middot; {getGameTypeLabel(game.type)}</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-br from-hotpink-50 to-skyblue-50 rounded-xl border border-hotpink-200 p-8 text-center">
        <h2 className="font-semibold text-xl text-charcoal mb-2">
          Don&apos;t see your city?
        </h2>
        <p className="text-slate-500 mb-4 text-sm">
          We&apos;re growing every week. Sign up and request games in your area!
        </p>
        <Link
          href="/signup"
          className="inline-block bg-hotpink-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors"
        >
          Start Free Trial
        </Link>
      </div>
    </div>
  );
}
