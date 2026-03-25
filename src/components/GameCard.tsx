"use client";

import Link from "next/link";
import { Game } from "@/types";
import { getGameTypeColor, getGameTypeLabel, getVerificationStatus, formatSchedule, slugify } from "@/lib/utils";
import { getCityTile } from "@/lib/city-tiles";
import { SKILL_LEVEL_LABELS } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
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
  GraduationCap,
  Trophy,
  CalendarDays,
  CalendarPlus,
  AlertCircle,
  Lock,
  ThumbsUp,
  Star,
  Flag,
  ArrowRight,
} from "lucide-react";

interface GameCardProps {
  game: Game;
  blurred?: boolean;
  isTeaser?: boolean;
  userSkillLevel?: string | null;
  onFavorite?: (gameId: string) => void;
  isFavorited?: boolean;
  onCalendarToggle?: (gameId: string) => void;
  isOnCalendar?: boolean;
  index?: number;
  distanceText?: string | null;
  timingLabel?: string | null;
  timingBadge?: string | null;
  timingBadgeColor?: string;
}

// Three mahjong suits: each card gets one based on its ID hash
type TileSuit = "dots" | "bam" | "crack";

function getTileSuit(id: string): TileSuit {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const suits: TileSuit[] = ["dots", "bam", "crack"];
  return suits[Math.abs(hash) % 3];
}

function getTileNumber(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 3) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 9) + 1; // 1-9
}

// SVG suit art rendered as decorative background on the tile
function TileSuitArt({ suit, number }: { suit: TileSuit; number: number }) {
  if (suit === "dots") {
    // Circles pattern, arranged in a grid
    const positions: [number, number][] = [];
    const count = Math.min(number, 9);
    if (count <= 3) {
      for (let i = 0; i < count; i++) positions.push([50, 20 + i * 30]);
    } else if (count <= 6) {
      for (let i = 0; i < Math.ceil(count / 2); i++) positions.push([30, 15 + i * 25]);
      for (let i = 0; i < Math.floor(count / 2); i++) positions.push([70, 15 + i * 25]);
    } else {
      for (let i = 0; i < 3; i++) positions.push([20, 15 + i * 28]);
      for (let i = 0; i < Math.min(3, count - 3); i++) positions.push([50, 15 + i * 28]);
      for (let i = 0; i < Math.min(3, count - 6); i++) positions.push([80, 15 + i * 28]);
    }
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {positions.map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="10" fill="none" stroke="#C71585" strokeWidth="2.5" opacity="0.35" />
            <circle cx={cx} cy={cy} r="5" fill="#FF1493" opacity="0.2" />
          </g>
        ))}
      </svg>
    );
  }

  if (suit === "bam") {
    // Bamboo sticks pattern
    const count = Math.min(number, 9);
    const sticks: [number, number, number][] = []; // x, y, height
    if (count <= 3) {
      for (let i = 0; i < count; i++) sticks.push([35 + i * 15, 10, 80]);
    } else if (count <= 6) {
      for (let i = 0; i < Math.ceil(count / 2); i++) sticks.push([25 + i * 18, 5, 45]);
      for (let i = 0; i < Math.floor(count / 2); i++) sticks.push([25 + i * 18, 50, 45]);
    } else {
      for (let i = 0; i < 3; i++) sticks.push([20 + i * 20, 3, 30]);
      for (let i = 0; i < Math.min(3, count - 3); i++) sticks.push([20 + i * 20, 35, 30]);
      for (let i = 0; i < Math.min(3, count - 6); i++) sticks.push([20 + i * 20, 67, 30]);
    }
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {sticks.map(([x, y, h], i) => (
          <g key={i}>
            <rect x={x - 3} y={y} width="6" height={h} rx="3" fill="#2E8B57" opacity="0.25" />
            <line x1={x} y1={y + h * 0.3} x2={x} y2={y + h * 0.7} stroke="#228B22" strokeWidth="1.5" opacity="0.2" />
            {/* Bamboo node marks */}
            <line x1={x - 3} y1={y + h * 0.33} x2={x + 3} y2={y + h * 0.33} stroke="#1B5E20" strokeWidth="1" opacity="0.3" />
            <line x1={x - 3} y1={y + h * 0.66} x2={x + 3} y2={y + h * 0.66} stroke="#1B5E20" strokeWidth="1" opacity="0.3" />
          </g>
        ))}
      </svg>
    );
  }

  // Crack (characters): Chinese numeral style
  const chars = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
  const char = chars[(number - 1) % 9];
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <text x="50" y="42" textAnchor="middle" fontSize="32" fill="#C71585" opacity="0.2" fontWeight="bold">{char}</text>
      <text x="50" y="78" textAnchor="middle" fontSize="20" fill="#8B0000" opacity="0.15" fontWeight="bold">萬</text>
    </svg>
  );
}

function getGameTypeIcon(type: string) {
  switch (type) {
    case "open_play": return <Users className="w-3.5 h-3.5" />;
    case "lesson": return <GraduationCap className="w-3.5 h-3.5" />;
    case "league": return <Trophy className="w-3.5 h-3.5" />;
    case "event": return <CalendarDays className="w-3.5 h-3.5" />;
    default: return <Users className="w-3.5 h-3.5" />;
  }
}

export default function GameCard({
  game,
  blurred = false,
  isTeaser = false,
  userSkillLevel,
  onFavorite,
  isFavorited = false,
  onCalendarToggle,
  isOnCalendar = false,
  distanceText = null,
  timingLabel = null,
  timingBadge = null,
  timingBadgeColor = "",
}: GameCardProps) {
  const { hasAccess } = useAuth();
  const verification = getVerificationStatus(game.verified);
  const typeColor = getGameTypeColor(game.type);
  const typeLabel = getGameTypeLabel(game.type);
  const schedule = formatSchedule(game);
  const gameSlug = slugify(`${game.city}-${game.state}`) + "/" + slugify(game.name);
  const isGreatForUser = userSkillLevel && game.skillLevels.includes(userSkillLevel as "beginner" | "intermediate" | "advanced");
  const suit = getTileSuit(game.id);
  const tileNumber = getTileNumber(game.id);
  const cityTile = getCityTile(game.city);
  const canSeeContactInfo = hasAccess;

  const cardContent = (
    <>
      <div className={`flex flex-col flex-1 ${blurred ? "content-blur select-none" : ""}`}>
        {/* Tile face: city tile or suit art as watermark background */}
        <div className="relative p-4 pb-3 flex-1">
          {/* City tile or suit watermark behind content */}
          <div className="absolute top-2 right-2 pointer-events-none select-none">
            {cityTile ? (
              <img src={cityTile} alt="" className="h-[34px] w-auto opacity-90" />
            ) : (
              <div className="w-20 h-20 opacity-60">
                <TileSuitArt suit={suit} number={tileNumber} />
              </div>
            )}
          </div>

          {/* Suit label + favorite */}
          <div className="flex items-center justify-between mb-2">
            {!cityTile && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {suit === "dots" ? "Circles" : suit === "bam" ? "Bamboo" : "Characters"} &middot; {tileNumber}
              </span>
            )}
            {cityTile && <span />}
            {onFavorite && !blurred && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFavorite(game.id); }}
                className="p-1.5 rounded-lg hover:bg-hotpink-50 transition-colors -mr-1"
                aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? "fill-hotpink-500 text-hotpink-500" : "text-slate-300"}`} />
              </button>
            )}
          </div>

          {blurred ? (
            <>
              {/* Locked cards: type + day + distance + skill only. NO name, venue, or identifying info. */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeColor}`}>
                  {getGameTypeIcon(game.type)} {typeLabel}
                </span>
                {timingBadge && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${timingBadgeColor}`}>
                    {timingBadge === "Happening Now" && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                    {timingBadge}
                  </span>
                )}
                {game.dropInFriendly && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-skyblue-100 text-skyblue-600 border border-skyblue-200">
                    Drop-in Friendly
                  </span>
                )}
              </div>

              <div className="space-y-1.5 mb-3 text-sm">
                {game.recurringSchedule?.dayOfWeek && (
                  <div className="flex items-center gap-2 text-charcoal">
                    <Clock className="w-3.5 h-3.5 text-hotpink-400 shrink-0" />
                    <span className="font-medium">
                      {game.recurringSchedule.dayOfWeek.split("|").map(d => d.trim().charAt(0).toUpperCase() + d.trim().slice(1)).join(" & ")}s
                    </span>
                  </div>
                )}
                {distanceText && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-skyblue-500 shrink-0" />
                    <span>{distanceText}</span>
                  </div>
                )}
              </div>

              {game.skillLevels.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {game.skillLevels.map((level) => (
                    <span key={level} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </span>
                  ))}
                </div>
              )}

              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-hotpink-500 hover:text-hotpink-600 transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                Subscribe to see full details
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          ) : (
            <>
              {/* Group name, engraved into tile */}
              <h3 className="tile-engraved font-bold text-charcoal text-lg hover:text-hotpink-500 transition-colors leading-tight mb-0.5">
                {game.name}
              </h3>
              {!isTeaser && (
                <p className="text-xs text-slate-500 tile-engraved mb-3">{game.organizerName}</p>
              )}
              {isTeaser && <div className="mb-3" />}

              {/* Urgency badge */}
              {timingBadge && (
                <div className="mb-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${timingBadgeColor}`}>
                    {timingBadge === "Happening Now" && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                    {timingBadge}
                  </span>
                </div>
              )}

              {/* Key details (engraved) */}
              <div className="space-y-1.5 mb-3">
                {!isTeaser && (
                  <div className="flex items-center gap-2 text-sm text-charcoal tile-engraved">
                    <Clock className="w-3.5 h-3.5 text-hotpink-400 shrink-0" />
                    <span className="font-medium">{timingLabel || schedule}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-charcoal tile-engraved">
                  <MapPin className="w-3.5 h-3.5 text-skyblue-500 shrink-0" />
                  <span>
                    {isTeaser ? game.generalArea : `${game.city}, ${game.state}`}
                    {distanceText && (
                      <span className="text-hotpink-500 font-medium ml-2">&middot; {distanceText}</span>
                    )}
                  </span>
                </div>
                {!isTeaser && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 tile-engraved">
                    <DollarSign className="w-3.5 h-3.5 text-hotpink-400 shrink-0" />
                    <span>{game.cost}</span>
                  </div>
                )}
                {!isTeaser && game.typicalGroupSize && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 tile-engraved">
                    <Users className="w-3.5 h-3.5 text-skyblue-500 shrink-0" />
                    <span>{game.typicalGroupSize}</span>
                  </div>
                )}
              </div>

              {/* Game type badge */}
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

              {/* Contact Links */}
              {!isTeaser && canSeeContactInfo && (
                <div className="flex flex-wrap gap-1.5 mb-2" onClick={(e) => e.stopPropagation()}>
                  {game.contactEmail && (
                    <a href={`mailto:${game.contactEmail}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-hotpink-600 hover:text-hotpink-700 bg-hotpink-50 px-2 py-1 rounded-full transition-colors">
                      <Mail className="w-3 h-3" /> Email
                    </a>
                  )}
                  {game.contactPhone && (
                    <a href={`tel:${game.contactPhone}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-hotpink-600 hover:text-hotpink-700 bg-hotpink-50 px-2 py-1 rounded-full transition-colors">
                      <Phone className="w-3 h-3" /> Call
                    </a>
                  )}
                  {game.website && (
                    <a href={game.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-skyblue-600 hover:text-skyblue-500 bg-skyblue-100 px-2 py-1 rounded-full transition-colors">
                      <Globe className="w-3 h-3" /> Website
                    </a>
                  )}
                  {game.instagram && (
                    <a href={`https://instagram.com/${game.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-hotpink-600 hover:text-hotpink-700 bg-hotpink-50 px-2 py-1 rounded-full transition-colors">
                      <Instagram className="w-3 h-3" /> {game.instagram}
                    </a>
                  )}
                  {game.facebookGroup && (
                    <a href={game.facebookGroup} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-skyblue-600 hover:text-skyblue-500 bg-skyblue-100 px-2 py-1 rounded-full transition-colors">
                      <Globe className="w-3 h-3" /> Facebook
                    </a>
                  )}
                  {game.registrationLink && (
                    <a href={game.registrationLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-hotpink-600 hover:text-hotpink-700 bg-hotpink-100 px-2 py-1 rounded-full font-medium transition-colors">
                      <ExternalLink className="w-3 h-3" /> Register
                    </a>
                  )}
                  {onCalendarToggle && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCalendarToggle(game.id); }}
                      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium transition-colors border ${
                        isOnCalendar
                          ? "text-hotpink-600 bg-hotpink-50 border-hotpink-200"
                          : "text-skyblue-600 bg-skyblue-50 border-skyblue-200 hover:bg-skyblue-100"
                      }`}
                    >
                      <CalendarPlus className="w-3 h-3" /> {isOnCalendar ? "On Calendar" : "Add to Calendar"}
                    </button>
                  )}
                </div>
              )}

              {/* Contact info paywall, inline and non-disruptive */}
              {!isTeaser && !canSeeContactInfo && !blurred && (
                <Link
                  href="/pricing"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-2 hover:border-hotpink-300 hover:text-hotpink-600 transition-colors"
                >
                  <Lock className="w-3 h-3 shrink-0" />
                  <span>Get the details. <span className="font-medium text-hotpink-500">Upgrade to join this game</span></span>
                </Link>
              )}
            </>
          )}
        </div>

        {/* Availability disclaimer */}
        {!blurred && !isTeaser && (
          <div className="mx-4 mb-2 flex items-start gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
            <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
            <span>Availability may change. Contact the organizer to confirm details and reserve your spot.</span>
          </div>
        )}

        {/* Quick Reactions */}
        {!blurred && !isTeaser && (
          <div className="mx-4 mb-2 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-green-600 transition-colors"
              title="Going this week"
            >
              <ThumbsUp className="w-3 h-3" />
              <span>{game.goingCount || 0}</span>
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-amber-500 transition-colors"
              title="I've been here"
            >
              <Star className="w-3 h-3" />
              <span>{game.beenHereCount || 0}</span>
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-red-500 transition-colors"
              title="Heads up"
            >
              <Flag className="w-3 h-3" />
              <span>{game.headsUpCount || 0}</span>
            </button>
            {(game.goingCount > 0) && (
              <span className="text-[10px] text-slate-400 ml-auto">
                {game.goingCount} going this week
              </span>
            )}
          </div>
        )}

        {/* Tile footer: inner border like the recessed face of a real tile */}
        <div className="px-4 py-2.5 border-t-2 border-[#D4C9B8] flex items-center justify-between bg-[#FFF0DD]">
          {blurred ? (
            <span className="text-[11px] text-slate-400">Subscribe to unlock</span>
          ) : (
            <>
              <div className="flex items-center gap-1.5 flex-wrap">
                {game.skillLevels.map((level) => (
                  <span
                    key={level}
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                      level === "beginner" ? "bg-skyblue-100 text-skyblue-600" :
                      level === "intermediate" ? "bg-hotpink-100 text-hotpink-600" :
                      "bg-slate-100 text-charcoal"
                    }`}
                  >
                    {SKILL_LEVEL_LABELS[level]}
                  </span>
                ))}
                {game.dropInFriendly && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-skyblue-100 text-skyblue-600">
                    Drop-in
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className={`w-3.5 h-3.5 ${game.verified ? "text-hotpink-500" : "text-slate-300"}`} />
                <span className={`text-[11px] font-medium ${game.verified ? "text-hotpink-600" : "text-slate-400"}`}>
                  {game.lastVerified && /^\d{4}-\d{2}-\d{2}$/.test(game.lastVerified)
                    ? `Verified ${new Date(game.lastVerified + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                    : verification.label}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );

  if (blurred) {
    return (
      <div className="mahj-tile overflow-hidden flex flex-col relative cursor-pointer">
        <Link href="/pricing" className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-md rounded-[14px]">
          <div className="text-center px-6">
            <ShieldCheck className="w-10 h-10 text-hotpink-500 mx-auto mb-3" />
            <p className="font-semibold text-charcoal mb-1">Subscribe to see full details</p>
            <span className="inline-block mt-2 bg-hotpink-500 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors">
              View Plans
            </span>
          </div>
        </Link>
        {cardContent}
      </div>
    );
  }

  return (
    <Link href={`/games/${gameSlug}`} className="mahj-tile overflow-hidden flex flex-col hover:shadow-xl transition-shadow cursor-pointer">
      {cardContent}
    </Link>
  );
}
