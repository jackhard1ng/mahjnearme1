/**
 * Loads and normalizes the real listings data from /public/listings.json.
 * This replaces mock-data.ts as the primary data source.
 *
 * Handles all the messy real-world data: inconsistent type names,
 * mixed-case values, freeform frequencies, etc.
 */

import { Game, GameType, GameStyle, SkillLevel, Frequency } from "@/types";
import { findMetroForCity } from "@/lib/metro-regions";
import { US_STATES } from "@/lib/constants";

// --- Raw JSON shape ---

interface RawListing {
  id: string;
  name: string;
  type: string | null;
  gameStyle: string | null;
  city: string;
  state: string;
  generalArea: string | null;
  venueName: string | null;
  address: string | null;
  isRecurring: boolean | null;
  dayOfWeek: string | null;
  startTime: string | null;
  endTime: string | null;
  frequency: string | null;
  eventDate: string | null;
  cost: string | null;
  costAmount: number | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  instagram: string | null;
  facebookGroup: string | null;
  registrationLink: string | null;
  description: string | null;
  howToJoin: string | null;
  whatToBring: string | null;
  skillLevels: string | null;
  dropInFriendly: boolean | null;
  setsProvided: boolean | null;
  typicalGroupSize: string | null;
  source: string | null;
  sourceURL: string | null;
  lastVerified: string | null;
  notes: string | null;
  dataSource: string | null;
  stateFile: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface ListingsJSON {
  metadata: { totalListings: number; stateCount: number };
  listings: RawListing[];
}

// --- Normalization maps ---

function normalizeGameType(raw: string | null): GameType {
  if (!raw) return "open_play";
  const lower = raw.toLowerCase().trim();
  if (lower.includes("lesson") || lower === "class" || lower === "instructor" || lower === "instructor_group" || lower === "instructor_with_studio") return "lesson";
  if (lower.includes("league")) return "league";
  if (lower.includes("tournament") || lower === "event") return "event";
  if (lower.includes("open_play") || lower === "openplay") return "open_play";
  // Map community-ish types to open_play
  if (["community_group", "club", "social", "jcc", "library", "senior_center",
       "community_center", "religious_organization", "home_game", "dedicated_venue",
       "senior_living", "social group / community hub"].includes(lower)) return "open_play";
  // Compound types: take the first meaningful one
  if (lower.includes("|")) {
    const first = lower.split("|")[0].trim();
    return normalizeGameType(first);
  }
  if (lower.includes(",")) {
    const first = lower.split(",")[0].trim();
    return normalizeGameType(first);
  }
  return "open_play";
}

function normalizeGameStyle(raw: string | null): GameStyle {
  if (!raw) return "american";
  const lower = raw.toLowerCase().trim();
  if (lower.startsWith("american") || lower === "american (nmjl)") return "american";
  if (lower === "riichi") return "riichi";
  if (lower === "chinese" || lower === "hong_kong") return "chinese";
  if (lower === "other" || lower === "mixed") return "other";
  // Compound: take the first
  if (lower.includes("|")) {
    const first = lower.split("|")[0].trim();
    return normalizeGameStyle(first);
  }
  return "american";
}

function normalizeFrequency(raw: string | null): Frequency {
  if (!raw) return "weekly";
  const lower = raw.toLowerCase().trim();
  if (lower === "weekly" || lower.startsWith("weekly") || lower.includes("weekly")) return "weekly";
  if (lower === "biweekly" || lower === "bi-weekly" || lower.includes("biweekly")) return "biweekly";
  if (lower === "monthly" || lower.includes("monthly")) return "monthly";
  return "weekly"; // default
}

/**
 * Normalize dayOfWeek to pipe-separated lowercase day names.
 * "Monday, Thursday" → "monday|thursday"
 * "Thursday" → "thursday"
 * "wednesday|friday" → stays as-is
 * "Multiple" / "varies" / null → ""
 */
function normalizeDayOfWeek(raw: string | null): string {
  if (!raw) return "";
  const lower = raw.toLowerCase().trim();
  if (lower === "multiple" || lower === "varies" || lower === "unknown") return "";

  // Already pipe-separated?
  if (lower.includes("|")) return lower;

  // Comma-separated?
  if (lower.includes(",")) {
    return lower.split(",").map((d) => d.trim()).filter(isValidDay).join("|");
  }

  // Single day
  if (isValidDay(lower)) return lower;

  return "";
}

const VALID_DAYS = new Set(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]);
function isValidDay(s: string): boolean {
  return VALID_DAYS.has(s.trim());
}

function normalizeSkillLevels(raw: string | null): SkillLevel[] {
  if (!raw) return ["beginner", "intermediate"];
  const lower = raw.toLowerCase();
  const levels: SkillLevel[] = [];
  if (lower.includes("beginner")) levels.push("beginner");
  if (lower.includes("intermediate")) levels.push("intermediate");
  if (lower.includes("advanced")) levels.push("advanced");
  return levels.length > 0 ? levels : ["beginner", "intermediate"];
}

function normalizeTime(raw: string | null): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  // Already in 24h HH:MM format
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) return trimmed.padStart(5, "0");
  // Any string containing "unknown", "varies", "contact", "TBD", etc.
  const lower = trimmed.toLowerCase();
  if (lower.includes("unknown") || lower.includes("varies") || lower.includes("contact") || lower.includes("tbd") || lower.includes("tba")) return "";
  // 12-hour format: "6:15 PM", "1:00 AM", "12:30 PM"
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1]);
    const minutes = ampmMatch[2];
    const period = ampmMatch[3].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }
  // If it still looks like a time (digits and colon), extract it
  if (/^\d{1,2}:\d{2}/.test(trimmed)) return trimmed.slice(0, 5).padStart(5, "0");
  return "";
}

function str(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

/** Check if a string is a valid YYYY-MM-DD date. */
function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/** Reverse lookup: full state name → abbreviation. */
const STATE_NAME_TO_ABBR: Record<string, string> = {};
for (const [abbr, name] of Object.entries(US_STATES)) {
  STATE_NAME_TO_ABBR[name.toLowerCase()] = abbr;
}

/**
 * Normalize state to a 2-letter abbreviation.
 * "Texas" → "TX", "TX" → "TX", "california" → "CA"
 */
function normalizeState(raw: string): string {
  const trimmed = raw.trim();
  // Already a 2-letter abbreviation?
  const upper = trimmed.toUpperCase();
  if (upper.length === 2 && US_STATES[upper]) return upper;
  // Full name?
  const abbr = STATE_NAME_TO_ABBR[trimmed.toLowerCase()];
  if (abbr) return abbr;
  // Unknown — return uppercase as-is
  return upper;
}

// --- Convert a raw listing to a Game ---

function rawToGame(raw: RawListing): Game {
  const dayOfWeek = normalizeDayOfWeek(raw.dayOfWeek);
  const isRecurring = raw.isRecurring === true || (raw.isRecurring === null && !!dayOfWeek);
  const startTime = normalizeTime(raw.startTime);
  const endTime = normalizeTime(raw.endTime);
  const stateAbbr = normalizeState(str(raw.state));

  const cityName = str(raw.city);
  const metro = cityName ? findMetroForCity(cityName) : null;

  return {
    id: raw.id || `listing-${Math.random().toString(36).slice(2, 10)}`,
    name: str(raw.name) || "Untitled Game",
    organizerName: str(raw.contactName) || "",
    organizerId: null,
    type: normalizeGameType(raw.type),
    gameStyle: normalizeGameStyle(raw.gameStyle),
    city: cityName,
    state: stateAbbr,
    generalArea: str(raw.generalArea),
    venueName: str(raw.venueName),
    address: str(raw.address),
    geopoint: {
      lat: raw.latitude ? Number(raw.latitude) : 0,
      lng: raw.longitude ? Number(raw.longitude) : 0,
    },
    metroRegion: metro?.abbreviation || null,
    isRecurring,
    recurringSchedule: isRecurring
      ? {
          dayOfWeek: dayOfWeek || "",
          startTime,
          endTime,
          frequency: normalizeFrequency(raw.frequency),
        }
      : null,
    eventDate: raw.eventDate && isValidDate(raw.eventDate) ? raw.eventDate : null,
    eventStartTime: !isRecurring ? startTime || null : null,
    eventEndTime: !isRecurring ? endTime || null : null,
    cost: str(raw.cost) || "Contact for price",
    costAmount: raw.costAmount ?? null,
    contactName: str(raw.contactName),
    contactEmail: str(raw.contactEmail),
    contactPhone: str(raw.contactPhone),
    website: str(raw.website),
    instagram: str(raw.instagram),
    facebookGroup: str(raw.facebookGroup),
    registrationLink: str(raw.registrationLink),
    description: str(raw.description),
    howToJoin: str(raw.howToJoin),
    whatToBring: str(raw.whatToBring),
    skillLevels: normalizeSkillLevels(raw.skillLevels),
    dropInFriendly: raw.dropInFriendly === true,
    setsProvided: raw.setsProvided === true,
    maxPlayers: null,
    typicalGroupSize: str(raw.typicalGroupSize),
    imageUrl: "",
    goingCount: 0,
    beenHereCount: 0,
    headsUpCount: 0,
    status: "active",
    verified: true,
    claimedBy: null,
    source: "csv_import",
    promoted: false,
    organizerEdited: false,
    lastVerified: isValidDate(str(raw.lastVerified)) ? str(raw.lastVerified) : "2026-03-24",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-03-24T00:00:00Z",
  };
}

// --- Load and cache ---

let _cachedGames: Game[] | null = null;
let _cachedRawData: ListingsJSON | null = null;

function loadRawData(): ListingsJSON {
  if (_cachedRawData) return _cachedRawData;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  _cachedRawData = require("../../public/listings.json") as ListingsJSON;
  return _cachedRawData;
}

/**
 * Load all games from listings.json, normalized to the Game interface.
 * Results are cached after first load.
 */
export function loadListings(): Game[] {
  if (_cachedGames) return _cachedGames;
  const data = loadRawData();
  _cachedGames = data.listings.map(rawToGame);
  return _cachedGames;
}

/** Get the total listing count from metadata. */
export function getListingCount(): number {
  return loadRawData().metadata.totalListings;
}

/** Get the state count from metadata. */
export function getStateCount(): number {
  return loadRawData().metadata.stateCount;
}

// --- Helper exports matching mock-data.ts API ---

export function getGamesByCity(city: string, state: string): Game[] {
  return loadListings().filter(
    (g) => g.city.toLowerCase() === city.toLowerCase() && g.state.toUpperCase() === state.toUpperCase() && g.status === "active"
  );
}

export function getGamesByState(state: string): Game[] {
  return loadListings().filter((g) => g.state.toUpperCase() === state.toUpperCase() && g.status === "active");
}

export function getCitiesWithGames(): { city: string; state: string; count: number }[] {
  const { isEventExpired } = require("@/lib/utils");
  const map = new Map<string, { city: string; state: string; count: number }>();
  for (const g of loadListings()) {
    if (g.status !== "active" || isEventExpired(g)) continue;
    const key = `${g.city}|${g.state}`;
    const entry = map.get(key);
    if (entry) entry.count++;
    else map.set(key, { city: g.city, state: g.state, count: 1 });
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export function getStatesWithGames(): { state: string; stateName: string; count: number; gameCount: number; cityCount: number }[] {
  const { isEventExpired } = require("@/lib/utils");
  const { US_STATES } = require("@/lib/constants");
  const stateMap = new Map<string, { cities: Set<string>; count: number }>();
  for (const g of loadListings()) {
    if (g.status !== "active" || isEventExpired(g)) continue;
    const entry = stateMap.get(g.state) || { cities: new Set(), count: 0 };
    entry.cities.add(g.city);
    entry.count++;
    stateMap.set(g.state, entry);
  }
  return [...stateMap.entries()]
    .map(([state, { cities, count }]) => ({
      state,
      stateName: US_STATES[state] || state,
      count,
      gameCount: count,
      cityCount: cities.size,
    }))
    .sort((a, b) => b.count - a.count);
}
