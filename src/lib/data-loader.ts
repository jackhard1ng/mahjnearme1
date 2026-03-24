/**
 * State-level XLSX data loader.
 *
 * Reads 50 state .xlsx files from /data/states/ directory and merges all
 * listings into a single searchable dataset. Each file has the same schema
 * (34 columns) with two tabs: "MahjNearMe Listings" and "Notes & Verification".
 *
 * This module is designed for build-time / server-side use (API routes, getStaticProps, etc.).
 * For client-side, the mock-data.ts continues to serve as the runtime data source
 * until a full database migration is complete.
 */

import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import { Game, GameType, GameStyle, SkillLevel } from "@/types";
import { findMetroForCity } from "@/lib/metro-regions";
import { geocodeAddress } from "@/lib/geocode";
import { US_STATES } from "@/lib/constants";

const DATA_DIR = path.join(process.cwd(), "data", "states");
const LISTINGS_TAB = "MahjNearMe Listings";

/** Map of full state name → abbreviation for reverse lookup. */
const STATE_NAME_TO_ABBR: Record<string, string> = {};
for (const [abbr, name] of Object.entries(US_STATES)) {
  STATE_NAME_TO_ABBR[name.toLowerCase()] = abbr;
}

/**
 * Column mapping: XLSX header name → Game field.
 * Adjust these if your spreadsheet headers differ.
 */
const COL = {
  name: "name",
  organizerName: "organizerName",
  type: "type",
  gameStyle: "gameStyle",
  city: "city",
  state: "state",
  generalArea: "generalArea",
  venueName: "venueName",
  address: "address",
  latitude: "latitude",
  longitude: "longitude",
  isRecurring: "isRecurring",
  dayOfWeek: "dayOfWeek",
  startTime: "startTime",
  endTime: "endTime",
  frequency: "frequency",
  eventDate: "eventDate",
  eventStartTime: "eventStartTime",
  eventEndTime: "eventEndTime",
  cost: "cost",
  costAmount: "costAmount",
  contactName: "contactName",
  contactEmail: "contactEmail",
  contactPhone: "contactPhone",
  website: "website",
  instagram: "instagram",
  facebookGroup: "facebookGroup",
  registrationLink: "registrationLink",
  description: "description",
  howToJoin: "howToJoin",
  whatToBring: "whatToBring",
  skillLevels: "skillLevels",
  dropInFriendly: "dropInFriendly",
  setsProvided: "setsProvided",
  maxPlayers: "maxPlayers",
  typicalGroupSize: "typicalGroupSize",
  imageUrl: "imageUrl",
  status: "status",
  verified: "verified",
  promoted: "promoted",
  lastVerified: "lastVerified",
} as const;

function str(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

function bool(val: unknown): boolean {
  const s = str(val).toLowerCase();
  return s === "true" || s === "1" || s === "yes";
}

function stateAbbrFromFileName(fileName: string): string {
  // fileName like "Texas.xlsx" → lookup abbreviation
  const baseName = fileName.replace(/\.xlsx$/i, "");
  return STATE_NAME_TO_ABBR[baseName.toLowerCase()] || baseName.toUpperCase().slice(0, 2);
}

/**
 * Parse a single row from the XLSX sheet into a Game object.
 */
function rowToGame(
  row: Record<string, unknown>,
  index: number,
  fileStateAbbr: string
): Game {
  const stateVal = str(row[COL.state]) || fileStateAbbr;
  const cityVal = str(row[COL.city]);
  const metro = findMetroForCity(cityVal);

  const lat = parseFloat(str(row[COL.latitude])) || 0;
  const lng = parseFloat(str(row[COL.longitude])) || 0;

  const skillLevelsRaw = str(row[COL.skillLevels]);
  const skillLevels: SkillLevel[] = skillLevelsRaw
    ? (skillLevelsRaw.split("|").map((s) => s.trim()).filter((s) =>
        ["beginner", "intermediate", "advanced"].includes(s)
      ) as SkillLevel[])
    : ["beginner", "intermediate"];

  const dayOfWeek = str(row[COL.dayOfWeek]);
  const hasRecurring = bool(row[COL.isRecurring]) || !!dayOfWeek;

  return {
    id: `state-${fileStateAbbr.toLowerCase()}-${index}`,
    name: str(row[COL.name]) || "Untitled Game",
    organizerName: str(row[COL.organizerName]),
    organizerId: null,
    type: (str(row[COL.type]) as GameType) || "open_play",
    gameStyle: (str(row[COL.gameStyle]) as GameStyle) || "american",
    city: cityVal,
    state: stateVal,
    generalArea: str(row[COL.generalArea]),
    venueName: str(row[COL.venueName]),
    address: str(row[COL.address]),
    geopoint: { lat, lng },
    metroRegion: metro?.abbreviation || null,
    isRecurring: hasRecurring,
    recurringSchedule: hasRecurring
      ? {
          dayOfWeek: dayOfWeek || "monday",
          startTime: str(row[COL.startTime]) || "18:00",
          endTime: str(row[COL.endTime]) || "20:00",
          frequency: (str(row[COL.frequency]) as "weekly" | "biweekly" | "monthly") || "weekly",
        }
      : null,
    eventDate: str(row[COL.eventDate]) || null,
    eventStartTime: str(row[COL.eventStartTime]) || null,
    eventEndTime: str(row[COL.eventEndTime]) || null,
    cost: str(row[COL.cost]) || "Contact for price",
    costAmount: parseFloat(str(row[COL.costAmount])) || null,
    contactName: str(row[COL.contactName]),
    contactEmail: str(row[COL.contactEmail]),
    contactPhone: str(row[COL.contactPhone]),
    website: str(row[COL.website]),
    instagram: str(row[COL.instagram]),
    facebookGroup: str(row[COL.facebookGroup]),
    registrationLink: str(row[COL.registrationLink]),
    description: str(row[COL.description]),
    howToJoin: str(row[COL.howToJoin]),
    whatToBring: str(row[COL.whatToBring]),
    skillLevels,
    dropInFriendly: bool(row[COL.dropInFriendly]),
    setsProvided: bool(row[COL.setsProvided]),
    maxPlayers: parseInt(str(row[COL.maxPlayers])) || null,
    typicalGroupSize: str(row[COL.typicalGroupSize]),
    imageUrl: str(row[COL.imageUrl]),
    goingCount: 0,
    beenHereCount: 0,
    headsUpCount: 0,
    status: (str(row[COL.status]) as "active" | "pending" | "claimed" | "inactive") || "active",
    verified: bool(row[COL.verified]),
    claimedBy: null,
    source: "csv_import",
    promoted: bool(row[COL.promoted]),
    lastVerified: str(row[COL.lastVerified]) || new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Load all games from a single state XLSX file.
 */
export function loadStateFile(filePath: string): Game[] {
  if (!fs.existsSync(filePath)) return [];

  const fileName = path.basename(filePath);
  const stateAbbr = stateAbbrFromFileName(fileName);
  const workbook = XLSX.readFile(filePath);

  // Try the expected tab name first, fall back to first sheet
  const sheetName = workbook.SheetNames.includes(LISTINGS_TAB)
    ? LISTINGS_TAB
    : workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  return rows.map((row, i) => rowToGame(row, i, stateAbbr));
}

/**
 * Load all games from all 50 state XLSX files in the data directory.
 * Returns a single flat array of all games.
 */
export function loadAllStateFiles(): Game[] {
  if (!fs.existsSync(DATA_DIR)) {
    console.warn(`State data directory not found: ${DATA_DIR}. Using empty dataset.`);
    return [];
  }

  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".xlsx"));
  const allGames: Game[] = [];

  for (const file of files) {
    const games = loadStateFile(path.join(DATA_DIR, file));
    allGames.push(...games);
  }

  console.log(`Loaded ${allGames.length} games from ${files.length} state files.`);
  return allGames;
}

/**
 * Geocode all games that are missing coordinates (lat=0, lng=0).
 * This is intended to be run at build time / data import time.
 * Respects Nominatim rate limits with a 1-second delay between requests.
 */
export async function geocodeMissingGames(games: Game[]): Promise<Game[]> {
  const needsGeocoding = games.filter(
    (g) => g.geopoint.lat === 0 && g.geopoint.lng === 0
  );

  if (needsGeocoding.length === 0) return games;

  console.log(`Geocoding ${needsGeocoding.length} games missing coordinates...`);

  for (const game of needsGeocoding) {
    const query = game.address
      ? game.address
      : `${game.venueName ? game.venueName + ", " : ""}${game.city}, ${game.state}`;

    const coords = await geocodeAddress(query);
    game.geopoint = coords;

    // Nominatim rate limit: 1 request/second
    await new Promise((r) => setTimeout(r, 1100));
  }

  return games;
}
