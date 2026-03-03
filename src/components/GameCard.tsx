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
  index?: number;
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

const CARD_CLASSES = ["mahj-tile", "mahj-tile-mint", "mahj-tile-pink", "mahj-tile-blue"];

export default function GameCard({
  game,
  blurred = false,
  isTeaser = false,
  userSkillLevel,
  onFavorite,
  isFavorited = false,
  index = 0,
}: GameCardProps) {
  const verification = getVerificationStatus(game.verified);
  const typeColor = getGameTypeColor(game.type);
  const typeLabel = getGameTypeLabel(game.type);
  const schedule = formatSchedule(game);
  const gameSlug = slugify(`${game.city}-${game.state}`) + "/" + slugify(game.name);
  const isGreatForUser = userSkillLevel && game.skillLevels.includes(userSkillLevel as "beginner" | "intermediate" | "advanced");
  const tileSymbol = getTileSymbol(game.id);
  const cardClass = CARD_CLASSES[index % CARD_CLASSES.length];

  return (
    <div className={`${cardClass} overflow-hidden ${blurred ? "relative" : ""}`}>
      {blurred && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-softpink-200/70 backdrop-blur-sm rounded-xl">
          <div className="text-center px-6">
            <ShieldCheck className="w-10 h-10 text-hotpink-500 mx-auto mb-3" />
            <p className="font-semibold text-charcoal mb-1">Sign up free to see full details</p>
            <Link
              href="/signup"
              className="inline-block mt-2 bg-hotpink-500 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors"
            >
              Start Your 14-Day Free Trial
            </Link>
          </div>
        </div>
      )}

      <div className={blurred ? "content-blur" : ""}>
        {/* Tile Top Edge - colorful gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-hotpink-500 via-skyblue-400 to-mint-400" />

        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeColor}`}>
                  {typeLabel}
                </span>
                {game.dropInFriendly && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-mint-200 text-mint-600 border border-mint-300">
                    Drop-in Friendly
                  </span>
                )}
                {game.promoted && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-hotpink-100 text-hotpink-600 border border-hotpink-200">
                    Featured
                  </span>
                )}
                {isGreatForUser && !game.promoted && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold-100 text-gold-500 border border-gold-200">
                    Great for you!
                  </span>
                )}
              </div>
              <Link href={`/games/${gameSlug}`}>
                <h3 className="font-semibold text-charcoal text-lg hover:text-hotpink-500 transition-colors">
                  {game.name}
                </h3>
              </Link>
              <p className="text-sm text-slate-500">{game.organizerName}</p>
            </div>
            <div className="flex items-center gap-1">
              {onFavorite && (
                <button
                  onClick={() => onFavorite(game.id)}
                  className="p-2 rounded-lg hover:bg-softpink-200 transition-colors"
                  aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart className={`w-5 h-5 ${isFavorited ? "fill-hotpink-500 text-hotpink-500" : "text-slate-400"}`} />
                </button>
              )}
              {/* Decorative tile symbol */}
              <span className="text-2xl opacity-20 select-none" aria-hidden="true">{tileSymbol}</span>
            </div>
          </div>

          {/* Skill Level Badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {game.skillLevels.map((level) => (
              <span
                key={level}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-skyblue-200 text-skyblue-600 border border-skyblue-300"
              >
                {SKILL_LEVEL_LABELS[level]}
              </span>
            ))}
          </div>

          {/* Key Details */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="w-4 h-4 text-hotpink-400 shrink-0" />
              <span>{isTeaser ? game.generalArea : `${game.venueName}, ${game.address}`}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="w-4 h-4 text-skyblue-500 shrink-0" />
              <span>{schedule}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <DollarSign className="w-4 h-4 text-mint-500 shrink-0" />
              <span>{game.cost}</span>
            </div>
            {game.typicalGroupSize && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users className="w-4 h-4 text-lavender-500 shrink-0" />
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
                <a href={`mailto:${game.contactEmail}`} className="inline-flex items-center gap-1 text-xs text-hotpink-600 hover:text-hotpink-700 bg-hotpink-50 px-2 py-1 rounded-full transition-colors">
                  <Mail className="w-3.5 h-3.5" /> Email
                </a>
              )}
              {game.contactPhone && (
                <a href={`tel:${game.contactPhone}`} className="inline-flex items-center gap-1 text-xs text-hotpink-600 hover:text-hotpink-700 bg-hotpink-50 px-2 py-1 rounded-full transition-colors">
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
              )}
              {game.website && (
                <a href={game.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-skyblue-600 hover:text-skyblue-500 bg-skyblue-100 px-2 py-1 rounded-full transition-colors">
                  <Globe className="w-3.5 h-3.5" /> Website
                </a>
              )}
              {game.instagram && (
                <a href={`https://instagram.com/${game.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-lavender-600 hover:text-lavender-500 bg-lavender-100 px-2 py-1 rounded-full transition-colors">
                  <Instagram className="w-3.5 h-3.5" /> {game.instagram}
                </a>
              )}
              {game.facebookGroup && (
                <a href={game.facebookGroup} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-skyblue-600 hover:text-skyblue-500 bg-skyblue-100 px-2 py-1 rounded-full transition-colors">
                  <Globe className="w-3.5 h-3.5" /> Facebook
                </a>
              )}
              {game.registrationLink && (
                <a href={game.registrationLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-hotpink-600 hover:text-hotpink-700 bg-hotpink-100 px-2 py-1 rounded-full font-medium transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> Register
                </a>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-lavender-200/50 flex items-center justify-between bg-lavender-100/30">
          <div className="flex items-center gap-1.5">
            <CheckCircle className={`w-3.5 h-3.5 ${game.verified ? "text-mint-500" : "text-slate-400"}`} />
            <span className={`text-xs font-medium ${game.verified ? "text-mint-600" : "text-slate-400"}`}>{verification.label}</span>
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
