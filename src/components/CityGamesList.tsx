"use client";

import Link from "next/link";
import { MapPin, Users, ArrowRight, ShieldCheck, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Game } from "@/types";
import { slugify, getGameTypeLabel, getGameTypeColor } from "@/lib/utils";
import { getCityTile } from "@/lib/city-tiles";
import { SKILL_LEVEL_LABELS } from "@/lib/constants";

const FREE_PREVIEW_COUNT = 2;

interface CityGamesListProps {
  games: Game[];
  cityName: string;
  metroAbbreviation?: string | null;
}

function GameTileCard({ game }: { game: Game }) {
  const tile = getCityTile(game.city);
  return (
    <Link
      key={game.id}
      href={`/games/${slugify(game.city + "-" + game.state)}/${slugify(game.name)}`}
      className="mahj-tile p-5 relative overflow-hidden hover:shadow-xl transition-shadow cursor-pointer block"
    >
      <div className="absolute top-3 right-3 pointer-events-none select-none">
        {tile ? (
          <img src={tile} alt="" className="h-10 w-auto opacity-80 drop-shadow-sm" />
        ) : (
          <svg width="36" height="36" viewBox="0 0 36 36" className="opacity-40">
            <rect x="2" y="2" width="32" height="32" rx="4" fill="#87CEEB" stroke="#5BB8E8" strokeWidth="1.5" />
            <circle cx="11" cy="11" r="3" fill="white" opacity="0.8" />
            <circle cx="25" cy="11" r="3" fill="white" opacity="0.8" />
            <circle cx="18" cy="18" r="3" fill="white" opacity="0.8" />
            <circle cx="11" cy="25" r="3" fill="white" opacity="0.8" />
            <circle cx="25" cy="25" r="3" fill="white" opacity="0.8" />
          </svg>
        )}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getGameTypeColor(game.type)}`}>
          {getGameTypeLabel(game.type)}
        </span>
        {game.dropInFriendly && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-hotpink-100 text-hotpink-600">
            Drop-in Friendly
          </span>
        )}
      </div>

      <h3 className="font-semibold text-lg text-charcoal mb-1 pr-12">{game.name}</h3>

      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="w-4 h-4 text-slate-400" />
          <span>{game.generalArea}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Users className="w-4 h-4 text-slate-400" />
          <span>{game.skillLevels.map((s) => SKILL_LEVEL_LABELS[s]).join(", ")}</span>
        </div>
      </div>

      <span className="inline-flex items-center gap-1 text-sm font-semibold text-hotpink-500">
        View Full Details <ArrowRight className="w-4 h-4" />
      </span>
    </Link>
  );
}

export default function CityGamesList({ games, cityName, metroAbbreviation }: CityGamesListProps) {
  const { hasAccess, hasMetroAccess, user } = useAuth();

  const canViewMetro = hasMetroAccess(metroAbbreviation || null);

  // Paid users, trial users, and free users viewing their home metro see all
  if (hasAccess || canViewMetro) {
    return (
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        {games.map((game) => (
          <GameTileCard key={game.id} game={game} />
        ))}
      </div>
    );
  }

  // Free users viewing non-home metro: show listings exist but blur details
  const isLoggedInFree = !!user;

  return (
    <>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {games.slice(0, FREE_PREVIEW_COUNT).map((game) => (
          <GameTileCard key={game.id} game={game} />
        ))}
      </div>

      {games.length > FREE_PREVIEW_COUNT && (
        <div className="relative mb-10">
          <div className="grid md:grid-cols-2 gap-4 select-none pointer-events-none" aria-hidden="true">
            {games.slice(FREE_PREVIEW_COUNT, FREE_PREVIEW_COUNT + 4).map((game) => (
              <div key={game.id} className="mahj-tile p-5 relative overflow-hidden blur-[6px] opacity-60">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getGameTypeColor(game.type)}`}>
                    {getGameTypeLabel(game.type)}
                  </span>
                </div>
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="space-y-1.5 mb-3">
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>

          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-xl">
            <div className="text-center px-6 max-w-md">
              {isLoggedInFree ? (
                <>
                  <Lock className="w-12 h-12 text-hotpink-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-xl text-charcoal mb-2">
                    Traveling? Upgrade to see games in every city.
                  </h3>
                  <p className="text-slate-500 text-sm mb-4">
                    Your free account includes full access to your home metro.
                    Upgrade to unlock all {games.length} games in {cityName} and 70+ other metros.
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-block bg-hotpink-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors"
                  >
                    View Plans
                  </Link>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-12 h-12 text-hotpink-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-xl text-charcoal mb-2">
                    {games.length - FREE_PREVIEW_COUNT} more game{games.length - FREE_PREVIEW_COUNT !== 1 ? "s" : ""} in {cityName}
                  </h3>
                  <p className="text-slate-500 text-sm mb-4">
                    Subscribe to unlock all games with full details, contact info, schedules, and directions.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href="/pricing"
                      className="inline-block bg-hotpink-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors"
                    >
                      View Plans
                    </Link>
                    <Link
                      href="/signup"
                      className="inline-block bg-skyblue-100 text-charcoal px-8 py-3 rounded-xl font-semibold hover:bg-skyblue-200 transition-colors"
                    >
                      Sign Up Free
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
