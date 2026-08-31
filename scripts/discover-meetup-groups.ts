#!/usr/bin/env npx tsx
/**
 * Discover mahjong groups on Meetup that the directory does not already have,
 * city by city, and pull their upcoming sessions.
 *
 * The earlier verification pass could only look at the 57 Meetup groups already
 * referenced by listings. This one starts from Meetup's own city search, so it
 * finds groups nobody has filed yet.
 *
 *   npx tsx scripts/discover-meetup-groups.ts                      # default metro list
 *   npx tsx scripts/discover-meetup-groups.ts --cities us--tx--austin,us--il--chicago
 *   npx tsx scripts/discover-meetup-groups.ts --out ./research
 *
 * Output:
 *   research/meetup-discovery-<date>.json   candidate sessions, ready to review
 *   research/meetup-discovery-<date>.md     what was searched and what was rejected
 *
 * WHY EACH FILTER EXISTS
 *
 * Meetup's search relevance is loose. A search for "mahjong" in Austin returns
 * a polyamory group, two chess groups, a euchre group and a pinball group —
 * none of which play mahjong. So a group is only kept when its own events page
 * has an event whose TITLE mentions mahjong. The group appearing in a mahjong
 * search proves nothing.
 *
 * Even within a genuine group, individual events are filtered the same way.
 * Several mahjong groups are general social clubs: one Fort Lauderdale group's
 * upcoming calendar includes Top Golf, a nightclub, a safari park and a museum
 * alongside its mahjong nights. Importing every event from a group that
 * sometimes plays mahjong puts a nightclub night in a mahjong directory.
 *
 * Venues need a real name and street address to become a listing. Meetup lets
 * organisers type anything into the location field, and the live data contains
 * "Somewhere in Palo Alto, TBD" and "Midtown, Sacramento, CA" — neither is a
 * place anyone can go to.
 *
 * Everything surviving that is still only a *candidate*. It is written to
 * research/ for review, never straight into a corrections file.
 */

import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const OUT_DIR = args.includes("--out") ? args[args.indexOf("--out") + 1] : "research";
const BASE_URL = args.includes("--url")
  ? args[args.indexOf("--url") + 1]
  : "https://www.mahjnearme.com";
const CONCURRENCY = args.includes("--concurrency")
  ? Number(args[args.indexOf("--concurrency") + 1])
  : 6;

/** Meetup's own city slugs. */
const DEFAULT_CITIES = [
  "us--tx--austin", "us--tx--houston", "us--tx--dallas",
  "us--ca--los-angeles", "us--ca--san-francisco", "us--ca--san-diego",
  "us--ny--new-york", "us--il--chicago",
  "us--fl--miami", "us--fl--orlando",
  "us--ga--atlanta", "us--wa--seattle", "us--ma--boston",
  "us--pa--philadelphia", "us--az--phoenix", "us--co--denver",
  "us--nv--las-vegas", "us--or--portland", "us--nc--charlotte",
  "us--dc--washington",
];
const CITIES = args.includes("--cities")
  ? args[args.indexOf("--cities") + 1].split(",").map((s) => s.trim()).filter(Boolean)
  : DEFAULT_CITIES;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";
const MAHJONG = /mahjong|mah jongg|mah-jongg|mahjongg|riichi/i;
const TODAY = new Date().toISOString().slice(0, 10);

interface Venue { name: string; address: string; city: string; state: string }
interface MEvent {
  id: string; title: string; date: string; startTime: string; endTime: string;
  status: string; url: string; venue: Venue | null;
}

const unescape_ = (s: string) =>
  (s || "")
    .replace(/\\u([\da-f]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\"/g, '"')
    .replace(/\\\//g, "/");

async function get(url: string): Promise<{ status: number | null; html: string }> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 30000);
  try {
    const r = await fetch(url, {
      redirect: "follow", signal: ctl.signal,
      headers: { "User-Agent": UA, Accept: "text/html" },
    });
    return { status: r.status, html: await r.text() };
  } catch {
    return { status: null, html: "" };
  } finally {
    clearTimeout(timer);
  }
}

/** Pull event objects out of Meetup's embedded Apollo cache. */
function parseEvents(html: string): MEvent[] {
  const venues: Record<string, Venue> = {};
  for (const m of html.matchAll(/"Venue:(\d+)":\{(.{0,600}?)\}/g)) {
    const b = m[2];
    venues["Venue:" + m[1]] = {
      name: unescape_((b.match(/"name":"((?:[^"\\]|\\.)*)"/) || [])[1] || ""),
      address: unescape_((b.match(/"address":"((?:[^"\\]|\\.)*)"/) || [])[1] || ""),
      city: unescape_((b.match(/"city":"((?:[^"\\]|\\.)*)"/) || [])[1] || ""),
      state: ((b.match(/"state":"([A-Za-z]{2})"/) || [])[1] || "").toUpperCase(),
    };
  }
  const out: MEvent[] = [];
  for (const m of html.matchAll(/"Event:(\d+)":\{(.{0,2500}?)"featuredEventPhoto"/g)) {
    const b = m[2];
    const title = unescape_((b.match(/"title":"((?:[^"\\]|\\.)*)"/) || [])[1] || "");
    const dt = b.match(/"dateTime":"(20\d\d-\d\d-\d\d)T(\d\d:\d\d)/);
    const et = b.match(/"endTime":"20\d\d-\d\d-\d\dT(\d\d:\d\d)/);
    if (!title || !dt) continue;
    out.push({
      id: m[1], title, date: dt[1], startTime: dt[2], endTime: et?.[1] || "",
      status: (b.match(/"status":"(\w+)"/) || [])[1] || "",
      url: unescape_((b.match(/"eventUrl":"((?:[^"\\]|\\.)*)"/) || [])[1] || ""),
      venue: venues[(b.match(/"venue":\{"__ref":"(Venue:\d+)"/) || [])[1] || ""] || null,
    });
  }
  return out;
}

const norm = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

async function main() {
  console.log(`Fetching current listings from ${BASE_URL}/api/listings ...`);
  const res = await fetch(`${BASE_URL}/api/listings`);
  if (!res.ok) { console.error(`Failed: ${res.status}`); process.exit(1); }
  const live: Record<string, unknown>[] = (await res.json()).listings;

  // Groups already referenced, so discovery only reports genuinely new ones.
  const knownGroups = new Set<string>();
  const knownVenues = new Set<string>();
  for (const g of live) {
    for (const f of ["website", "registrationLink"] as const) {
      const v = String(g[f] || "");
      const m = v.match(/meetup\.com\/([a-z0-9][a-z0-9-]{2,60})/i);
      if (m) knownGroups.add(m[1].toLowerCase());
    }
    if (g.status === "active") {
      knownVenues.add(norm(String(g.venueName || "")) + "|" + norm(String(g.city || "")));
    }
  }
  console.log(`  ${live.length} listings, ${knownGroups.size} Meetup groups already referenced\n`);

  const searched: { city: string; slugs: number; newSlugs: number }[] = [];
  const candidateGroups = new Set<string>();

  console.log(`Searching ${CITIES.length} cities ...`);
  for (let i = 0; i < CITIES.length; i += CONCURRENCY) {
    const batch = CITIES.slice(i, i + CONCURRENCY);
    const pages = await Promise.all(
      batch.map((c) => get(`https://www.meetup.com/find/${c}/mahjong/`))
    );
    batch.forEach((city, j) => {
      const slugs = [...new Set(
        [...pages[j].html.matchAll(/meetup\.com\/([a-z0-9][a-z0-9-]{3,60})\/events\//g)].map((m) => m[1].toLowerCase())
      )];
      const fresh = slugs.filter((s) => !knownGroups.has(s));
      fresh.forEach((s) => candidateGroups.add(s));
      searched.push({ city, slugs: slugs.length, newSlugs: fresh.length });
    });
    process.stdout.write(`  ${Math.min(i + CONCURRENCY, CITIES.length)}/${CITIES.length}\r`);
  }
  console.log("");
  console.log(`  ${candidateGroups.size} groups found that are not already referenced\n`);

  // A group appearing in a mahjong search proves nothing — check its events.
  const groups = [...candidateGroups];
  const kept: { group: string; events: MEvent[] }[] = [];
  const rejected: { group: string; reason: string }[] = [];

  console.log(`Checking ${groups.length} groups for actual mahjong events ...`);
  for (let i = 0; i < groups.length; i += CONCURRENCY) {
    const batch = groups.slice(i, i + CONCURRENCY);
    const pages = await Promise.all(
      batch.map((s) => get(`https://www.meetup.com/${s}/events/`))
    );
    batch.forEach((slug, j) => {
      const { status, html } = pages[j];
      if (status === null || status >= 400) { rejected.push({ group: slug, reason: `unreachable (${status ?? "error"})` }); return; }
      if (/group not found|group you.{0,3}re looking for doesn.{0,3}t exist/i.test(html)) {
        rejected.push({ group: slug, reason: "group no longer exists" }); return;
      }
      const evs = parseEvents(html)
        .filter((e) => e.date >= TODAY && e.status !== "PAST" && e.status !== "CANCELLED")
        .filter((e) => MAHJONG.test(e.title));
      if (!evs.length) { rejected.push({ group: slug, reason: "no upcoming event whose title mentions mahjong" }); return; }
      kept.push({ group: slug, events: evs });
    });
    process.stdout.write(`  ${Math.min(i + CONCURRENCY, groups.length)}/${groups.length}\r`);
  }
  console.log("");

  // Collapse to venue-level candidates, dropping anything without a real place.
  const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const to12 = (t: string) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  };
  const candidates: Record<string, unknown>[] = [];
  const skippedVenues: { group: string; venue: string; reason: string }[] = [];

  for (const { group, events } of kept) {
    const byVenue = new Map<string, MEvent[]>();
    for (const e of events) {
      if (!e.venue?.city || !e.venue.state) { skippedVenues.push({ group, venue: e.venue?.name || "(none)", reason: "no city/state" }); continue; }
      const k = norm(e.venue.name) + "|" + norm(e.venue.city);
      if (!byVenue.has(k)) byVenue.set(k, []);
      byVenue.get(k)!.push(e);
    }
    for (const [k, evs] of byVenue) {
      const v = evs[0].venue!;
      if (!v.name || !v.address || /\bTBD\b|^somewhere\b/i.test(v.name + " " + v.address)) {
        skippedVenues.push({ group, venue: v.name || "(none)", reason: "no usable venue name or street address" }); continue;
      }
      if (knownVenues.has(k)) { skippedVenues.push({ group, venue: v.name, reason: "venue already in the directory" }); continue; }
      const days = [...new Set(evs.map((e) => DAYS[new Date(e.date + "T12:00:00").getDay()]))];
      candidates.push({
        group: `https://www.meetup.com/${group}`,
        sourceURL: `https://www.meetup.com/${group}/events/`,
        venueName: v.name, address: v.address, city: v.city, state: v.state,
        dayOfWeek: days.join("|"),
        startTime: to12(evs[0].startTime), endTime: to12(evs[0].endTime),
        upcomingCount: evs.length,
        sampleTitles: [...new Set(evs.map((e) => e.title))].slice(0, 3),
        nextDates: evs.map((e) => e.date).sort().slice(0, 4),
      });
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stamp = TODAY;
  const jsonPath = path.join(OUT_DIR, `meetup-discovery-${stamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    citiesSearched: CITIES.length,
    note: "Candidates only. Every group here has at least one upcoming event whose TITLE mentions mahjong, a venue with a street address, and a venue+city not already in the directory. Confirm before importing — a venue can be right while the session details are not.",
    searched, candidates, rejectedGroups: rejected, skippedVenues,
  }, null, 2));

  console.log("RESULT");
  console.log(`  cities searched            : ${CITIES.length}`);
  console.log(`  new groups examined        : ${groups.length}`);
  console.log(`  groups with mahjong events : ${kept.length}`);
  console.log(`  rejected                   : ${rejected.length}`);
  console.log(`  venue candidates           : ${candidates.length}`);
  console.log(`  venues skipped             : ${skippedVenues.length}`);
  console.log(`\n  -> ${jsonPath}`);
  for (const c of candidates.slice(0, 25)) {
    console.log(`   ${String(c.city).slice(0, 16).padEnd(17)} ${String(c.state)}  ${String(c.venueName).slice(0, 30).padEnd(32)} ${String(c.dayOfWeek).slice(0, 22)}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
