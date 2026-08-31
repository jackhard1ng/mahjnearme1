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

async function main() {
  console.log(`Fetching current listings from ${BASE_URL}/api/listings ...`);
  const res = await fetch(`${BASE_URL}/api/listings`);
  if (!res.ok) { console.error(`Failed: ${res.status}`); process.exit(1); }
  const live: Record<string, unknown>[] = (await res.json()).listings;

  const knownVenues = new Set<string>();
  const knownUrls = new Set<string>();
  for (const g of live) {
    if (g.status === "active" && g.venueName) knownVenues.add(norm(String(g.venueName)) + "|" + norm(String(g.city || "")));
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
        if (l.venueName) knownVenues.add(norm(String(l.venueName)) + "|" + norm(String(l.city || "")));
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
  const failed: string[] = [];
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const got = await Promise.all(batch.map((u) => get(u)));
    got.forEach((g, j) => {
      if (g.status !== 200) { failed.push(batch[j]); return; }
      all.push(...eventsFrom(serverData(g.html)).events);
    });
    process.stdout.write(`  ${Math.min(i + CONCURRENCY, urls.length)}/${urls.length}\r`);
  }
  console.log("");

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
  const alreadyKnown: { venue: string; city: string }[] = [];
  for (const { venue, events } of sessions.values()) {
    const a = venue.address!;
    const vkey = norm(venue.name!) + "|" + norm(a.city!);
    if (knownVenues.has(vkey)) { alreadyKnown.push({ venue: venue.name!, city: a.city! }); continue; }
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
  console.log(`  venue already known      : ${alreadyKnown.length}`);
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
  for (const c of candidates.slice(0, 25)) {
    console.log(`   ${String(c.city).slice(0, 15).padEnd(16)} ${c.state}  ${String(c.venueName).slice(0, 28).padEnd(30)} ${String(c.dayOfWeek).slice(0, 18).padEnd(19)} x${c.occurrences}`);
  }
  if (failed.length) console.log(`\n  ${failed.length} pages did not return 200 and were not searched.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
