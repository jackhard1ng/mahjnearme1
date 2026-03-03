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

  return (
    <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all ${blurred ? "relative" : ""}`}>
      {blurred && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="text-center px-6">
            <ShieldCheck className="w-10 h-10 text-teal-600 mx-auto mb-3" />
            <p className="font-semibold text-slate-800 mb-1">Sign up free to see full details</p>
            <Link
              href="/signup"
              className="inline-block mt-2 bg-teal-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors"
            >
              Start Your 14-Day Free Trial
            </Link>
          </div>
        </div>
      )}

      <div className={blurred ? "content-blur" : ""}>
        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeColor}`}>
                  {typeLabel}
                </span>
                {game.dropInFriendly && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                    Drop-in Friendly
                  </span>
                )}
                {isGreatForUser && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
                    Great for you!
                  </span>
                )}
              </div>
              <Link href={`/games/${gameSlug}`}>
                <h3 className="font-semibold text-slate-800 text-lg hover:text-teal-600 transition-colors">
                  {isTeaser ? game.name : game.name}
                </h3>
              </Link>
              <p className="text-sm text-slate-500">{game.organizerName}</p>
            </div>
            {onFavorite && (
              <button
                onClick={() => onFavorite(game.id)}
                className="p-2 rounded-lg hover:bg-slate-50 transition-colors"
                aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
              </button>
            )}
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
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{isTeaser ? game.generalArea : `${game.venueName}, ${game.address}`}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{schedule}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <DollarSign className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{game.cost}</span>
            </div>
            {game.typicalGroupSize && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users className="w-4 h-4 text-slate-400 shrink-0" />
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

        {/* Contact & Actions */}
        {!isTeaser && !blurred && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {game.contactEmail && (
              <a href={`mailto:${game.contactEmail}`} className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700">
                <Mail className="w-3.5 h-3.5" /> Email
              </a>
            )}
            {game.contactPhone && (
              <a href={`tel:${game.contactPhone}`} className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700">
                <Phone className="w-3.5 h-3.5" /> Call
              </a>
            )}
            {game.website && (
              <a href={game.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700">
                <Globe className="w-3.5 h-3.5" /> Website
              </a>
            )}
            {game.instagram && (
              <a href={`https://instagram.com/${game.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700">
                <Instagram className="w-3.5 h-3.5" /> {game.instagram}
              </a>
            )}
            {game.registrationLink && (
              <a href={game.registrationLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-coral-500 hover:text-coral-600 font-medium">
                <ExternalLink className="w-3.5 h-3.5" /> Register
              </a>
            )}
          </div>
        )}

        {/* Footer */}
        <div className={`px-4 py-2.5 border-t border-slate-100 flex items-center justify-between ${verification.bgColor}`}>
          <div className="flex items-center gap-1.5">
            <CheckCircle className={`w-3.5 h-3.5 ${verification.color}`} />
            <span className={`text-xs font-medium ${verification.color}`}>{verification.label}</span>
          </div>
          {game.setsProvided && (
            <span className="text-xs text-slate-500">Sets provided</span>
          )}
        </div>
      </div>
    </div>
  );
}
