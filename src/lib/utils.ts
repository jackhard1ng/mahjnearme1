import { US_STATES } from "@/lib/constants";
export function formatTime(time24: string): string {
  if (!time24 || !time24.includes(":")) return time24 || "";
  const [hours, minutes] = time24.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return time24;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getVerificationStatus(verified: boolean): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (verified) {
    return { label: "Verified", color: "text-hotpink-600", bgColor: "bg-hotpink-100 border-hotpink-300" };
  }
  return { label: "Unverified", color: "text-slate-500", bgColor: "bg-slate-100 border-slate-200" };
}

/**
 * Returns the number of days since a listing was last verified/updated.
 * Returns null if the date is missing or invalid.
 */
export function daysSinceVerified(lastVerified: string | null | undefined): number | null {
  if (!lastVerified || !/^\d{4}-\d{2}-\d{2}$/.test(lastVerified)) return null;
  const [y, m, d] = lastVerified.split("-").map(Number);
  const then = new Date(y, m - 1, d);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - then.getTime()) / 86_400_000);
}

/** Threshold (days) after which a recurring listing is considered stale. */
export const STALE_THRESHOLD_DAYS = 90;

export function getGameTypeColor(type: string): string {
  switch (type) {
    case "open_play": return "bg-openplay-light text-[#C4107A] border-openplay-border";
    case "lesson": return "bg-lesson-light text-[#0284C7] border-lesson-border";
    case "league": return "bg-league-light text-[#7C3AED] border-league-border";
    case "event": return "bg-event-light text-[#D97706] border-event-border";
    default: return "bg-openplay-light text-[#C4107A] border-openplay-border";
  }
}

export function getGameTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    open_play: "Open Play",
    lesson: "Lessons",
    league: "League",
    event: "Event",
    private: "Private",
  };
  return labels[type] || type;
}

export function getMapPinColor(type: string): string {
  switch (type) {
    case "open_play": return "#FF1493";
    case "lesson": return "#0EA5E9";
    case "league": return "#8B5CF6";
    case "event": return "#F59E0B";
    default: return "#94a3b8";
  }
}

export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getStateName(abbr: string): string {
  if (!abbr) return "";
  return US_STATES[abbr.toUpperCase()] || abbr;
}

export function getDayLabel(day: string): string {
  return capitalize(day) + "s";
}

/**
 * The individual days a schedule covers.
 *
 * `dayOfWeek` stores multiple days pipe-separated ("monday|wednesday|friday"),
 * so any code that treats the field as a single day silently drops every
 * multi-day listing. Use this anywhere the days are compared rather than shown.
 */
export function scheduleDays(dayOfWeek: string | null | undefined): string[] {
  return (dayOfWeek || "")
    .split("|")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Render a schedule's dayOfWeek for display.
 *
 * The field stores multiple days pipe-separated ("monday|wednesday|friday"),
 * which capitalize() alone renders as "Monday|wednesday|friday" — the raw
 * storage format, leaking onto the card.
 */
export function formatDayOfWeek(dayOfWeek: string): string {
  const days = (dayOfWeek || "")
    .split("|")
    .map((d) => d.trim())
    .filter(Boolean)
    .map(capitalize);
  if (days.length === 0) return "";
  if (days.length === 1) return days[0];
  if (days.length === 2) return `${days[0]} & ${days[1]}`;
  return `${days.slice(0, -1).join(", ")} & ${days[days.length - 1]}`;
}

export function formatSchedule(game: { isRecurring: boolean; recurringSchedule: { dayOfWeek: string; startTime: string; endTime: string; frequency: string } | null; eventDate: string | null; eventStartTime: string | null; eventEndTime: string | null }): string {
  if (game.isRecurring && game.recurringSchedule) {
    const { dayOfWeek, startTime, endTime, frequency } = game.recurringSchedule;
    const freqLabel = frequency === "weekly" ? "Every" : frequency === "biweekly" ? "Every other" : frequency === "monthly" ? "Monthly," : "";
    const dayStr = formatDayOfWeek(dayOfWeek);
    const timeStr = startTime && endTime
      ? `, ${formatTime(startTime)} - ${formatTime(endTime)}`
      : startTime
        ? `, ${formatTime(startTime)}`
        : "";
    return `${freqLabel} ${dayStr}${timeStr}`.trim();
  }
  if (game.eventDate) {
    // Parse as local date (not UTC) to avoid timezone offset showing wrong day
    const [year, month, day] = game.eventDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const dateStr = date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const timeStr = game.eventStartTime && game.eventEndTime
      ? `, ${formatTime(game.eventStartTime)} - ${formatTime(game.eventEndTime)}`
      : game.eventStartTime
        ? `, ${formatTime(game.eventStartTime)}`
        : "";
    return dateStr + timeStr;
  }
  return "Schedule TBD";
}

/**
 * Reduce a stored address to just the street part.
 *
 * Around 90% of listings were imported with the city, state and ZIP baked
 * into `address` ("410 15th Street, Oakland, CA 94612"). That matters beyond
 * tidiness: the event JSON-LD emits `streetAddress: game.address` next to
 * `addressLocality: game.city` and `addressRegion: game.state`, so the
 * structured data search engines read repeats the locality inside the street
 * field. For a directory that lives or dies on local search, malformed
 * PostalAddress markup is worth fixing at render time as well as in the data.
 *
 * Only trailing components that actually match the listing's own city or
 * state are removed, so an address is never truncated on a guess. Where the
 * stored value is nothing but the city and state ("San Antonio, TX"), there
 * is no street to keep and the result is empty — which is correct, since
 * `addressLocality` already carries it.
 */
export function streetAddressOnly(
  address: string | null | undefined,
  city: string,
  state: string
): string {
  let out = (address || "").trim();
  if (!out) return "";

  const cityNorm = (city || "").trim().toLowerCase();
  const stateNorm = (state || "").trim().toUpperCase();

  // Trailing ZIP, with or without the +4.
  out = out.replace(/[,\s]+\d{5}(?:-\d{4})?\s*$/, "").trim();

  // Trailing state, comma-separated or not ("…, CA" and "… Carlsbad CA").
  if (stateNorm) {
    out = out.replace(new RegExp(`[,\\s]+${stateNorm}\\s*$`, "i"), "").trim();
  }

  // Trailing city. At a comma this is always a separate component. At a bare
  // space it is only safe when the value actually starts with a street number
  // ("28981 Gosling Rd #300 Spring" -> "28981 Gosling Rd #300"); without that
  // test, a listing in Boston whose address reads "Greater Boston" would be
  // truncated to "Greater", since there the city name is part of one place
  // name rather than a locality appended to a street.
  if (cityNorm) {
    const escaped = cityNorm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`,\\s*${escaped}\\s*$`, "i"), "").trim();
    if (/^\d/.test(out)) {
      out = out.replace(new RegExp(`\\s+${escaped}\\s*$`, "i"), "").trim();
    }
  }

  out = out.replace(/[,\s]+$/, "").trim();

  // Nothing but the locality was stored — no street to report.
  if (!out || out.toLowerCase() === cityNorm) return "";
  return out;
}

/**
 * Turn a stored `website` value into a safe absolute URL, or null.
 *
 * A value with no scheme ("beachmahj.com") is a genuine bug once it reaches
 * an href: the browser resolves it relative to the current page, so the link
 * lands on mahjnearme.com/games/<slug>/beachmahj.com instead of the
 * organiser's site. 162 live listings are stored that way.
 *
 * The field is also sometimes filled with an Instagram handle
 * ("@thehausofmahj"). That is not a website and must not be linkified as one,
 * so it returns null and the caller falls through to the Instagram link.
 */
export function normalizeWebsiteUrl(raw: string | null | undefined): string | null {
  const v = (raw || "").trim();
  if (!v) return null;
  if (v.startsWith("@")) return null; // a handle, not a site
  if (/^https?:\/\//i.test(v)) return v;
  // Require something that at least looks like a hostname before prefixing.
  const m = v.match(/^[\w-]+(\.[\w-]+)+/);
  if (!m) return null;
  // ...and require the last label to be a real TLD. Without this, an Instagram
  // handle that happens to contain a dot is linkified as a domain: the live
  // data holds "allaboutmahj.bhm", "thismahjongmoment.chicago" and
  // "little.palmetto.mahjong" in website/registrationLink, each of which
  // became https://allaboutmahj.bhm and friends — links that resolve nowhere.
  // Returning null instead lets the caller fall through to the Instagram link,
  // which is what those values actually are. It also drops the one stored
  // value that is prose with a domain in front of it, "linktr.ee or similar".
  // Prose after a domain is not a URL: one stored registrationLink reads
  // "linktr.ee or similar", whose first token is a perfectly good hostname.
  if (/\s/.test(v)) return null;
  const tld = m[0].split(".").pop()!.toLowerCase();
  if (!KNOWN_TLDS.has(tld)) return null;
  return `https://${v}`;
}

/**
 * TLDs allowed by normalizeWebsiteUrl.
 *
 * Deliberately a list rather than a pattern: every plausible pattern also
 * matches an Instagram handle's last segment. Covers every TLD present in the
 * live data plus the common ones, and an unrecognised TLD fails safe — the
 * site simply does not render a website link for that listing.
 */
const KNOWN_TLDS = new Set([
  "com", "org", "net", "edu", "gov", "mil", "int", "info", "biz", "name",
  "co", "io", "ai", "app", "dev", "me", "tv", "cc", "ly", "gle", "gl", "se",
  // "ee" is Estonia, and it is here because linktr.ee is the single most
  // common link host in this dataset — 28 listings. Leaving it out silently
  // unlinked all of them.
  "ee",
  "us", "uk", "ca", "au", "nz", "de", "fr", "es", "it", "nl", "jp", "cn",
  "blog", "club", "site", "online", "store", "shop", "xyz", "fun", "life",
  "live", "page", "group", "team", "digital", "studio", "events", "email",
  "health", "care", "house", "world", "today", "space", "website", "wiki",
  "art", "design", "media", "network", "social", "community", "church",
  "center", "city", "cafe", "club",
]);

/**
 * Extract a bare Instagram handle (no @) from whatever ended up in the field,
 * or null when the value is not an Instagram reference at all.
 *
 * Callers previously built `instagram.com/${value.replace("@","")}`, which
 * works for "@handle" and "handle" but produces
 * instagram.com/https://www.instagram.com/foo/ when the field holds a full
 * URL, and instagram.com/mahjongscoring.org when it holds some other site.
 */
export function instagramHandle(raw: string | null | undefined): string | null {
  const v = (raw || "").trim();
  if (!v) return null;

  const urlMatch = v.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  if (urlMatch) {
    const handle = urlMatch[1];
    // /reel/, /p/ and /explore/ are content paths, not profiles.
    if (/^(reel|p|explore|stories)$/i.test(handle)) return null;
    return handle.replace(/\.$/, "");
  }

  // Any other URL or domain in this field is not an Instagram account.
  if (/^https?:\/\//i.test(v) || /\.(com|org|net|co|io|site|shop)\b/i.test(v)) return null;
  if (/\s/.test(v.replace(/^@/, ""))) return null; // free text like "Foo Mahjong FB"

  const handle = v.replace(/^@/, "").replace(/\/+$/, "");
  return /^[A-Za-z0-9._]+$/.test(handle) ? handle : null;
}

/** Full profile URL for a stored Instagram value, or null if it isn't one. */
export function instagramUrl(raw: string | null | undefined): string | null {
  const handle = instagramHandle(raw);
  return handle ? `https://instagram.com/${handle}` : null;
}

/**
 * The Instagram profile for a listing, looking beyond the `instagram` field.
 *
 * Six live listings hold an Instagram handle in `website` or
 * `registrationLink` and nothing in `instagram`: "allaboutmahj.bhm",
 * "thismahjongmoment.chicago", "little.palmetto.mahjong". Because those
 * contain dots they used to be linkified as domains, producing
 * https://allaboutmahj.bhm — a link to nowhere. Rejecting them as websites is
 * right, but on its own it would leave those listings with no link at all,
 * which is a worse page than the one with the broken link.
 *
 * All three are confirmed handles by the directory's own data: each appears
 * as an "@handle" in the `instagram` field of a sibling listing for the same
 * organiser. So a value that is not a usable website but is a well-formed
 * handle is treated as one.
 *
 * Only consulted when `instagram` itself is empty, so a real Instagram value
 * always wins.
 */
export function resolvedInstagramUrl(game: {
  instagram?: string | null;
  website?: string | null;
  registrationLink?: string | null;
}): string | null {
  const direct = instagramUrl(game.instagram);
  if (direct) return direct;
  for (const raw of [game.website, game.registrationLink]) {
    const v = (raw || "").trim();
    if (!v || normalizeWebsiteUrl(v)) continue; // a working website stays a website
    const url = instagramUrl(v);
    if (url) return url;
  }
  return null;
}

/**
 * Returns true if a one-time event's date is in the past.
 * Recurring events never expire via this check.
 */
export function isEventExpired(game: { isRecurring: boolean; eventDate: string | null }): boolean {
  if (game.isRecurring) return false;
  if (!game.eventDate) return false;
  const [year, month, day] = game.eventDate.split("-").map(Number);
  const eventDay = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDay < today;
}