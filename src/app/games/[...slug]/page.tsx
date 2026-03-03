"use client";

import { useParams, notFound } from "next/navigation";
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
  BookOpen,
  Briefcase,
  Lock,
  ArrowLeft,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGameSlug(game: Game): string {
  return slugify(`${game.city}-${game.state}`) + "/" + slugify(game.name);
}

function findGameBySlug(slug: string[]): Game | undefined {
  const joined = slug.join("/");
  return mockGames.find(
    (g) => g.status === "active" && getGameSlug(g) === joined
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
    <div className="mahj-tile p-6 text-center bg-gradient-to-br from-ivory-50 via-jade-50 to-ivory-100">
      <ShieldCheck className="w-10 h-10 text-jade-600 mx-auto mb-3" />
      <h3 className="font-semibold text-lg text-slate-800 mb-2">
        {user ? "Upgrade to see full details" : "Sign up to unlock everything"}
      </h3>
      <p className="text-slate-500 text-sm mb-4">
        {user
          ? "Your trial may have expired. Subscribe to access contact info, directions, and more."
          : "Start your free 14-day trial to see contact info, exact addresses, directions, and more."}
      </p>
      <Link
        href={user ? "/pricing" : "/signup"}
        className="inline-block w-full bg-gradient-to-r from-jade-600 to-jade-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-jade-700 hover:to-jade-800 transition-all"
      >
        {user ? "See Plans" : "Start Free Trial"}
      </Link>
      {!user && (
        <p className="text-xs text-slate-400 mt-2">
          Credit card required &middot; Cancel anytime
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Blurred Overlay
// ---------------------------------------------------------------------------

function BlurredOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-ivory-100/70 backdrop-blur-sm rounded-xl">
      <div className="text-center px-8">
        <Lock className="w-10 h-10 text-jade-600 mx-auto mb-3" />
        <p className="font-semibold text-slate-800 text-lg mb-1">
          Sign up to see full details
        </p>
        <p className="text-sm text-slate-500 mb-4">
          Contact info, exact address, directions, and more
        </p>
        <Link
          href="/signup"
          className="inline-block bg-jade-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-jade-700 transition-colors"
        >
          Start Free 14-Day Trial
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function GameDetailPage() {
  const params = useParams();

  // params.slug will be an array because of the catch-all [...slug] — but
  // since the route is /games/[slug] with a single segment name, Next.js
  // actually delivers it as a string. We handle both cases.
  const rawSlug = params?.slug;
  const slugSegments: string[] = Array.isArray(rawSlug)
    ? rawSlug
    : typeof rawSlug === "string"
      ? rawSlug.split("/")
      : [];

  const game = findGameBySlug(slugSegments);

  if (!game) {
    notFound();
  }

  const { user, hasAccess, loading } = useAuth();

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
  const gameStyleLabel = GAME_STYLE_LABELS[game.gameStyle] || game.gameStyle;

  // Set document title client-side
  if (typeof document !== "undefined") {
    document.title = `${game.name} — ${cityState} | ${SITE_NAME}`;
  }

  return (
    <>
      {/* JSON-LD Structured Data */}
      <GameJsonLd game={game} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-6 flex-wrap">
          <Link href="/" className="hover:text-jade-600 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link
            href="/search"
            className="hover:text-jade-600 transition-colors"
          >
            Cities
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link
            href={`/search?q=${encodeURIComponent(game.city)}`}
            className="hover:text-jade-600 transition-colors"
          >
            {game.city}, {game.state}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-800 font-medium truncate max-w-[200px]">
            {game.name}
          </span>
        </nav>

        {/* Back link */}
        <Link
          href={`/search?q=${encodeURIComponent(game.city)}`}
          className="inline-flex items-center gap-1.5 text-sm text-jade-600 hover:text-jade-700 font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {game.city} games
        </Link>

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
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                      Drop-in Friendly
                    </span>
                  )}
                </div>

                {/* Game Name */}
                <h1 className="font-[family-name:var(--font-heading)] font-bold text-2xl sm:text-3xl text-slate-900 mb-1">
                  {game.name}
                </h1>

                {/* Organizer */}
                <p className="text-slate-500 mb-3">
                  Organized by{" "}
                  <span className="font-medium text-slate-700">
                    {game.organizerName}
                  </span>
                </p>

                {/* Game Style */}
                <p className="text-sm text-slate-500 mb-4">
                  Style:{" "}
                  <span className="font-medium text-slate-700">
                    {gameStyleLabel} Mahjong
                  </span>
                </p>

                {/* Verification badge */}
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
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* Gated Content: Details below are blurred for non-auth users   */}
            {/* ------------------------------------------------------------ */}
            <div className="relative">
              {!canSeeDetails && !loading && <BlurredOverlay />}

              <div className={!canSeeDetails && !loading ? "content-blur" : ""}>
                {/* Location & Directions */}
                <div className="mahj-tile p-6 mb-6">
                  <h2 className="font-semibold text-lg text-slate-800 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-jade-600" />
                    Location
                  </h2>
                  <p className="font-medium text-slate-800">
                    {game.venueName}
                  </p>
                  <p className="text-slate-600 mt-1">{game.address}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {game.generalArea} area
                  </p>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 bg-jade-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-jade-700 transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    Get Directions
                  </a>
                </div>

                {/* Schedule */}
                <div className="mahj-tile p-6 mb-6">
                  <h2 className="font-semibold text-lg text-slate-800 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-jade-600" />
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
                </div>

                {/* Cost & Group Size */}
                <div className="grid sm:grid-cols-2 gap-6 mb-6">
                  <div className="mahj-tile p-6">
                    <h2 className="font-semibold text-lg text-slate-800 mb-3 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-jade-600" />
                      Cost
                    </h2>
                    <p className="text-2xl font-bold text-slate-900">
                      {game.cost}
                    </p>
                  </div>
                  <div className="mahj-tile p-6">
                    <h2 className="font-semibold text-lg text-slate-800 mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5 text-jade-600" />
                      Group Size
                    </h2>
                    <p className="text-2xl font-bold text-slate-900">
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
                <div className="mahj-tile p-6 mb-6">
                  <h2 className="font-semibold text-lg text-slate-800 mb-3 flex items-center gap-2">
                    <Info className="w-5 h-5 text-jade-600" />
                    About This Game
                  </h2>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                    {game.description}
                  </p>
                </div>

                {/* How to Join */}
                {game.howToJoin && (
                  <div className="mahj-tile p-6 mb-6">
                    <h2 className="font-semibold text-lg text-slate-800 mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-jade-600" />
                      How to Join
                    </h2>
                    <p className="text-slate-600 leading-relaxed">
                      {game.howToJoin}
                    </p>
                    {game.registrationLink && (
                      <a
                        href={game.registrationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-4 text-jade-600 hover:text-jade-700 font-medium text-sm transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Register Online
                      </a>
                    )}
                  </div>
                )}

                {/* What to Bring */}
                {game.whatToBring && (
                  <div className="mahj-tile p-6 mb-6">
                    <h2 className="font-semibold text-lg text-slate-800 mb-3 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-jade-600" />
                      What to Bring
                    </h2>
                    <p className="text-slate-600 leading-relaxed">
                      {game.whatToBring}
                    </p>
                  </div>
                )}

                {/* Contact Info */}
                <div className="mahj-tile p-6 mb-6">
                  <h2 className="font-semibold text-lg text-slate-800 mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-jade-600" />
                    Contact Information
                  </h2>
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
                        className="flex items-center gap-2 text-jade-600 hover:text-jade-700 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        {game.contactEmail}
                      </a>
                    )}
                    {game.contactPhone && (
                      <a
                        href={`tel:${game.contactPhone}`}
                        className="flex items-center gap-2 text-jade-600 hover:text-jade-700 transition-colors"
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
                        className="flex items-center gap-2 text-jade-600 hover:text-jade-700 transition-colors"
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
                        className="flex items-center gap-2 text-jade-600 hover:text-jade-700 transition-colors"
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
                        className="flex items-center gap-2 text-jade-600 hover:text-jade-700 transition-colors"
                      >
                        <Facebook className="w-4 h-4" />
                        Facebook Group
                      </a>
                    )}
                  </div>
                </div>

                {/* Sets Provided */}
                <div className="mahj-tile p-6">
                  <h2 className="font-semibold text-lg text-slate-800 mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-jade-600" />
                    Equipment
                  </h2>
                  {game.setsProvided ? (
                    <div className="flex items-center gap-2 text-green-700">
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
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Sidebar                                                          */}
          {/* ---------------------------------------------------------------- */}
          <div className="space-y-6">
            {/* Quick Info Card (always visible) */}
            <div className="mahj-tile p-6">
              <h2 className="font-semibold text-slate-800 mb-4">
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

            {/* Verification Card (always visible) */}
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
                className="text-sm text-jade-600 hover:text-jade-700 font-medium transition-colors"
              >
                Share this game
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
