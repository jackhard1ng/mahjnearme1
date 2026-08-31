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

/**
 * Meetup location values, `country--state--City`.
 *
 * The City component is passed to Meetup verbatim and IS case-sensitive:
 * `us--mi--Detroit` returns 11 groups, `us--mi--detroit` returns none. Write
 * them capitalised as the city is normally spelled ("Salt Lake City").
 */
const DEFAULT_CITIES = [
  "us--tx--Austin", "us--tx--Houston", "us--tx--Dallas",
  "us--ca--Los Angeles", "us--ca--San Francisco", "us--ca--San Diego",
  "us--ny--New York", "us--il--Chicago",
  "us--fl--Miami", "us--fl--Orlando",
  "us--ga--Atlanta", "us--wa--Seattle", "us--ma--Boston",
  "us--pa--Philadelphia", "us--az--Phoenix", "us--co--Denver",
  "us--nv--Las Vegas", "us--or--Portland", "us--nc--Charlotte",
  "us--dc--Washington",
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

/**
 * Meetup's search URL for one city.
 *
 * The path form (`/find/<location>/mahjong/`) only resolves for a subset of
 * cities — it 404s on Detroit, Columbus and Nashville while working for
 * Austin and Albuquerque — and a 404 body yields no group links, so a run
 * using it reports "0 groups found" for a city that in fact has eleven. The
 * query form resolves for every city tried.
 */
function searchUrl(city: string): string {
  return `https://www.meetup.com/find/?keywords=mahjong&location=${encodeURIComponent(city)}`;
}

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

/** `2026-08-31`, then `2026-08-31-2`, `-3` ... — the first not already on disk. */
function nextFreeStamp(dir: string, today: string): string {
  const taken = (n: string) => fs.existsSync(path.join(dir, `meetup-discovery-${n}.json`));
  if (!taken(today)) return today;
  for (let i = 2; i < 100; i++) if (!taken(`${today}-${i}`)) return `${today}-${i}`;
  return `${today}-${Date.now()}`;
}

/**
 * The group's own city and state, from the Group object in the Apollo cache.
 *
 * Needed because a fair number of organisers publish no venue at all: the
 * event carries `"venue":null` with `eventType:"PHYSICAL"`, and the address is
 * given to members after they RSVP. Mahjong With Friends (Greenbrier TN) and
 * West County Singles (Ballwin MO) both run weekly mahjong that way. Those are
 * real sessions in real cities, so they are reported as a city-level tier
 * rather than dropped — but never with an invented street address.
 */
function parseGroupLocation(html: string): { city: string; state: string } | null {
  // The Group object writes these three adjacent and only once per page:
  //   "city":"Greenbrier","state":"TN","country":"us"
  // Anchoring on the triple keeps it from picking up an event venue's city.
  const m = html.match(/"city":"((?:[^"\\]|\\.)*)","state":"([A-Za-z]{2})","country":"[a-z]{2}"/);
  if (!m) return null;
  const city = unescape_(m[1]);
  const state = m[2].toUpperCase();
  return city && state ? { city, state } : null;
}

/**
 * Meetup's own words for how a series repeats, e.g.
 * "Every 2 weeks on Friday until November 12, 2026".
 *
 * Worth one extra request per candidate because it is authoritative where
 * reading the pattern off a handful of dates is not. West County Singles'
 * Friday session looks like "1st, 3rd and 5th Friday" from its dates and from
 * its own title, but Meetup records it as every two weeks — and, more usefully,
 * records that it stops on 12 November. Nothing in the dates says that, so a
 * listing built from dates alone would keep advertising it into next year.
 *
 * The group's events page is no help here: it reports `"series":null` for
 * every event, including ones that do have a series on their own page.
 */
async function seriesDescription(eventUrl: string): Promise<string> {
  if (!eventUrl) return "";
  const { status, html } = await get(eventUrl);
  if (status !== 200) return "";
  const m = html.match(/"series":\{"__typename":"Series","description":"((?:[^"\\]|\\.)*)"/);
  return m ? unescape_(m[1]) : "";
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

  const searched: { city: string; status: number | null; slugs: number; newSlugs: number }[] = [];
  const failedCities: { city: string; status: number | null }[] = [];
  const candidateGroups = new Set<string>();

  console.log(`Searching ${CITIES.length} cities ...`);
  for (let i = 0; i < CITIES.length; i += CONCURRENCY) {
    const batch = CITIES.slice(i, i + CONCURRENCY);
    const pages = await Promise.all(batch.map((c) => get(searchUrl(c))));
    batch.forEach((city, j) => {
      const slugs = [...new Set(
        [...pages[j].html.matchAll(/meetup\.com\/([a-z0-9][a-z0-9-]{3,60})\/events\//g)].map((m) => m[1].toLowerCase())
      )];
      const fresh = slugs.filter((s) => !knownGroups.has(s));
      fresh.forEach((s) => candidateGroups.add(s));
      searched.push({ city, status: pages[j].status, slugs: slugs.length, newSlugs: fresh.length });
      // A city that did not return 200 was not searched. Without this the run
      // reports it as "no mahjong groups here", which is a false negative that
      // looks exactly like a true one.
      if (pages[j].status !== 200) failedCities.push({ city, status: pages[j].status });
    });
    process.stdout.write(`  ${Math.min(i + CONCURRENCY, CITIES.length)}/${CITIES.length}\r`);
  }
  console.log("");
  console.log(`  ${candidateGroups.size} groups found that are not already referenced\n`);

  // A group appearing in a mahjong search proves nothing — check its events.
  const groups = [...candidateGroups];
  const kept: { group: string; events: MEvent[]; loc: { city: string; state: string } | null }[] = [];
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
      kept.push({ group: slug, events: evs, loc: parseGroupLocation(html) });
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
  const cityLevel: Record<string, unknown>[] = [];

  for (const { group, events, loc } of kept) {
    const byVenue = new Map<string, MEvent[]>();
    const venueless: MEvent[] = [];
    for (const e of events) {
      if (!e.venue?.city || !e.venue.state) { venueless.push(e); continue; }
      // Keyed on start time as well as place, because one venue routinely
      // hosts more than one series. West County Singles runs "Mah Jongg and
      // Dinner" on Tuesdays at 16:00 and "Play Mah Jongg — Daytime" on
      // Fridays at 12:30; keyed on the venue alone those collapse into a
      // single candidate reading "tuesday|friday, 4:00 PM", which states the
      // wrong time for every Friday session.
      const k = norm(e.venue.name) + "|" + norm(e.venue.city) + "|" + e.startTime;
      if (!byVenue.has(k)) byVenue.set(k, []);
      byVenue.get(k)!.push(e);
    }
    for (const evs of byVenue.values()) {
      const v = evs[0].venue!;
      if (!v.name || !v.address || /\bTBD\b|^somewhere\b/i.test(v.name + " " + v.address)) {
        skippedVenues.push({ group, venue: v.name || "(none)", reason: "no usable venue name or street address" }); continue;
      }
      const venueKey = norm(v.name) + "|" + norm(v.city);
      if (knownVenues.has(venueKey)) { skippedVenues.push({ group, venue: v.name, reason: "venue already in the directory" }); continue; }
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
        sampleEventUrl: evs[0].url,
      });
    }

    // Every mahjong event in this group lacked a venue. If Meetup at least
    // knows where the group is, that is still a usable city-level listing;
    // if it does not, there is nothing to report and it is recorded as a skip.
    if (venueless.length && byVenue.size === 0) {
      if (loc) {
        const bySeries = new Map<string, MEvent[]>();
        for (const e of venueless) {
          if (!bySeries.has(e.startTime)) bySeries.set(e.startTime, []);
          bySeries.get(e.startTime)!.push(e);
        }
        for (const evs of bySeries.values()) {
          const days = [...new Set(evs.map((e) => DAYS[new Date(e.date + "T12:00:00").getDay()]))];
          cityLevel.push({
            group: `https://www.meetup.com/${group}`,
            sourceURL: `https://www.meetup.com/${group}/events/`,
            venueName: "", address: "", city: loc.city, state: loc.state,
            dayOfWeek: days.join("|"),
            startTime: to12(evs[0].startTime), endTime: to12(evs[0].endTime),
            upcomingCount: evs.length,
            sampleTitles: [...new Set(evs.map((e) => e.title))].slice(0, 3),
            nextDates: evs.map((e) => e.date).sort().slice(0, 4),
            sampleEventUrl: evs[0].url,
            note: "Organiser publishes no venue — address is given to members after RSVP. City-level only; do NOT invent a street address.",
          });
        }
      } else {
        skippedVenues.push({ group, venue: "(none)", reason: "no venue on the events, and no city on the group" });
      }
    }
  }

  // One request per surviving candidate to get Meetup's own recurrence text.
  const all = [...candidates, ...cityLevel];
  if (all.length) {
    console.log(`Reading the recurrence Meetup records for ${all.length} candidates ...`);
    for (const c of all) {
      c.meetupRecurrence = await seriesDescription(String(c.sampleEventUrl || ""));
      delete c.sampleEventUrl;
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  // Two runs on the same day must not share a filename. The first pass of
  // this script overwrote an already-committed output when a second batch of
  // cities was searched an hour later, so the stamp gains a suffix rather
  // than silently replacing a file that is someone's record of a run.
  const stamp = args.includes("--tag")
    ? `${TODAY}-${args[args.indexOf("--tag") + 1]}`
    : nextFreeStamp(OUT_DIR, TODAY);
  const jsonPath = path.join(OUT_DIR, `meetup-discovery-${stamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    citiesSearched: CITIES.length,
    citiesFailed: failedCities,
    note: "Candidates only. Every group here has at least one upcoming event whose TITLE mentions mahjong, a venue with a street address, and a venue+city not already in the directory. Confirm before importing — a venue can be right while the session details are not.",
    searched, candidates, cityLevelCandidates: cityLevel, rejectedGroups: rejected, skippedVenues,
  }, null, 2));

  console.log("RESULT");
  console.log(`  cities searched            : ${CITIES.length - failedCities.length}/${CITIES.length}`);
  console.log(`  new groups examined        : ${groups.length}`);
  console.log(`  groups with mahjong events : ${kept.length}`);
  console.log(`  rejected                   : ${rejected.length}`);
  console.log(`  venue candidates           : ${candidates.length}`);
  console.log(`  city-level candidates      : ${cityLevel.length}`);
  console.log(`  venues skipped             : ${skippedVenues.length}`);
  console.log(`\n  -> ${jsonPath}`);
  if (failedCities.length) {
    console.log(`\n  ${failedCities.length} cities did NOT return a search page and were not really searched:`);
    for (const f of failedCities) console.log(`    ${f.city}  (HTTP ${f.status ?? "no response"})`);
    console.log("  A zero for these means the request failed, not that the city has no mahjong.");
  }
  for (const c of candidates.slice(0, 25)) {
    console.log(`   ${String(c.city).slice(0, 16).padEnd(17)} ${String(c.state)}  ${String(c.venueName).slice(0, 30).padEnd(32)} ${String(c.dayOfWeek).slice(0, 22)}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
