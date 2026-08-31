#!/usr/bin/env npx tsx
/**
 * Watch every readable listing source for changes, so a stale directory can
 * be caught between full audits instead of drifting for months.
 *
 * Run it once to lay down a baseline, then on a schedule. Each later run
 * reports only what changed: sources that gained or lost mahjong content,
 * went dead, or came back.
 *
 *   npx tsx scripts/monitor-sources.ts                 # first run: baseline
 *   npx tsx scripts/monitor-sources.ts                 # later runs: diff
 *   npx tsx scripts/monitor-sources.ts --out ./audit --concurrency 20
 *
 * Outputs:
 *   audit/source-snapshots.json  the baseline. COMMIT THIS — it is the memory
 *                                between runs, and without it every run looks
 *                                like a first run.
 *   audit/source-changes.json    what moved since the last run.
 *   audit/instagram-watchlist.json  see below.
 *
 * WHAT THIS CAN AND CANNOT WATCH
 *
 * This comment previously said Instagram "cannot be watched, by anything, from
 * a server" because every profile fetch returned 302 to a login wall. That was
 * wrong, and stated far too confidently. Re-tested properly:
 *
 *   no User-Agent          429, empty
 *   browser User-Agent     200, but the HTML served is the login shell
 *   Googlebot User-Agent   200, ~1.1MB, with the profile data embedded
 *
 * Instagram serves crawlers a rendered profile carrying full_name, biography
 * and external_url — the link in bio — plus follower and post counts. It does
 * NOT carry post captions, so it still cannot see what an organiser posted;
 * it sees who they are and where they point. scripts/check-instagram-profiles.ts
 * does that.
 *
 * What it will not survive is volume. Roughly ten requests from one address
 * and every one after returns 429, for hours. So Instagram is still not
 * something this monitor can sweep on a schedule, and the watchlist below is
 * still the right output — but the reason is a rate limit, not a login wall,
 * and a run from a different address or spread over days would work.
 *
 * This matters because Instagram is where organisers actually post current
 * schedules, and 328 distinct handles appear on live listings. The watchlist
 * ranks each handle by how much it is worth checking: how many live listings
 * depend on it, and how long since any of them were verified. Working the top
 * of that list beats checking 328 accounts in no order.
 *
 * Bio-link pages are the better route in any case. linktr.ee and similar are
 * readable with no rate limit, and organisers keep them current precisely
 * because their Instagram bio points there. All 27 the directory points at
 * were read successfully; 25 carry links, and 18 listings gained their
 * organiser's real website from them (audit/linktree-owner-sites.json). So any
 * bio-link URL on a listing is watched like any other source, and asking an
 * organiser for their link-in-bio buys real coverage of what they post to
 * Instagram. See scripts/harvest-link-in-bio.ts.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { instagramHandle } from "../src/lib/utils";

const args = process.argv.slice(2);
const BASE_URL = args.includes("--url")
  ? args[args.indexOf("--url") + 1]
  : "https://www.mahjnearme.com";
const OUT_DIR = args.includes("--out") ? args[args.indexOf("--out") + 1] : "audit";
const CONCURRENCY = args.includes("--concurrency")
  ? Number(args[args.indexOf("--concurrency") + 1])
  : 20;
const LIMIT = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : Infinity;

const MAHJONG_RE = /mahjong|mah jongg|mah-jongg|mah jong|majong/i;
/** Dates and times, so a schedule change registers even when wording is identical. */
const WHEN_RE =
  /\b(mon|tues?|wed(nes)?|thur?s?|fri|sat(ur)?|sun)(day)?s?\b|\b\d{1,2}(:\d{2})?\s*[ap]\.?m\.?\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}\b|\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/gi;

interface Listing {
  id: string;
  name: string;
  city: string;
  state: string;
  status: string;
  isRecurring: boolean;
  eventDate: string | null;
  website?: string;
  registrationLink?: string;
  instagram?: string;
  lastVerified?: string;
}

interface Snapshot {
  url: string;
  status: number | null;
  /** Hash of the mahjong-relevant text, so unrelated page churn is ignored. */
  signalHash: string;
  /** Distinct date/time tokens found near mahjong content. */
  when: string[];
  mentions: number;
  /** Where the URL actually lands, when that is a different host. */
  redirectsTo?: string;
  listingIds: string[];
  lastSeen: string;
}

function isExpired(g: Listing, today: Date): boolean {
  if (g.isRecurring) return false;
  if (!g.eventDate || !/^\d{4}-\d{2}-\d{2}/.test(g.eventDate)) return false;
  const [y, m, d] = g.eventDate.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d) < today;
}

function visibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Reduce a page to just its mahjong-relevant signal: the sentences that
 * mention mahjong, plus any date or time tokens in them. Hashing the whole
 * page would fire on every unrelated edit — a news item, a cookie banner, a
 * rotating footer — and the alert would be worthless within a week.
 */
function extractSignal(html: string): { hash: string; when: string[]; mentions: number } {
  const text = visibleText(html);
  const sentences = text.split(/(?<=[.!?])\s+|\s{2,}|\|/);
  const relevant = sentences.filter((s) => MAHJONG_RE.test(s)).map((s) => s.trim().slice(0, 300));
  const joined = relevant.join(" ").toLowerCase().replace(/\s+/g, " ").trim();
  const when = [...new Set((joined.match(WHEN_RE) || []).map((w) => w.toLowerCase().trim()))].sort();
  return {
    hash: crypto.createHash("sha1").update(joined).digest("hex").slice(0, 16),
    when,
    mentions: relevant.length,
  };
}

function hostOf(u: string): string {
  try { return new URL(u).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; }
}

async function fetchPage(url: string): Promise<{ status: number | null; html: string; finalUrl: string }> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 25000);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    const ct = res.headers.get("content-type") || "";
    const html = ct.includes("html") || ct.includes("text") ? (await res.text()).slice(0, 500000) : "";
    return { status: res.status, html, finalUrl: res.url || url };
  } catch {
    return { status: null, html: "", finalUrl: "" };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Codes that mean "the server would not talk to us this time" rather than
 * "this page is gone": auth walls, rate limits and throttling interstitials.
 * A noise test found 403<->200 and 200<->503 flapping across runs minutes
 * apart on perfectly healthy library and JCC sites, so transitions involving
 * these are not reported — an alert stream that cries wolf gets ignored, and
 * then the real went_dead is missed too.
 */
const INCONCLUSIVE = new Set([401, 403, 406, 429, 503]);

function conclusive(status: number | null): boolean {
  return status === null ? false : !INCONCLUSIVE.has(status);
}

function daysSince(iso: string | undefined): number | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  return Math.floor((Date.now() - new Date(iso.slice(0, 10)).getTime()) / 86400000);
}

async function main() {
  console.log(`Fetching listings from ${BASE_URL}/api/listings ...`);
  const res = await fetch(`${BASE_URL}/api/listings`);
  if (!res.ok) {
    console.error(`Failed to fetch listings: ${res.status}`);
    process.exit(1);
  }
  const all: Listing[] = (await res.json()).listings;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const live = all.filter((g) => g.status === "active" && !isExpired(g, today));

  // ---- Instagram watchlist: what a person should check, in priority order ----
  const byHandle = new Map<string, Listing[]>();
  for (const g of live) {
    // Same helper the site renders with, so a website or free text sitting in
    // the instagram field does not become a phantom account to go and check.
    const raw = instagramHandle(g.instagram);
    const h = raw ? raw.toLowerCase() : "";
    if (!h) continue;
    if (!byHandle.has(h)) byHandle.set(h, []);
    byHandle.get(h)!.push(g);
  }
  const watchlist = [...byHandle.entries()]
    .map(([handle, gs]) => {
      const ages = gs.map((g) => daysSince(g.lastVerified)).filter((n): n is number => n !== null);
      const oldest = ages.length ? Math.max(...ages) : null;
      return {
        handle: `@${handle}`,
        url: `https://instagram.com/${handle}`,
        liveListings: gs.length,
        daysSinceOldestVerification: oldest,
        // Rank by reach first, staleness second: re-checking an account that
        // carries eight listings is worth more than one that carries one.
        priority: gs.length * 10 + Math.min(oldest ?? 0, 365) / 36.5,
        cities: [...new Set(gs.map((g) => `${g.city.trim()}, ${g.state.trim()}`))].slice(0, 5),
        listingIds: gs.map((g) => g.id),
      };
    })
    .sort((a, b) => b.priority - a.priority);

  // ---- readable sources ----
  const byUrl = new Map<string, Listing[]>();
  for (const g of live) {
    for (const f of ["website", "registrationLink"] as const) {
      const u = (g[f] || "").trim();
      if (!/^https?:\/\//i.test(u)) continue;
      if (/instagram\.com/i.test(u)) continue; // unreadable, tracked in the watchlist
      if (!byUrl.has(u)) byUrl.set(u, []);
      byUrl.get(u)!.push(g);
    }
  }
  const urls = [...byUrl.keys()].slice(0, LIMIT);

  const snapPath = path.join(OUT_DIR, "source-snapshots.json");
  const previous: Record<string, Snapshot> = fs.existsSync(snapPath)
    ? JSON.parse(fs.readFileSync(snapPath, "utf8")).snapshots || {}
    : {};
  const isFirstRun = Object.keys(previous).length === 0;

  console.log(`  live listings        : ${live.length}`);
  console.log(`  readable sources     : ${urls.length}`);
  console.log(`  instagram handles    : ${watchlist.length} (watchlist only — not fetchable)`);
  console.log(`  baseline             : ${isFirstRun ? "none, this run creates it" : `${Object.keys(previous).length} sources`}\n`);
  console.log(`Checking ${urls.length} sources at concurrency ${CONCURRENCY} ...`);

  // Start from the previous baseline rather than an empty object. A partial
  // run (--limit, or an interrupted one) must not erase history for sources it
  // did not visit — an earlier version wrote only what it checked and wiped a
  // 1,116-source baseline down to one entry.
  const snapshots: Record<string, Snapshot> = { ...previous };
  const changes: {
    url: string;
    kind:
      | "content_changed"
      | "schedule_changed"
      | "went_dead"
      | "recovered"
      | "new"
      | "moved_domain"
      | "meetup_group_gone"
      | "expired_occurrence";
    detail: string;
    listingIds: string[];
  }[] = [];

  let done = 0;
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((u) => fetchPage(u)));

    batch.forEach((url, j) => {
      const { status, html, finalUrl } = results[j];
      const sig = html ? extractSignal(html) : { hash: "", when: [], mentions: 0 };
      const ids = byUrl.get(url)!.map((g) => g.id);
      const snap: Snapshot = {
        url,
        status,
        signalHash: sig.hash,
        when: sig.when,
        mentions: sig.mentions,
        ...(finalUrl && hostOf(finalUrl) && hostOf(finalUrl) !== hostOf(url)
          ? { redirectsTo: finalUrl }
          : {}),
        listingIds: ids,
        lastSeen: new Date().toISOString(),
      };
      snapshots[url] = snap;

      // A library-calendar URL pointing at ONE occurrence (…/event/12345)
      // keeps returning 200 forever, long after that occurrence happened. 18
      // listings link to one, two of them to events from 2022. The page still
      // mentions mahjong, so a keyword check passes; the giveaway is that
      // every date on it is in the past.
      if (/\/event\/\d+/.test(url) && status !== null && status < 400) {
        const dates = [...new Set(html.match(/20\d\d-\d\d-\d\d/g) || [])].sort();
        const todayIso = new Date().toISOString().slice(0, 10);
        if (dates.length && dates.every((d) => d < todayIso) && !previous[url]?.redirectsTo) {
          changes.push({
            url,
            kind: "expired_occurrence",
            detail: `links to a single occurrence whose latest date is ${dates[dates.length - 1]} — already past`,
            listingIds: ids,
          });
        }
      }

      // Meetup answers 200 with a normal-looking page for a group that no
      // longer exists, so a status check alone reads it as healthy. 26 of the
      // 57 Meetup groups referenced by live listings are already gone this
      // way, and Meetup was the only contact route on every affected listing.
      if (/meetup\.com/i.test(url) && /group not found|group you.{0,3}re looking for doesn.{0,3}t exist/i.test(visibleText(html))) {
        changes.push({
          url,
          kind: "meetup_group_gone",
          detail: 'Meetup returns "Group not found" — the group has been deleted or unpublished',
          listingIds: ids,
        });
      }

      // An organiser who rebrands leaves a redirect that works until it does
      // not. troopmahjong.com now lands on stylinbrunette.com, and
      // chicitymahjong.com on missymahjong.com — both still resolve today, but
      // the stored URL is one DNS lapse from being dead, and the listing looks
      // wrong to anyone reading it.
      if (snap.redirectsTo && !previous[url]?.redirectsTo) {
        changes.push({
          url,
          kind: "moved_domain",
          detail: `now redirects to a different host: ${snap.redirectsTo}`,
          listingIds: ids,
        });
      }

      const prev = previous[url];
      if (!prev) {
        if (!isFirstRun) changes.push({ url, kind: "new", detail: "source not seen before", listingIds: ids });
        return;
      }
      // Only compare when both readings are conclusive; a throttled response
      // says nothing about whether the page still exists.
      const bothConclusive = conclusive(prev.status) && conclusive(status);
      const wasAlive = prev.status !== null && prev.status < 400;
      const isAlive = status !== null && status < 400;

      if (bothConclusive && wasAlive && !isAlive) {
        changes.push({ url, kind: "went_dead", detail: `was HTTP ${prev.status}, now ${status}`, listingIds: ids });
      } else if (bothConclusive && !wasAlive && isAlive) {
        changes.push({ url, kind: "recovered", detail: `was HTTP ${prev.status}, now HTTP ${status}`, listingIds: ids });
      } else if (isAlive && bothConclusive && prev.signalHash !== snap.signalHash) {
        const added = snap.when.filter((w) => !prev.when.includes(w));
        const removed = prev.when.filter((w) => !snap.when.includes(w));
        if (added.length || removed.length) {
          changes.push({
            url,
            kind: "schedule_changed",
            detail: `dates/times changed${added.length ? ` — added: ${added.slice(0, 6).join(", ")}` : ""}${removed.length ? ` — gone: ${removed.slice(0, 6).join(", ")}` : ""}`,
            listingIds: ids,
          });
        } else {
          changes.push({
            url,
            kind: "content_changed",
            detail: `mahjong content changed (${prev.mentions} -> ${snap.mentions} mentions)`,
            listingIds: ids,
          });
        }
      }
    });

    done += batch.length;
    process.stdout.write(`  ${done}/${urls.length}\r`);
  }
  console.log("");

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    snapPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), snapshots }, null, 2)
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "source-changes.json"),
    JSON.stringify(
      { generatedAt: new Date().toISOString(), baseline: isFirstRun ? "created" : "compared", changes },
      null,
      2
    )
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "instagram-watchlist.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        note:
          "Instagram cannot be fetched from a server — a profile request 302s to the login wall regardless of user-agent. This is the manual check queue, ranked by how many live listings depend on each account and how long since any of them were verified. Asking organisers for a link-in-bio page (linktr.ee and similar ARE readable) converts an entry here into a source the monitor can watch.",
        handles: watchlist,
      },
      null,
      2
    )
  );

  if (isFirstRun) {
    console.log(`Baseline written for ${Object.keys(snapshots).length} sources.`);
    console.log("Commit audit/source-snapshots.json — it is the memory between runs.");
  } else {
    const byKind: Record<string, number> = {};
    for (const c of changes) byKind[c.kind] = (byKind[c.kind] || 0) + 1;
    console.log(`CHANGES SINCE LAST RUN: ${changes.length}`);
    for (const [k, v] of Object.entries(byKind)) console.log(`  ${k.padEnd(18)}: ${v}`);
    for (const c of changes.slice(0, 15)) {
      console.log(`  [${c.kind}] ${c.url.slice(0, 68)}`);
      console.log(`      ${c.detail.slice(0, 110)}`);
    }
  }
  console.log(`\n  -> ${snapPath}`);
  console.log(`  -> ${path.join(OUT_DIR, "source-changes.json")}`);
  console.log(`  -> ${path.join(OUT_DIR, "instagram-watchlist.json")} (${watchlist.length} handles to check by hand)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
