#!/usr/bin/env npx tsx
/**
 * Find mahjong events on Eventbrite that the directory does not have.
 *
 *   npx tsx scripts/discover-eventbrite.ts
 *   npx tsx scripts/discover-eventbrite.ts --places ny--new-york,il--chicago --pages 3
 *   npx tsx scripts/discover-eventbrite.ts --tag eb1
 *
 * WHY THIS CHANNEL
 *
 * Twenty-one rounds of Meetup city search covered ~420 cities and the metros
 * and their suburbs are now exhausted. Worse, Meetup's mahjong is mostly
 * private social clubs: rounds 8 and 9 found fifteen groups across forty
 * affluent suburbs and NOT ONE published a venue, because they meet in
 * members' homes and give the address out on RSVP.
 *
 * Eventbrite is the opposite. It is a ticketing platform, so a venue and a
 * full street address are the point — every event carries
 * primary_venue.address with address_1, city, region, postal code and
 * coordinates. That is exactly what 1,000 directory listings with no usable
 * location are missing.
 *
 * HOW IT READS
 *
 * Search pages embed the whole result set as JSON in a
 * `window.__SERVER_DATA__` assignment, under search_data.events.results, 20 to
 * a page with page_count alongside. No API key, no rate limit encountered.
 *
 * WHAT IS FILTERED, AND WHY
 *
 * Search relevance is loose — a mahjong search returns bingo nights, wine
 * tastings and networking events. As with the Meetup pipeline, a result is
 * only kept when its own NAME mentions mahjong; appearing in the search
 * proves nothing.
 *
 * Online events are dropped: a Zoom mahjong class has no city, and this is a
 * directory of places to turn up to.
 */

import fs from "fs";
import path from "path";
import { execFile } from "child_process";

const args = process.argv.slice(2);
const arg = (k: string, d = "") => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const OUT_DIR = arg("--out", "research");
const BASE_URL = arg("--url", "https://www.mahjnearme.com");
const PAGES = Number(arg("--pages", "3"));
const CONCURRENCY = Number(arg("--concurrency", "4"));
const TODAY = new Date().toISOString().slice(0, 10);

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";
const MAHJONG = /mahjong|mah jongg|mah-jongg|mahjongg|mah jong|riichi/i;

/** Eventbrite place slugs, `state--city`. */
const DEFAULT_PLACES = [
  "ny--new-york", "ca--los-angeles", "il--chicago", "tx--houston", "tx--dallas",
  "tx--austin", "ca--san-francisco", "ca--san-diego", "fl--miami", "fl--orlando",
  "ga--atlanta", "wa--seattle", "ma--boston", "pa--philadelphia", "az--phoenix",
  "co--denver", "nv--las-vegas", "or--portland", "nc--charlotte", "dc--washington",
];
const PLACES = args.includes("--places")
  ? arg("--places").split(",").map((s) => s.trim()).filter(Boolean)
  : DEFAULT_PLACES;

interface EbVenue {
  name?: string;
  address?: {
    address_1?: string; city?: string; region?: string; postal_code?: string;
    latitude?: string; longitude?: string;
  };
}
interface EbEvent {
  name?: string; summary?: string; url?: string;
  start_date?: string; start_time?: string; end_time?: string;
  is_online_event?: boolean;
  primary_venue?: EbVenue;
  primary_organizer?: { name?: string; url?: string };
}

/**
 * Fetched through curl rather than fetch(), deliberately.
 *
 * Eventbrite answers Node's fetch (undici) with 405 Method Not Allowed on a
 * plain GET, while curl gets 200 for the identical URL — same User-Agent, same
 * Accept headers, no proxy failure logged either way. It is a client
 * fingerprint check, not anything about the request. Rather than guess at
 * headers that might satisfy it, this shells out to the client that works.
 */
function get(url: string): Promise<{ status: number | null; html: string }> {
  return new Promise((resolve) => {
    execFile(
      "curl",
      ["-sSL", "-m", "40", "-A", UA, "-w", "\n%{http_code}", url],
      { maxBuffer: 64 * 1024 * 1024 },
      (err, stdout) => {
        if (err && !stdout) return resolve({ status: null, html: "" });
        const cut = stdout.lastIndexOf("\n");
        const status = Number(stdout.slice(cut + 1).trim());
        resolve({ status: Number.isFinite(status) ? status : null, html: stdout.slice(0, cut) });
      }
    );
  });
}

/**
 * The JSON assigned to window.__SERVER_DATA__.
 *
 * Brace-matched from the opening brace rather than regex-captured: the blob is
 * hundreds of kilobytes with nested braces throughout, and any non-greedy
 * pattern stops at the first inner close.
 */
function serverData(html: string): Record<string, unknown> | null {
  const i = html.indexOf("window.__SERVER_DATA__");
  if (i < 0) return null;
  const open = html.indexOf("{", i);
  if (open < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let j = open; j < html.length; j++) {
    const c = html[j];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(html.slice(open, j + 1)); } catch { return null; }
      }
    }
  }
  return null;
}

function eventsFrom(blob: Record<string, unknown> | null): { events: EbEvent[]; pages: number } {
  const sd = (blob?.search_data as { events?: { results?: EbEvent[] } } | undefined)?.events;
  return { events: sd?.results ?? [], pages: Number(blob?.page_count ?? 1) };
}

const norm = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const to12 = (t: string) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h)) return "";
  return `${h % 12 || 12}:${String(m ?? 0).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};
const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];


/* ------------------------------------------------------------------ *
 * Turning candidates into listings
 *
 * Emitted by the same run that found them, rather than by a builder run
 * afterwards by hand. Three passes over the same data, each writing the
 * import file a slightly different way, is how a batch ends up disagreeing
 * with the run that produced it.
 * ------------------------------------------------------------------ */

const LESSON = /\b(101|102|103|learn|lesson|class|beginner|intro|introduction|basics|workshop|teach)\b/i;
const LEAGUE = /\bleague\b/i;
const RIICHI = /\briichi\b|japanese mahjong/i;
const CHINESE = /\b(chinese|hong kong|cantonese)\b/i;
const AMERICAN = /\bamerican\b|\bnmjl\b|mah jongg/i;
/** A "venue" that is only a street number and road: a home, or the address typed into the name field. */
const BARE_ADDRESS = /^\s*\d+\s+[A-Za-z0-9. ]+$/;
/**
 * A venue name that says outright it is somebody's house.
 *
 * Anchored to the whole value. A looser test on a trailing "home" catches
 * "Clive Daniel Home" and "Wild Iris Home", which are a furniture showroom and
 * a home-goods shop — both perfectly good public venues.
 */
const PRIVATE_RESIDENCE = /^\s*(private\s+(residence|home|address)|my\s+home|tbd|tba)\s*$/i;
const DAY_SET = new Set(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]);

function styleOf(text: string): [string, string] {
  if (RIICHI.test(text)) return ["riichi", "title or summary says riichi / Japanese mahjong"];
  if (CHINESE.test(text)) return ["chinese", "title or summary says Chinese, Hong Kong or Cantonese"];
  if (AMERICAN.test(text)) return ["american", 'title or summary says American, NMJL, or spells it "mah jongg"'];
  return ["american", "STYLE NOT STATED — recorded as american on the base rate for US social play"];
}

/**
 * Strip a date qualifier off a recurring session's name.
 *
 * Organisers title each instance with its date — "Mah Jongg Open Play Happy
 * Hour - Sept 14", "Level Up your Mah Jongg Strategy - Sept '26", "Rise and
 * Shine! August 31st". On a one-off that is accurate. On a recurring listing
 * it is wrong the day after, and a card reading "Sept 14" in November is worse
 * than one with no date at all.
 *
 * Only applied to recurring listings; a dated event keeps its full title.
 */
function nameWithoutDate(title: string): string {
  return title
    .replace(/[\s\-–—,:]+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*\d{0,2}(?:st|nd|rd|th)?(?:\s*[,'’]?\s*\d{2,4})?\s*$/i, "")
    .replace(/[\s\-–—,:]+\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\s*$/, "")
    .replace(/[\s\-–—,:]+(?:20\d\d)\s*$/, "")
    .replace(/[\s\-–—,:]+$/, "")
    .trim() || title.trim();
}

function typeOf(title: string): string {
  if (LEAGUE.test(title)) return "league";
  return LESSON.test(title) ? "lesson" : "open_play";
}

/** Frequency from the real gaps between posted dates, not from a guess. */
function frequencyOf(dates: string[]): string {
  if (dates.length < 2) return "weekly";
  const ms = dates.map((d) => new Date(d + "T12:00:00").getTime()).sort((a, b) => a - b);
  const gap = Math.min(...ms.slice(1).map((t, i) => Math.round((t - ms[i]) / 86_400_000)));
  return gap <= 8 ? "weekly" : gap <= 16 ? "biweekly" : "monthly";
}

const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

function toListings(cands: Record<string, unknown>[], passNote: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const used = new Set<string>();
  for (const c of cands) {
    const titles = c.titles as string[];
    const title = titles[0] ?? "";
    const summary = String(c.summary ?? "");
    const [gameStyle, styleNote] = styleOf(`${title} ${summary}`);
    const type = typeOf(title);
    const venue = String(c.venueName ?? "");
    const address = String(c.address ?? "");
    const bare = BARE_ADDRESS.test(venue) || PRIVATE_RESIDENCE.test(venue);
    // An "address" that is just the city is not an address. Eventbrite falls
    // back to the city when a host publishes no street, which produced a San
    // Jose listing whose address read "San Jose".
    const addressIsJustTheCity =
      address.trim().toLowerCase() === String(c.city ?? "").trim().toLowerCase();
    const dates = c.dates as string[];
    const occurrences = Number(c.occurrences ?? 1);

    const stem = slugify(`${c.city}-${venue || address}-${title}`).slice(0, 56);
    let id = stem, n = 2;
    while (used.has(id)) id = `${stem}-${n++}`;
    used.add(id);

    const days = String(c.dayOfWeek ?? "").split("|").filter((d) => DAY_SET.has(d));
    let notes =
      `Discovered ${TODAY} on Eventbrite${passNote}. Venue, street address, city, state and times ` +
      `come from Eventbrite's structured event record, not from prose. ${occurrences} dated ` +
      `occurrence(s): ${dates.slice(0, 4).join(", ")}. ${styleNote}.`;
    if (addressIsJustTheCity) {
      notes +=
        " NO STREET ADDRESS: Eventbrite gave the city as the address, which is what it falls back " +
        "to when a host publishes no street. The field is left empty rather than repeating the " +
        "city that city already holds.";
    }
    if (bare) {
      notes +=
        " VENUE NAME IS A BARE STREET ADDRESS, which usually means a private home or an organiser " +
        "who typed the address into the name field. Kept because Eventbrite publishes it openly on " +
        "a public ticket page — unlike a Meetup venue, which is shown only to members — but worth " +
        "a look before featuring it.";
    }

    const isRecurring = occurrences >= 2 && days.length > 0;
    out.push({
      id, name: (isRecurring ? nameWithoutDate(title) : title).slice(0, 110), type, gameStyle,
      city: c.city, state: c.state, generalArea: "",
      venueName: bare ? "" : venue, address: addressIsJustTheCity ? "" : address,
      isRecurring,
      dayOfWeek: isRecurring ? days.join("|") : "",
      startTime: c.startTime, endTime: c.endTime,
      frequency: isRecurring ? frequencyOf(dates) : "",
      eventDate: isRecurring ? null : dates[0],
      cost: "", costAmount: null,
      contactName: "", contactEmail: "", contactPhone: "",
      website: c.url, instagram: "", facebookGroup: "", registrationLink: c.url,
      description: (summary.trim() || `${title.trim()} at ${venue || address} in ${c.city}.`).slice(0, 600),
      howToJoin: "Tickets through Eventbrite.",
      skillLevels: type === "lesson" ? "beginner" : "beginner|intermediate|advanced",
      dropInFriendly: false, setsProvided: true, typicalGroupSize: "",
      source: "manual", sourceURL: c.url, notes,
    });
  }
  return out;
}

async function main() {
  console.log(`Fetching current listings from ${BASE_URL}/api/listings ...`);
  const res = await fetch(`${BASE_URL}/api/listings`);
  if (!res.ok) { console.error(`Failed: ${res.status}`); process.exit(1); }
  const live: Record<string, unknown>[] = (await res.json()).listings;

  const knownVenues = new Set<string>();
  const knownUrls = new Set<string>();
  /** venue key -> the live listings at that venue, and whether each has a link. */
  const liveByVenue = new Map<string, { id: string; hasUrl: boolean }[]>();
  for (const g of live) {
    if (g.status === "active" && g.venueName) {
      const k = norm(String(g.venueName)) + "|" + norm(String(g.city || ""));
      knownVenues.add(k);
      const hasUrl = ["website", "registrationLink", "sourceURL"].some((f) => String(g[f] || "").trim());
      if (!liveByVenue.has(k)) liveByVenue.set(k, []);
      liveByVenue.get(k)!.push({ id: String(g.id), hasUrl });
    }
    for (const f of ["website", "registrationLink", "sourceURL"] as const) {
      const v = String(g[f] || "");
      const m = v.match(/eventbrite\.[a-z.]+\/e\/([a-z0-9-]+)/i);
      if (m) knownUrls.add(m[1].toLowerCase());
    }
  }
  // Earlier research batches count as known too, so repeated runs do not
  // rediscover what a previous one already wrote up.
  let prior = 0;
  for (const f of fs.existsSync(OUT_DIR) ? fs.readdirSync(OUT_DIR) : []) {
    if (!/^mahjong-listings-.*\.json$/.test(f)) continue;
    try {
      for (const l of (JSON.parse(fs.readFileSync(path.join(OUT_DIR, f), "utf8")).listings || []) as Record<string, unknown>[]) {
        prior++;
        const city = norm(String(l.city || ""));
        if (l.venueName) knownVenues.add(norm(String(l.venueName)) + "|" + city);
        // Also key on the address. A batch may deliberately carry no venue
        // name — this pipeline blanks it where Eventbrite's "venue" is really
        // a bare street address — and keying on the name alone loses those,
        // so the next run rediscovers them as new. That is how eb2 turned up
        // 525 Cortland Ave again an hour after eb1 wrote it up.
        if (l.address) knownVenues.add(norm(String(l.address)) + "|" + city);
      }
    } catch { /* a batch that will not parse is not a reason to stop */ }
  }
  console.log(`  ${live.length} listings, ${knownVenues.size} known venues (${prior} from earlier batches)\n`);

  const urls: string[] = [];
  for (const p of PLACES) for (let page = 1; page <= PAGES; page++) {
    urls.push(`https://www.eventbrite.com/d/${p}/mahjong/?page=${page}`);
  }

  console.log(`Reading ${urls.length} search pages across ${PLACES.length} places ...`);
  const all: EbEvent[] = [];

  /**
   * Read a list of pages, returning the ones that did not come back 200.
   *
   * Eventbrite rate-limits under sustained load: a 40-place run at
   * concurrency 3 lost 52 of 160 pages, and dropping to concurrency 2 still
   * lost 34 of 60. Those are not empty cities — they are pages never read, and
   * each one is finds left behind, so they are retried rather than counted as
   * a result.
   */
  const sweep = async (list: string[], pause: number): Promise<string[]> => {
    const missed: string[] = [];
    for (let i = 0; i < list.length; i += CONCURRENCY) {
      const batch = list.slice(i, i + CONCURRENCY);
      const got = await Promise.all(batch.map((u) => get(u)));
      got.forEach((g, j) => {
        if (g.status !== 200) { missed.push(batch[j]); return; }
        all.push(...eventsFrom(serverData(g.html)).events);
      });
      process.stdout.write(`  ${Math.min(i + CONCURRENCY, list.length)}/${list.length}\r`);
      if (pause) await new Promise((r) => setTimeout(r, pause));
    }
    console.log("");
    return missed;
  };

  let failed = await sweep(urls, Number(arg("--delay", "0")));
  // Two retries, backing further off each time. Most rate-limited pages come
  // back on the first slow retry.
  for (const pause of [3000, 8000]) {
    if (!failed.length) break;
    console.log(`  retrying ${failed.length} pages, ${pause}ms between batches ...`);
    failed = await sweep(failed, pause);
  }

  // A result is kept only when its own name says mahjong.
  const seenUrl = new Set<string>();
  const named = all.filter((e) => {
    const u = String(e.url || "");
    if (!u || seenUrl.has(u)) return false;
    seenUrl.add(u);
    return MAHJONG.test(String(e.name || ""));
  });

  const online = named.filter((e) => e.is_online_event);
  const past = named.filter((e) => !e.is_online_event && String(e.start_date || "") < TODAY);
  const usable = named.filter((e) => !e.is_online_event && String(e.start_date || "") >= TODAY);

  // Group into sessions: one venue, one start time. Eventbrite repeats a
  // recurring event as many dated rows, so this is what turns them back into
  // a schedule rather than a pile of one-offs.
  const sessions = new Map<string, { venue: EbVenue; events: EbEvent[] }>();
  const noVenue: EbEvent[] = [];
  for (const e of usable) {
    const v = e.primary_venue;
    const a = v?.address;
    if (!v?.name || !a?.address_1 || !a.city || !a.region) { noVenue.push(e); continue; }
    const key = [norm(v.name), norm(a.city), e.start_time || ""].join("|");
    if (!sessions.has(key)) sessions.set(key, { venue: v, events: [] });
    sessions.get(key)!.events.push(e);
  }

  const candidates: Record<string, unknown>[] = [];
  const alreadyKnown: Record<string, unknown>[] = [];
  for (const { venue, events } of sessions.values()) {
    const a = venue.address!;
    const vkey = norm(venue.name!) + "|" + norm(a.city!);
    const akey = norm(a.address_1!) + "|" + norm(a.city!);
    if (knownVenues.has(vkey) || knownVenues.has(akey)) {
      // Not a find, but not nothing either. A venue the directory already has,
      // running a mahjong event on Eventbrite right now, is independent
      // confirmation that the listing is still real — and where that listing
      // carries no URL at all (1,000 of them do), this is one it could have.
      const owners = liveByVenue.get(vkey) ?? [];
      alreadyKnown.push({
        venue: venue.name, city: a.city, state: (a.region || "").toUpperCase(),
        eventbriteUrl: events[0].url,
        eventTitle: events[0].name,
        nextDate: [...new Set(events.map((e) => String(e.start_date)))].sort()[0],
        matchedListings: owners.map((o) => ({ id: o.id, hasUrl: o.hasUrl })),
        listingsWithoutAnyUrl: owners.filter((o) => !o.hasUrl).map((o) => o.id),
      });
      continue;
    }
    const dates = [...new Set(events.map((e) => String(e.start_date)))].sort();
    const days = [...new Set(dates.map((d) => DAYS[new Date(d + "T12:00:00").getDay()]))];
    candidates.push({
      name: events[0].name,
      organizer: events[0].primary_organizer?.name || "",
      url: events[0].url,
      venueName: venue.name,
      address: a.address_1,
      city: a.city,
      state: (a.region || "").toUpperCase(),
      postalCode: a.postal_code || "",
      lat: a.latitude || "", lng: a.longitude || "",
      dayOfWeek: days.join("|"),
      startTime: to12(String(events[0].start_time || "")),
      endTime: to12(String(events[0].end_time || "")),
      occurrences: dates.length,
      dates: dates.slice(0, 6),
      titles: [...new Set(events.map((e) => String(e.name)))].slice(0, 3),
      summary: String(events[0].summary || "").slice(0, 300),
    });
  }
  candidates.sort((a, b) => Number(b.occurrences) - Number(a.occurrences));

  console.log("RESULT");
  console.log(`  search pages read        : ${urls.length - failed.length}/${urls.length}`);
  console.log(`  results seen             : ${all.length}`);
  console.log(`  named mahjong in title   : ${named.length}`);
  console.log(`  dropped, online only     : ${online.length}`);
  console.log(`  dropped, already past    : ${past.length}`);
  console.log(`  dropped, no usable venue : ${noVenue.length}`);
  const confirmable = alreadyKnown.filter((k) => (k.listingsWithoutAnyUrl as string[]).length > 0);
  console.log(`  venue already known      : ${alreadyKnown.length}  (${confirmable.length} match a listing with no URL at all)`);
  console.log(`  NEW venue candidates     : ${candidates.length}`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const tag = arg("--tag", "");
  const stamp = tag ? `${TODAY}-${tag}` : TODAY;
  const out = path.join(OUT_DIR, `eventbrite-discovery-${stamp}.json`);
  fs.writeFileSync(out, JSON.stringify({
    generatedAt: new Date().toISOString(),
    places: PLACES, pagesPerPlace: PAGES,
    failedPages: failed,
    note: "Candidates only. Every one is an Eventbrite listing whose own title names mahjong, at a physical venue with a street address, on a date not yet past, at a venue the directory does not already have.",
    candidates,
    alreadyKnown,
  }, null, 2));
  console.log(`\n  -> ${out}`);

  // ...and the import-shaped file, from the same candidates in the same run.
  const listings = toListings(candidates, tag ? ` (pass ${tag})` : "");
  const listingsPath = path.join(OUT_DIR, `mahjong-listings-eventbrite-${stamp}.json`);
  fs.writeFileSync(listingsPath, JSON.stringify({
    generatedAt: TODAY,
    source: `Eventbrite search across ${PLACES.length} places, ${PAGES} page(s) each`,
    note: "Every listing is an Eventbrite event whose own TITLE names mahjong, at a physical venue with a street address, on a date not yet past, at a venue neither the directory nor an earlier batch already holds. Venue, address, city, state and times come from Eventbrite's structured record rather than from prose.",
    listings,
  }, null, 2));
  console.log(`  -> ${listingsPath}  (${listings.length} listings, ${listings.filter((l) => l.isRecurring).length} recurring)`);
  for (const c of candidates.slice(0, 25)) {
    console.log(`   ${String(c.city).slice(0, 15).padEnd(16)} ${c.state}  ${String(c.venueName).slice(0, 28).padEnd(30)} ${String(c.dayOfWeek).slice(0, 18).padEnd(19)} x${c.occurrences}`);
  }
  if (failed.length) console.log(`\n  ${failed.length} pages did not return 200 and were not searched.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
