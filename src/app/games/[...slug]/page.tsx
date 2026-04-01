"use client";

import { useParams, useRouter, notFound } from "next/navigation";
import Link from "next/link";
import { Game } from "@/types";
import { mockGames } from "@/lib/mock-data";
import {
  slugify,
  formatSchedule,
  formatTime,
  getGameTypeColor,
  getGameTypeLabel,
  getVerificationStatus,
  getStateName,
} from "@/lib/utils";
import { SKILL_LEVEL_COLORS, SKILL_LEVEL_LABELS } from "@/lib/constants";
import { SITE_NAME, SITE_URL, GAME_STYLE_LABELS } from "@/lib/constants";
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
  Facebook,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Navigation,
  Package,
  Info,
  AlertCircle,
  BookOpen,
  Briefcase,
  Lock,
  ArrowLeft,
  CalendarPlus,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGameSlug(game: Game): string {
  return slugify(`${game.city}-${game.state}`) + "/" + slugify(game.name);
}

function findGameBySlug(slug: string[]): Game | undefined {
  const joined = slug.join("/");
  // Try slug match first
  const bySlug = mockGames.find(
    (g) => g.status === "active" && getGameSlug(g) === joined
  );
  if (bySlug) return bySlug;

  // Fallback: try matching by game ID (last segment)
  const lastSegment = slug[slug.length - 1];
  if (lastSegment) {
    const byId = mockGames.find(
      (g) => g.status === "active" && g.id === lastSegment
    );
    if (byId) return byId;
  }

  // Fallback: try matching ID against full joined path
  return mockGames.find(
    (g) => g.status === "active" && g.id === joined
  );
}

function buildGoogleMapsUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

// ---------------------------------------------------------------------------
// JSON-LD Structured Data
// ---------------------------------------------------------------------------

function GameJsonLd({ game }: { game: Game }) {
  const schedule = formatSchedule(game);
  const cityState = `${game.city}, ${getStateName(game.state)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: game.name,
    description: game.description,
    organizer: {
      "@type": "Organization",
      name: game.organizerName,
    },
    location: {
      "@type": "Place",
      name: game.venueName,
      address: {
        "@type": "PostalAddress",
        streetAddress: game.address,
        addressLocality: game.city,
        addressRegion: game.state,
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: game.geopoint.lat,
        longitude: game.geopoint.lng,
      },
    },
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    isAccessibleForFree: game.costAmount === 0,
    ...(game.costAmount !== null &&
      game.costAmount > 0 && {
        offers: {
          "@type": "Offer",
          price: game.costAmount,
          priceCurrency: "USD",
        },
      }),
    ...(game.eventDate && {
      startDate: game.eventDate,
    }),
    ...(game.isRecurring &&
      game.recurringSchedule && {
        eventSchedule: {
          "@type": "Schedule",
          repeatFrequency:
            game.recurringSchedule.frequency === "weekly"
              ? "P1W"
              : game.recurringSchedule.frequency === "biweekly"
                ? "P2W"
                : "P1M",
          byDay: `https://schema.org/${game.recurringSchedule.dayOfWeek.charAt(0).toUpperCase() + game.recurringSchedule.dayOfWeek.slice(1)}`,
          startTime: game.recurringSchedule.startTime,
          endTime: game.recurringSchedule.endTime,
        },
      }),
    url: `${SITE_URL}/games/${getGameSlug(game)}`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// ---------------------------------------------------------------------------
// Sidebar CTA (uses auth context)
// ---------------------------------------------------------------------------

function SidebarCta() {
  const { user, hasAccess } = useAuth();

  if (user && hasAccess) return null;

  return (
    <div className="card-white p-6 text-center">
      <ShieldCheck className="w-10 h-10 text-hotpink-500 mx-auto mb-3" />
      <h3 className="font-semibold text-lg text-charcoal mb-2">
        {user ? "Subscribe to see full details" : "Sign up to unlock everything"}
      </h3>
      <p className="text-slate-500 text-sm mb-4">
        {user
          ? "Upgrade to access contact info, exact addresses, directions, and more."
          : "Create a free account, then subscribe to see contact info, exact addresses, directions, and more."}
      </p>
      <Link
        href="/pricing"
        className="inline-block w-full bg-gradient-to-r from-hotpink-500 to-hotpink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-hotpink-600 hover:to-hotpink-700 transition-all"
      >
        View Plans
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();

  // params.slug will be an array because of the catch-all [...slug], but
  // since the route is /games/[slug] with a single segment name, Next.js
  // actually delivers it as a string. We handle both cases.
  const rawSlug = params?.slug;
  const slugSegments: string[] = Array.isArray(rawSlug)
    ? rawSlug
    : typeof rawSlug === "string"
      ? rawSlug.split("/")
      : [];

  const foundGame = findGameBySlug(slugSegments);

  if (!foundGame) {
    notFound();
  }

  const game: Game = foundGame;

  const { user, hasAccess, loading, userProfile, updateUserProfile } = useAuth();

  // Derived values
  const verification = getVerificationStatus(game.verified);
  const typeColor = getGameTypeColor(game.type);
  const typeLabel = getGameTypeLabel(game.type);
  const schedule = formatSchedule(game);
  const cityState = `${game.city}, ${game.state}`;
  const fullStateName = getStateName(game.state);
  const citySlug = slugify(`${game.city}-${game.state}`);
  const canSeeDetails = user && hasAccess;
  const googleMapsUrl = buildGoogleMapsUrl(game.address);
  const isOnCalendar = (userProfile?.savedEvents || []).includes(game.id);

  function toggleCalendarEvent() {
    if (!userProfile || !user) return;
    const saved = userProfile.savedEvents || [];
    if (saved.includes(game.id)) {
      updateUserProfile({ savedEvents: saved.filter((id) => id !== game.id) });
    } else {
      updateUserProfile({ savedEvents: [...saved, game.id] });
    }
  }
  const gameStyleLabel = GAME_STYLE_LABELS[game.gameStyle] || game.gameStyle;

  // Set document title client-side
  if (typeof document !== "undefined") {
    document.title = `${game.name} | ${cityState} | ${SITE_NAME}`;
  }

  return (
    <>
      {/* JSON-LD Structured Data */}
      <GameJsonLd game={game} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-6 flex-wrap">
          <Link href="/" className="hover:text-hotpink-500 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link
            href="/search"
            className="hover:text-hotpink-500 transition-colors"
          >
            Cities
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link
            href={`/search?q=${encodeURIComponent(game.city)}`}
            className="hover:text-hotpink-500 transition-colors"
          >
            {game.city}, {game.state}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-charcoal font-medium truncate max-w-[200px]">
            {game.name}
          </span>
        </nav>

        {/* Back link */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-hotpink-500 hover:text-hotpink-600 font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ---------------------------------------------------------------- */}
          {/* Main Content Column                                              */}
          {/* ---------------------------------------------------------------- */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="mahj-tile overflow-hidden">
              <div className="p-6">
                {/* Badges row */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${typeColor}`}
                  >
                    {typeLabel}
                  </span>
                  {game.skillLevels.map((level) => (
                    <span
                      key={level}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SKILL_LEVEL_COLORS[level]}`}
                    >
                      {SKILL_LEVEL_LABELS[level]}
                    </span>
                  ))}
                  {game.dropInFriendly && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-skyblue-100 text-skyblue-600">
                      Drop-in Friendly
                    </span>
                  )}
                </div>

                {/* Game Name */}
                <h1 className="font-[family-name:var(--font-heading)] font-bold text-2xl sm:text-3xl text-charcoal mb-1">
                  {game.name}
                </h1>

                {/* Organizer */}
                {game.organizerName && (
                  <p className="text-slate-500 mb-3">
                    Organized by{" "}
                    <Link
                      href={`/search?q=${encodeURIComponent(game.organizerName)}`}
                      className="font-medium text-slate-700 hover:text-hotpink-500 transition-colors"
                    >
                      {game.organizerName}
                    </Link>
                  </p>
                )}

                {/* Game Style */}
                <p className="text-sm text-slate-500 mb-4">
                  Style:{" "}
                  <span className="font-medium text-slate-700">
                    {gameStyleLabel} Mahjong
                  </span>
                </p>

                {/* Verification badge (paid only) */}
                {canSeeDetails ? (
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${verification.bgColor}`}
                  >
                    <CheckCircle className={`w-4 h-4 ${verification.color}`} />
                    <span
                      className={`text-sm font-medium ${verification.color}`}
                    >
                      {verification.label}
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400">
                    <Lock className="w-4 h-4" />
                    <span className="text-sm font-medium">Verification status: upgrade to see</span>
                  </div>
                )}
              </div>
            </div>

            {/* Availability disclaimer */}
            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                <strong>Please note:</strong> Availability may change and some events may fill up.
                Contact the organizer directly to confirm details and reserve your spot before attending.
              </span>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* Listing Details: visible to all users                        */}
            {/* ------------------------------------------------------------ */}

            {/* Location: venue name & area visible, exact address gated */}
            <div className="mahj-tile p-6">
              <h2 className="font-semibold text-lg text-charcoal mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-hotpink-500" />
                Location
              </h2>
              <p className="font-medium text-charcoal">
                {game.venueName}
              </p>
              <p className="text-sm text-slate-500 mt-0.5">
                {game.generalArea} area
              </p>
              {canSeeDetails ? (
                <>
                  <p className="text-slate-600 mt-1">{game.address}</p>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 bg-hotpink-500 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-hotpink-600 transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    Get Directions
                  </a>
                </>
              ) : !loading ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>Exact address &amp; directions: <Link href="/pricing" className="font-medium text-hotpink-500 hover:text-hotpink-600">upgrade to see</Link></span>
                </div>
              ) : null}
            </div>

            {/* Schedule */}
            <div className="mahj-tile p-6">
              <h2 className="font-semibold text-lg text-charcoal mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-hotpink-500" />
                Schedule
              </h2>
              <p className="text-slate-700 font-medium">{schedule}</p>
              {game.isRecurring && game.recurringSchedule && (
                <p className="text-sm text-slate-500 mt-1">
                  {game.recurringSchedule.frequency === "weekly"
                    ? "Meets every week"
                    : game.recurringSchedule.frequency === "biweekly"
                      ? "Meets every other week"
                      : game.recurringSchedule.frequency === "monthly"
                        ? "Meets once a month"
                        : `Frequency: ${game.recurringSchedule.frequency}`}
                </p>
              )}
              {user && schedule !== "Schedule TBD" && (
                <button
                  onClick={toggleCalendarEvent}
                  className={`inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors border ${
                    isOnCalendar
                      ? "text-hotpink-600 bg-hotpink-50 border-hotpink-200 hover:bg-hotpink-100"
                      : "bg-skyblue-100 text-charcoal border-skyblue-200 hover:bg-skyblue-200"
                  }`}
                >
                  <CalendarPlus className="w-4 h-4" />
                  {isOnCalendar ? "Saved to My Calendar" : "Save to My Calendar"}
                </button>
              )}
            </div>

            {/* Cost & Group Size */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="mahj-tile p-6">
                <h2 className="font-semibold text-lg text-charcoal mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-hotpink-500" />
                  Cost
                </h2>
                <p className="text-2xl font-bold text-charcoal">
                  {game.cost}
                </p>
              </div>
              <div className="mahj-tile p-6">
                <h2 className="font-semibold text-lg text-charcoal mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-hotpink-500" />
                  Group Size
                </h2>
                <p className="text-2xl font-bold text-charcoal">
                  {game.typicalGroupSize || "Varies"}
                </p>
                {game.maxPlayers && (
                  <p className="text-sm text-slate-500 mt-1">
                    Max {game.maxPlayers} players
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mahj-tile p-6">
              <h2 className="font-semibold text-lg text-charcoal mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-hotpink-500" />
                About This Game
              </h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {game.description}
              </p>
            </div>

            {/* How to Join */}
            {game.howToJoin && (
              <div className="mahj-tile p-6">
                <h2 className="font-semibold text-lg text-charcoal mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-hotpink-500" />
                  How to Join
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  {game.howToJoin}
                </p>
                {game.registrationLink && canSeeDetails && (
                  <a
                    href={game.registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 text-hotpink-500 hover:text-hotpink-600 font-medium text-sm transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Register Online
                  </a>
                )}
                {game.registrationLink && !canSeeDetails && !loading && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Registration link: <Link href="/pricing" className="font-medium text-hotpink-500 hover:text-hotpink-600">upgrade to access</Link></span>
                  </div>
                )}
              </div>
            )}

            {/* What to Bring */}
            {game.whatToBring && (
              <div className="mahj-tile p-6">
                <h2 className="font-semibold text-lg text-charcoal mb-3 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-hotpink-500" />
                  What to Bring
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  {game.whatToBring}
                </p>
              </div>
            )}

            {/* ------------------------------------------------------------ */}
            {/* Contact Info: paywalled with inline blur                      */}
            {/* ------------------------------------------------------------ */}
            <div className="mahj-tile p-6">
              <h2 className="font-semibold text-lg text-charcoal mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-hotpink-500" />
                Contact Information
              </h2>
              {canSeeDetails ? (
                <div className="space-y-3">
                  {game.contactName && (
                    <p className="text-slate-700">
                      <span className="font-medium">Contact:</span>{" "}
                      {game.contactName}
                    </p>
                  )}
                  {game.contactEmail && (
                    <a
                      href={`mailto:${game.contactEmail}`}
                      className="flex items-center gap-2 text-hotpink-500 hover:text-hotpink-600 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      {game.contactEmail}
                    </a>
                  )}
                  {game.contactPhone && (
                    <a
                      href={`tel:${game.contactPhone}`}
                      className="flex items-center gap-2 text-hotpink-500 hover:text-hotpink-600 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      {game.contactPhone}
                    </a>
                  )}
                  {game.website && (
                    <a
                      href={game.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-hotpink-500 hover:text-hotpink-600 transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      {game.website}
                    </a>
                  )}
                  {game.instagram && (
                    <a
                      href={`https://instagram.com/${game.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-hotpink-500 hover:text-hotpink-600 transition-colors"
                    >
                      <Instagram className="w-4 h-4" />
                      {game.instagram}
                    </a>
                  )}
                  {game.facebookGroup && (
                    <a
                      href={game.facebookGroup}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-hotpink-500 hover:text-hotpink-600 transition-colors"
                    >
                      <Facebook className="w-4 h-4" />
                      Facebook Group
                    </a>
                  )}
                </div>
              ) : !loading ? (
                <div className="relative">
                  {/* Blurred placeholder rows */}
                  <div className="space-y-3 select-none pointer-events-none blur-[6px] opacity-50" aria-hidden="true">
                    <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-300" /><div className="h-4 bg-slate-200 rounded w-48" /></div>
                    <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-300" /><div className="h-4 bg-slate-200 rounded w-36" /></div>
                    <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-slate-300" /><div className="h-4 bg-slate-200 rounded w-52" /></div>
                    <div className="flex items-center gap-2"><Instagram className="w-4 h-4 text-slate-300" /><div className="h-4 bg-slate-200 rounded w-32" /></div>
                  </div>
                  {/* Inline upgrade prompt */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Link
                      href="/pricing"
                      className="flex items-center gap-2 bg-white/95 border border-hotpink-200 rounded-xl px-5 py-3 shadow-sm hover:shadow-md hover:border-hotpink-400 transition-all"
                    >
                      <Lock className="w-4 h-4 text-hotpink-500" />
                      <span className="text-sm font-medium text-charcoal">
                        Get the details. <span className="text-hotpink-500">Upgrade to join this game</span>
                      </span>
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Sets Provided */}
            <div className="mahj-tile p-6">
              <h2 className="font-semibold text-lg text-charcoal mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-hotpink-500" />
                Equipment
              </h2>
              {game.setsProvided ? (
                <div className="flex items-center gap-2 text-hotpink-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">
                    Mahjong sets are provided
                  </span>
                </div>
              ) : (
                <p className="text-slate-600">
                  Bring your own mahjong set
                </p>
              )}
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Sidebar                                                          */}
          {/* ---------------------------------------------------------------- */}
          <div className="space-y-6">
            {/* Quick Info Card */}
            <div className="mahj-tile p-6">
              <h2 className="font-semibold text-charcoal mb-4">
                Quick Info
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {game.generalArea}
                    </p>
                    <p className="text-xs text-slate-500">
                      {game.city}, {fullStateName}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-700">{schedule}</p>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-700">{game.cost}</p>
                </div>
                {game.typicalGroupSize && (
                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-700">
                      {game.typicalGroupSize}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Card (paid only) */}
            {canSeeDetails ? (
              <div
                className={`rounded-xl border p-4 ${verification.bgColor}`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className={`w-5 h-5 ${verification.color}`} />
                  <span
                    className={`text-sm font-medium ${verification.color}`}
                  >
                    {verification.label}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                <div className="flex items-center gap-2 text-slate-400">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Verification status: <Link href="/pricing" className="text-hotpink-500 hover:text-hotpink-600">upgrade</Link></span>
                </div>
              </div>
            )}

            {/* Signup/Upgrade CTA */}
            <SidebarCta />

            {/* Share (placeholder) */}
            <div className="mahj-tile p-6 text-center">
              <p className="text-sm font-medium text-slate-700 mb-2">
                Know someone who&apos;d love this game?
              </p>
              <button
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.share) {
                    navigator.share({
                      title: game.name,
                      text: `Check out ${game.name} on ${SITE_NAME}!`,
                      url: window.location.href,
                    });
                  } else if (typeof navigator !== "undefined") {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copied to clipboard!");
                  }
                }}
                className="text-sm text-hotpink-500 hover:text-hotpink-600 font-medium transition-colors"
              >
                Share this game
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* More from this organizer */}
      {(() => {
        if (!game.organizerName) return null;
        const otherGames = mockGames.filter(
          (g) =>
            g.id !== game.id &&
            g.status === "active" &&
            g.organizerName === game.organizerName
        );
        if (otherGames.length === 0) return null;
        return (
          <div className="max-w-5xl mx-auto px-4 pb-12">
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-xl text-charcoal mb-4">
              More from {game.organizerName}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {otherGames.slice(0, 6).map((g, i) => {
                // Free tier: first 2 show name, rest show teaser
                const showFull = hasAccess || i < 2;
                return (
                  <Link
                    key={g.id}
                    href={showFull ? `/games/${getGameSlug(g)}` : "/pricing"}
                    className="bg-white border border-slate-200 rounded-xl p-4 hover:border-hotpink-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getGameTypeColor(g.type)}`}>
                        {getGameTypeLabel(g.type)}
                      </span>
                      {g.dropInFriendly && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-skyblue-100 text-skyblue-600">
                          Drop-in
                        </span>
                      )}
                    </div>
                    {showFull ? (
                      <>
                        <h3 className="font-semibold text-sm text-charcoal group-hover:text-hotpink-500 transition-colors mb-1 line-clamp-2">
                          {g.name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {g.city}, {getStateName(g.state)}
                          {g.recurringSchedule?.dayOfWeek && (
                            <span className="ml-2">
                              &middot; {g.recurringSchedule.dayOfWeek.split("|").map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}s
                            </span>
                          )}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="h-4 w-40 bg-slate-200/80 rounded blur-[3px] mb-1" />
                        <p className="text-xs text-slate-500">
                          {g.city}, {getStateName(g.state)}
                          {g.recurringSchedule?.dayOfWeek && (
                            <span className="ml-2">
                              &middot; {g.recurringSchedule.dayOfWeek.split("|").map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}s
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-hotpink-500 font-medium mt-1">Subscribe to see details</p>
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })()}
    </>
  );
}
