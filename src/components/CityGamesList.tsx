"use client";

import Link from "next/link";
import { MapPin, Users, ArrowRight, Lock, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Game } from "@/types";
import { slugify, getGameTypeLabel, getGameTypeColor, formatSchedule } from "@/lib/utils";
import { getCityTile } from "@/lib/city-tiles";
import { SKILL_LEVEL_LABELS, GAME_STYLE_LABELS } from "@/lib/constants";

const FULL_PREVIEW_COUNT = 2;
const TEASER_COUNT = 3; // Cards 3-5

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
          <span>{game.generalArea || `${game.city}, ${game.state}`}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>{formatSchedule(game)}</span>
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

function TeaserTileCard({ game }: { game: Game }) {
  const schedule = formatSchedule(game);
  const styleLabel = GAME_STYLE_LABELS[game.gameStyle] || game.gameStyle;

  return (
    <div className="mahj-tile p-5 relative overflow-hidden">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getGameTypeColor(game.type)}`}>
          {getGameTypeLabel(game.type)}
        </span>
        {styleLabel && (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            {styleLabel}
          </span>
        )}
        {game.dropInFriendly && (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-skyblue-100 text-skyblue-600 border border-skyblue-200">
            Drop-in Friendly
          </span>
        )}
      </div>

      {/* Blurred venue name */}
      <div className="mb-1">
        <span className="inline-block h-5 w-48 bg-slate-200/80 rounded blur-[4px]" />
      </div>
      <div className="mb-3">
        <span className="inline-block h-3.5 w-32 bg-slate-100/80 rounded blur-[3px]" />
      </div>

      {/* Visible schedule */}
      <div className="space-y-1.5 mb-3">
        {schedule && schedule !== "Schedule TBD" && (
          <div className="flex items-center gap-2 text-sm text-charcoal">
            <Clock className="w-3.5 h-3.5 text-hotpink-400 shrink-0" />
            <span className="font-medium">{schedule}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{game.skillLevels.map((s) => SKILL_LEVEL_LABELS[s]).join(", ")}</span>
        </div>
      </div>

      <Link
        href="/pricing"
        className="inline-flex items-center gap-1.5 text-sm text-hotpink-500 hover:text-hotpink-600 font-medium transition-colors"
      >
        Subscribe to see venue &amp; details <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

export default function CityGamesList({ games, cityName, metroAbbreviation }: CityGamesListProps) {
  const { hasAccess, hasMetroAccess } = useAuth();
  const canViewMetro = hasMetroAccess(metroAbbreviation || null);

  // Paid users see everything
  if (hasAccess || canViewMetro) {
    return (
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        {games.map((game) => (
          <GameTileCard key={game.id} game={game} />
        ))}
      </div>
    );
  }

  // Free users: 2 full + 3 teasers + paywall
  const fullCards = games.slice(0, FULL_PREVIEW_COUNT);
  const teaserCards = games.slice(FULL_PREVIEW_COUNT, FULL_PREVIEW_COUNT + TEASER_COUNT);
  const lockedCount = Math.max(0, games.length - FULL_PREVIEW_COUNT - TEASER_COUNT);

  return (
    <>
      {/* Full detail cards (first 2) */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {fullCards.map((game) => (
          <GameTileCard key={game.id} game={game} />
        ))}
      </div>

      {/* Teaser cards (3-5) */}
      {teaserCards.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {teaserCards.map((game) => (
            <TeaserTileCard key={game.id} game={game} />
          ))}
        </div>
      )}

      {/* Subscribe CTA with locked count */}
      {games.length > FULL_PREVIEW_COUNT && (
        <div className="mahj-tile p-8 text-center mb-10">
          <Lock className="w-10 h-10 text-hotpink-400 mx-auto mb-3" />
          <h3 className="font-semibold text-xl text-charcoal mb-2">
            {lockedCount > 0
              ? `${lockedCount} more game${lockedCount !== 1 ? "s" : ""} in ${cityName}`
              : `See full details for all ${games.length} games in ${cityName}`
            }
          </h3>
          <p className="text-slate-500 text-sm mb-5 max-w-md mx-auto">
            Subscribe to unlock venue names, addresses, contact info, schedules, and directions for every listing.
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
        </div>
      )}
    </>
  );
}
