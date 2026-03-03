"use client";

import Link from "next/link";
import { Game } from "@/types";
import { getGameTypeColor, getGameTypeLabel, getVerificationStatus, formatSchedule, slugify } from "@/lib/utils";
import { SKILL_LEVEL_COLORS, SKILL_LEVEL_LABELS } from "@/lib/constants";
import {
  MapPin,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  Mail,
  Phone,
  Globe,
  Instagram,
  ExternalLink,
  Heart,
  ShieldCheck,
} from "lucide-react";

interface GameCardProps {
  game: Game;
  blurred?: boolean;
  isTeaser?: boolean;
  userSkillLevel?: string | null;
  onFavorite?: (gameId: string) => void;
  isFavorited?: boolean;
}

const TILE_SYMBOLS = ["🀇", "🀈", "🀉", "🀊", "🀋", "🀌", "🀍", "🀎", "🀏", "🀙", "🀚", "🀛", "🀜", "🀝", "🀞", "🀟", "🀠", "🀡"];

function getTileSymbol(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return TILE_SYMBOLS[Math.abs(hash) % TILE_SYMBOLS.length];
}

export default function GameCard({
  game,
  blurred = false,
  isTeaser = false,
  userSkillLevel,
  onFavorite,
  isFavorited = false,
}: GameCardProps) {
  const verification = getVerificationStatus(game.lastVerified);
  const typeColor = getGameTypeColor(game.type);
  const typeLabel = getGameTypeLabel(game.type);
  const schedule = formatSchedule(game);
  const gameSlug = slugify(`${game.city}-${game.state}`) + "/" + slugify(game.name);
  const isGreatForUser = userSkillLevel && game.skillLevels.includes(userSkillLevel as "beginner" | "intermediate" | "advanced");
  const tileSymbol = getTileSymbol(game.id);

  return (
    <div className={`mahj-tile overflow-hidden ${blurred ? "relative" : ""}`}>
      {blurred && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-ivory-100/70 backdrop-blur-sm rounded-xl">
          <div className="text-center px-6">
            <ShieldCheck className="w-10 h-10 text-jade-600 mx-auto mb-3" />
            <p className="font-semibold text-slate-800 mb-1">Sign up free to see full details</p>
            <Link
              href="/signup"
              className="inline-block mt-2 bg-jade-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-jade-700 transition-colors"
            >
              Start Your 14-Day Free Trial
            </Link>
          </div>
        </div>
      )}

      <div className={blurred ? "content-blur" : ""}>
        {/* Tile Top Edge - colored bar like the engraved top of a mahjong tile */}
        <div className="h-1.5 bg-gradient-to-r from-mahj-red-500 via-gold-400 to-jade-500" />

        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeColor}`}>
                  {typeLabel}
                </span>
                {game.dropInFriendly && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-jade-100 text-jade-800 border border-jade-200">
                    Drop-in Friendly
                  </span>
                )}
                {isGreatForUser && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold-100 text-gold-600 border border-gold-200">
                    Great for you!
                  </span>
                )}
              </div>
              <Link href={`/games/${gameSlug}`}>
                <h3 className="font-semibold text-slate-800 text-lg hover:text-jade-600 transition-colors">
                  {game.name}
                </h3>
              </Link>
              <p className="text-sm text-slate-500">{game.organizerName}</p>
            </div>
            <div className="flex items-center gap-1">
              {onFavorite && (
                <button
                  onClick={() => onFavorite(game.id)}
                  className="p-2 rounded-lg hover:bg-ivory-200 transition-colors"
                  aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart className={`w-5 h-5 ${isFavorited ? "fill-mahj-red-500 text-mahj-red-500" : "text-slate-400"}`} />
                </button>
              )}
              {/* Decorative tile symbol */}
              <span className="text-2xl opacity-15 select-none" aria-hidden="true">{tileSymbol}</span>
            </div>
          </div>

          {/* Skill Level Badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {game.skillLevels.map((level) => (
              <span
                key={level}
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${SKILL_LEVEL_COLORS[level]}`}
              >
                {SKILL_LEVEL_LABELS[level]}
              </span>
            ))}
          </div>

          {/* Key Details */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="w-4 h-4 text-mahj-red-400 shrink-0" />
              <span>{isTeaser ? game.generalArea : `${game.venueName}, ${game.address}`}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="w-4 h-4 text-jade-500 shrink-0" />
              <span>{schedule}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <DollarSign className="w-4 h-4 text-gold-500 shrink-0" />
              <span>{game.cost}</span>
            </div>
            {game.typicalGroupSize && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users className="w-4 h-4 text-coral-500 shrink-0" />
                <span>{game.typicalGroupSize}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {!isTeaser && (
          <div className="px-4 pb-3">
            <p className="text-sm text-slate-600 line-clamp-2">{game.description}</p>
          </div>
        )}

        {/* Contact & Links */}
        {!isTeaser && !blurred && (
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-2">
              {game.contactEmail && (
                <a href={`mailto:${game.contactEmail}`} className="inline-flex items-center gap-1 text-xs text-jade-600 hover:text-jade-700 bg-jade-50 px-2 py-1 rounded-full transition-colors">
                  <Mail className="w-3.5 h-3.5" /> Email
                </a>
              )}
              {game.contactPhone && (
                <a href={`tel:${game.contactPhone}`} className="inline-flex items-center gap-1 text-xs text-jade-600 hover:text-jade-700 bg-jade-50 px-2 py-1 rounded-full transition-colors">
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
              )}
              {game.website && (
                <a href={game.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-jade-600 hover:text-jade-700 bg-jade-50 px-2 py-1 rounded-full transition-colors">
                  <Globe className="w-3.5 h-3.5" /> Website
                </a>
              )}
              {game.instagram && (
                <a href={`https://instagram.com/${game.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-jade-600 hover:text-jade-700 bg-jade-50 px-2 py-1 rounded-full transition-colors">
                  <Instagram className="w-3.5 h-3.5" /> {game.instagram}
                </a>
              )}
              {game.facebookGroup && (
                <a href={game.facebookGroup} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-jade-600 hover:text-jade-700 bg-jade-50 px-2 py-1 rounded-full transition-colors">
                  <Globe className="w-3.5 h-3.5" /> Facebook
                </a>
              )}
              {game.registrationLink && (
                <a href={game.registrationLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-mahj-red-500 hover:text-mahj-red-600 bg-mahj-red-50 px-2 py-1 rounded-full font-medium transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> Register
                </a>
              )}
            </div>
          </div>
        )}

        {/* Footer - tile bottom edge */}
        <div className={`px-4 py-2.5 border-t border-ivory-300 flex items-center justify-between bg-ivory-100/50`}>
          <div className="flex items-center gap-1.5">
            <CheckCircle className={`w-3.5 h-3.5 ${verification.color}`} />
            <span className={`text-xs font-medium ${verification.color}`}>{verification.label}</span>
          </div>
          {game.setsProvided && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              🀄 Sets provided
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
