/**
 * Server-side Firestore data access for listings.
 * Used by server components and API routes.
 * Falls back to the static JSON file if Firestore is unavailable.
 */

import { Game } from "@/types";
import { findMetroForCity } from "@/lib/metro-regions";

// In-memory cache with TTL (5 minutes)
let _cache: Game[] | null = null;
let _cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

function isCacheValid(): boolean {
  return _cache !== null && Date.now() - _cacheTime < CACHE_TTL;
}

/**
 * Convert a Firestore listing document to a Game object.
 * Ensures all required fields have defaults.
 */
function docToGame(data: Record<string, unknown>, id: string): Game {
  const cityName = (data.city as string) || "";
  let metroRegion = data.metroRegion as string | null;
  if (!metroRegion && cityName) {
    const metro = findMetroForCity(cityName);
    metroRegion = metro?.abbreviation || null;
  }

  return {
    id,
    name: (data.name as string) || "Untitled Game",
    organizerName: (data.organizerName as string) || (data.contactName as string) || "",
    organizerId: (data.organizerId as string) || null,
    type: (data.type as Game["type"]) || "open_play",
    gameStyle: (data.gameStyle as Game["gameStyle"]) || "american",
    city: cityName,
    state: (data.state as string) || "",
    generalArea: (data.generalArea as string) || "",
    venueName: (data.venueName as string) || "",
    address: (data.address as string) || "",
    geopoint: (data.geopoint as Game["geopoint"]) || { lat: 0, lng: 0 },
    metroRegion,
    isRecurring: (data.isRecurring as boolean) ?? false,
    recurringSchedule: (data.recurringSchedule as Game["recurringSchedule"]) || null,
    eventDate: (data.eventDate as string) || null,
    eventStartTime: (data.eventStartTime as string) || null,
    eventEndTime: (data.eventEndTime as string) || null,
    cost: (data.cost as string) || "Contact for price",
    costAmount: (data.costAmount as number) ?? null,
    contactName: (data.contactName as string) || "",
    contactEmail: (data.contactEmail as string) || "",
    contactPhone: (data.contactPhone as string) || "",
    website: (data.website as string) || "",
    instagram: (data.instagram as string) || "",
    facebookGroup: (data.facebookGroup as string) || "",
    registrationLink: (data.registrationLink as string) || "",
    description: (data.description as string) || "",
    howToJoin: (data.howToJoin as string) || "",
    whatToBring: (data.whatToBring as string) || "",
    skillLevels: (data.skillLevels as Game["skillLevels"]) || ["beginner", "intermediate"],
    dropInFriendly: (data.dropInFriendly as boolean) ?? false,
    setsProvided: (data.setsProvided as boolean) ?? false,
    maxPlayers: (data.maxPlayers as number) ?? null,
    typicalGroupSize: (data.typicalGroupSize as string) || "",
    imageUrl: (data.imageUrl as string) || "",
    goingCount: (data.goingCount as number) ?? 0,
    beenHereCount: (data.beenHereCount as number) ?? 0,
    headsUpCount: (data.headsUpCount as number) ?? 0,
    status: (data.status as Game["status"]) || "active",
    verified: (data.verified as boolean) ?? true,
    claimedBy: (data.claimedBy as string) || null,
    source: (data.source as Game["source"]) || "csv_import",
    promoted: (data.promoted as boolean) ?? false,
    isDestinationEvent: (data.isDestinationEvent as boolean) ?? false,
    organizerEdited: (data.organizerEdited as boolean) ?? false,
    lastVerified: (data.lastVerified as string) || "",
    createdAt: (data.createdAt as string) || "",
    updatedAt: (data.updatedAt as string) || "",
  };
}

/**
 * Fetch all listings from Firestore. Falls back to static JSON.
 * Results are cached in memory for 5 minutes.
 */
export async function getListingsServer(): Promise<Game[]> {
  if (isCacheValid()) return _cache!;

  try {
    const { getAdminDb } = await import("@/lib/firebase-admin");
    const db = getAdminDb();
    const snap = await db.collection("listings").get();

    if (snap.empty) {
      // Firestore is empty - fall back to JSON
      console.log("[listings-firestore] Firestore empty, falling back to JSON");
      return getFallbackListings();
    }

    _cache = snap.docs.map((doc) => docToGame(doc.data(), doc.id));
    _cacheTime = Date.now();
    return _cache;
  } catch (err) {
    console.error("[listings-firestore] Firestore error, falling back to JSON:", err);
    return getFallbackListings();
  }
}

/**
 * Fallback: load from static JSON file.
 */
function getFallbackListings(): Game[] {
  const { loadListings } = require("@/lib/listings-data");
  _cache = loadListings();
  _cacheTime = Date.now();
  return _cache!;
}

/** Clear the server-side cache (useful after imports). */
export function clearListingsCache(): void {
  _cache = null;
  _cacheTime = 0;
}

// --- Helper functions matching the mock-data API ---

export async function getGamesByStateServer(state: string): Promise<Game[]> {
  const games = await getListingsServer();
  return games.filter(
    (g) => g.state.toUpperCase() === state.toUpperCase() && g.status === "active"
  );
}

export async function getGamesByCityServer(city: string, state: string): Promise<Game[]> {
  const games = await getListingsServer();
  return games.filter(
    (g) =>
      g.city.toLowerCase() === city.toLowerCase() &&
      g.state.toUpperCase() === state.toUpperCase() &&
      g.status === "active"
  );
}

export async function getCitiesWithGamesServer(): Promise<
  { city: string; state: string; count: number }[]
> {
  const { isEventExpired } = require("@/lib/utils");
  const games = await getListingsServer();
  const map = new Map<string, { city: string; state: string; count: number }>();
  for (const g of games) {
    if (g.status !== "active" || isEventExpired(g)) continue;
    const key = `${g.city}|${g.state}`;
    const entry = map.get(key);
    if (entry) entry.count++;
    else map.set(key, { city: g.city, state: g.state, count: 1 });
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export async function getStatesWithGamesServer(): Promise<
  { state: string; stateName: string; count: number; gameCount: number; cityCount: number }[]
> {
  const { isEventExpired } = require("@/lib/utils");
  const { US_STATES } = require("@/lib/constants");
  const games = await getListingsServer();
  const stateMap = new Map<string, { cities: Set<string>; count: number }>();
  for (const g of games) {
    if (g.status !== "active" || isEventExpired(g)) continue;
    const entry = stateMap.get(g.state) || { cities: new Set<string>(), count: 0 };
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

export { docToGame };
