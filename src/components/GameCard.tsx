"use client";

import Link from "next/link";
import { Game } from "@/types";
import { getGameTypeColor, getGameTypeLabel, getVerificationStatus, formatSchedule, slugify } from "@/lib/utils";
import { SKILL_LEVEL_LABELS } from "@/lib/constants";
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
  Gamepad2,
  GraduationCap,
  Trophy,
  CalendarDays,
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

function getGameTypeIcon(type: string) {
  switch (type) {
    case "open_play": return <Gamepad2 className="w-3.5 h-3.5" />;
    case "lesson": return <GraduationCap className="w-3.5 h-3.5" />;
    case "league": return <Trophy className="w-3.5 h-3.5" />;
    case "event": return <CalendarDays className="w-3.5 h-3.5" />;
    default: return <Gamepad2 className="w-3.5 h-3.5" />;
  }
}

export default function GameCard({
  game,
  blurred = false,
  isTeaser = false,
  userSkillLevel,
  onFavorite,
  isFavorited = false,
}: GameCardProps) {
  const verification = getVerificationStatus(game.verified);
  const typeColor = getGameTypeColor(game.type);
  const typeLabel = getGameTypeLabel(game.type);
  const schedule = formatSchedule(game);
  const gameSlug = slugify(`${game.city}-${game.state}`) + "/" + slugify(game.name);
  const isGreatForUser = userSkillLevel && game.skillLevels.includes(userSkillLevel as "beginner" | "intermediate" | "advanced");
  const tileSymbol = getTileSymbol(game.id);

  return (
    <div className={`mahj-tile overflow-hidden ${blurred ? "relative" : ""}`}>
      {blurred && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl">
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
        {/* Header — group name engraved at top like a real tile */}
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1">
              <Link href={`/games/${gameSlug}`}>
                <h3 className="tile-engraved font-bold text-charcoal text-lg hover:text-hotpink-500 transition-colors leading-tight">
                  {game.name}
                </h3>
              </Link>
              <p className="text-xs text-slate-500 mt-0.5 tile-engraved">{game.organizerName}</p>
            </div>
            <div className="flex items-center gap-1">
              {onFavorite && (
                <button
                  onClick={() => onFavorite(game.id)}
                  className="p-2 rounded-lg hover:bg-hotpink-50 transition-colors"
                  aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart className={`w-5 h-5 ${isFavorited ? "fill-hotpink-500 text-hotpink-500" : "text-slate-300"}`} />
                </button>
              )}
              <span className="text-2xl opacity-15 select-none" aria-hidden="true">{tileSymbol}</span>
            </div>
          </div>

          {/* Day, time, location — key details engraved into tile */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center gap-2 text-sm text-charcoal tile-engraved">
              <Clock className="w-4 h-4 text-hotpink-400 shrink-0" />
              <span className="font-medium">{schedule}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-charcoal tile-engraved">
              <MapPin className="w-4 h-4 text-skyblue-500 shrink-0" />
              <span>{isTeaser ? game.generalArea : `${game.city}, ${game.state}`}</span>
            </div>
            {!isTeaser && (
              <div className="flex items-center gap-2 text-sm text-slate-600 tile-engraved">
                <DollarSign className="w-4 h-4 text-hotpink-400 shrink-0" />
                <span>{game.cost}</span>
              </div>
            )}
            {game.typicalGroupSize && (
              <div className="flex items-center gap-2 text-sm text-slate-600 tile-engraved">
                <Users className="w-4 h-4 text-skyblue-500 shrink-0" />
                <span>{game.typicalGroupSize}</span>
              </div>
            )}
          </div>

          {/* Game type icon + badge */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeColor}`}>
              {getGameTypeIcon(game.type)} {typeLabel}
            </span>
            {game.promoted && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-hotpink-100 text-hotpink-600 border border-hotpink-200">
                Featured
              </span>
            )}
            {isGreatForUser && !game.promoted && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-skyblue-100 text-skyblue-600 border border-skyblue-200">
                Great for you!
              </span>
            )}
          </div>

          {/* Description */}
          {!isTeaser && (
            <p className="text-sm text-slate-600 line-clamp-2 mb-3">{game.description}</p>
          )}

          {/* Contact & Links */}
          {!isTeaser && !blurred && (
            <div className="flex flex-wrap gap-2 mb-3">
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
                <a href={`https://instagram.com/${game.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-hotpink-600 hover:text-hotpink-700 bg-hotpink-50 px-2 py-1 rounded-full transition-colors">
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
          )}
        </div>

        {/* Bottom badges — skill level + drop-in, like tile footer */}
        <div className="px-4 py-2.5 border-t border-[#E8DDD0] flex items-center justify-between bg-[#FFF5EB]">
          <div className="flex items-center gap-1.5 flex-wrap">
            {game.skillLevels.map((level) => (
              <span
                key={level}
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  level === "beginner" ? "bg-skyblue-100 text-skyblue-600" :
                  level === "intermediate" ? "bg-hotpink-100 text-hotpink-600" :
                  "bg-slate-100 text-charcoal"
                }`}
              >
                {SKILL_LEVEL_LABELS[level]}
              </span>
            ))}
            {game.dropInFriendly && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-skyblue-100 text-skyblue-600">
                Drop-in Friendly
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className={`w-3.5 h-3.5 ${game.verified ? "text-hotpink-500" : "text-slate-300"}`} />
            <span className={`text-xs font-medium ${game.verified ? "text-hotpink-600" : "text-slate-400"}`}>{verification.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
