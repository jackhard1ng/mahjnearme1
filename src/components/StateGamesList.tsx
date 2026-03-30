"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { slugify, getGameTypeLabel, getMapPinColor } from "@/lib/utils";

const FREE_PREVIEW_COUNT = 3;

interface Game {
  id: string;
  name: string;
  city: string;
  state: string;
  type: string;
}

interface StateGamesListProps {
  games: Game[];
  stateName: string;
}

export default function StateGamesList({ games, stateName }: StateGamesListProps) {
  const { hasAccess } = useAuth();

  const visibleGames = hasAccess ? games : games.slice(0, FREE_PREVIEW_COUNT);

  return (
    <>
      <div className="space-y-3 mb-4">
        {visibleGames.map((game) => (
          <Link
            key={game.id}
            href={`/games/${slugify(game.city + "-" + game.state)}/${slugify(game.name)}`}
            className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-4 hover:border-hotpink-300 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getMapPinColor(game.type) }} />
              <div>
                <p className="font-medium text-charcoal">{game.name}</p>
                <p className="text-sm text-slate-500">{game.city} &middot; {getGameTypeLabel(game.type)}</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>
        ))}
      </div>

      {/* Locked remaining games - only for non-subscribers */}
      {!hasAccess && games.length > FREE_PREVIEW_COUNT && (
        <div className="relative mb-10">
          <div className="space-y-3 select-none pointer-events-none" aria-hidden="true">
            {games.slice(FREE_PREVIEW_COUNT, FREE_PREVIEW_COUNT + 3).map((game) => (
              <div
                key={game.id}
                className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-4 blur-[5px] opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getMapPinColor(game.type) }} />
                  <div>
                    <div className="h-4 bg-slate-200 rounded w-40 mb-1" />
                    <div className="h-3 bg-slate-100 rounded w-28" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-xl">
            <div className="text-center px-6">
              <ShieldCheck className="w-10 h-10 text-hotpink-500 mx-auto mb-2" />
              <p className="font-semibold text-charcoal mb-1">
                {games.length - FREE_PREVIEW_COUNT} more game{games.length - FREE_PREVIEW_COUNT !== 1 ? "s" : ""} in {stateName}
              </p>
              <p className="text-slate-500 text-sm mb-3">Subscribe to see all listings with full details.</p>
              <Link
                href="/pricing"
                className="inline-block bg-hotpink-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors text-sm"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
