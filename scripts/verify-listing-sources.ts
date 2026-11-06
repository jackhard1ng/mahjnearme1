#!/usr/bin/env npx tsx
/**
 * Check every active listing against its own source URL and triage the result.
 *
 * The problem this addresses: nothing has been re-verified since the March
 * import, so more than half of all listings now render "Not recently verified"
 * on their card. That badge is accurate, but most of those listings are
 * library and JCC games that have run continuously for years — the data is
 * stale, not wrong. Re-checking 2,000+ listings by hand is not realistic, so
 * this narrows it to the ones that actually need a human.
 *
 * Usage:
 *   npx tsx scripts/verify-listing-sources.ts
 *   npx tsx scripts/verify-listing-sources.ts --out ./audit --concurrency 20
 *   npx tsx scripts/verify-listing-sources.ts --limit 100      (sample run)
 *
 * Each listing with a website or registrationLink is fetched and bucketed:
 *
 *   confirmed  200, and the page still mentions mahjong. The organiser is
 *              still advertising it. Strong evidence the listing is live.
 *   no_mention 200 on a real event page, but no mahjong term on it. The
 *              programme has most likely ended. Needs a human.
 *   homepage_o 200, but the listing cites the organisation's front door
 *              rather than an event page. A homepage was never going to
 *              mention one session, so this proves nothing either way — it is
 *              a source-quality problem, not a dead listing.
 *   dead       404, other 5xx, DNS failure or TLS failure. The listing's only
 *              contact route is broken.
 *   blocked    401/403/406/429/503, or a challenge page. Bot protection or
 *              throttling, NOT evidence of anything — kept separate from
 *              `dead` so it is never mistaken for a broken listing.
 *   no_source  No URL to check at all. Can only be verified by a human.
 *
 * IMPORTANT — what `confirmed` does and does not mean.
 *
 * It means the source page still mentions mahjong. It does NOT confirm the
 * day, the time, the price, or that the specific session still runs. A
 * library events page mentioning mahjong somewhere is not proof that the
 * Tuesday 10am session survived.
 *
 * So this script deliberately does NOT emit a corrections file that stamps
 * lastVerified. Writing today's date off a keyword match would manufacture
 * exactly the false confidence the "Not recently verified" badge exists to
 * prevent, at 2,000-listing scale. The output is a triage list: work the
 * `dead` and `no_mention` buckets first, and treat `confirmed` as "probably
 * fine, low priority to re-check" rather than as verified.
 *
 * The homepage_only bucket is worth its own pass: those listings would be
 * far more useful, and actually re-verifiable next time, if their URL pointed
 * at the event page instead of the front door.
 */

import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const BASE_URL = args.includes("--url")
  ? args[args.indexOf("--url") + 1]
  : "https://www.mahjnearme.com";
const OUT_DIR = args.includes("--out") ? args[args.indexOf("--out") + 1] : "audit";
const CONCURRENCY = args.includes("--concurrency")
  ? Number(args[args.indexOf("--concurrency") + 1])
  : 20;
const LIMIT = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : Infinity;

const MAHJONG_TERMS = ["mahjong", "mah jongg", "mah-jongg", "mah jong", "majong", "maj jongg"];

type Bucket = "confirmed" | "no_mention" | "homepage_only" | "dead" | "blocked" | "no_source";

interface Listing {
  id: string;
  name: string;
  city: string;
  state: string;
  status: string;
  website?: string;
  registrationLink?: string;
  lastVerified?: string;
  isRecurring: boolean;
  eventDate: string | null;
}

interface Result {
  id: string;
  name: string;
  city: string;
  state: string;
  url: string | null;
  httpStatus: number | null;
  bucket: Bucket;
  detail: string;
  lastVerified: string | null;
}

function isExpired(g: Listing, today: Date): boolean {
  if (g.isRecurring) return false;
  if (!g.eventDate || !/^\d{4}-\d{2}-\d{2}/.test(g.eventDate)) return false;
  const [y, m, d] = g.eventDate.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d) < today;
}

async function check(url: string): Promise<{ status: number | null; body: string; err: string }> {
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
    const body = ct.includes("html") || ct.includes("text") ? (await res.text()).slice(0, 400000) : "";
    return { status: res.status, body, err: "" };
  } catch (e) {
    return { status: null, body: "", err: (e as Error).message.slice(0, 80) };
  } finally {
    clearTimeout(timer);
  }
}

/** Strip tags so a keyword can't match inside a script blob or a meta tag. */
function visibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .toLowerCase();
}

/**
 * True when the URL is just an organisation's front door (no path). These
 * cannot corroborate a specific session no matter what the page says, so a
 * missing keyword on one proves nothing about the listing.
 */
function isBareDomain(url: string): boolean {
  try {
    const u = new URL(url);
    return u.pathname === "/" || u.pathname === "";
  } catch {
    return false;
  }
}

function classify(status: number | null, body: string, err: string, url: string): { bucket: Bucket; detail: string } {
  if (status === null) {
    return { bucket: "dead", detail: `unreachable: ${err || "connection failed"}` };
  }
  if ([401, 403, 406, 429].includes(status)) {
    return { bucket: "blocked", detail: `HTTP ${status} — bot protection, not evidence of a dead listing` };
  }
  // 503 is overwhelmingly throttling or an interstitial rather than a removed
  // page — several well-run library and JCC sites return it to this checker.
  // Calling it "dead" would flag healthy listings for deletion.
  if (status === 503) {
    return { bucket: "blocked", detail: `HTTP 503 — throttled or interstitial, not evidence of a dead listing` };
  }
  if (status === 404 || status >= 500) {
    return { bucket: "dead", detail: `HTTP ${status}` };
  }
  if (status >= 200 && status < 400) {
    const text = visibleText(body);
    if (!text.trim()) {
      return { bucket: "blocked", detail: `HTTP ${status} but empty body — likely JS-rendered or a challenge page` };
    }
    const hit = MAHJONG_TERMS.find((t) => text.includes(t));
    if (hit) return { bucket: "confirmed", detail: `HTTP ${status}, page still mentions "${hit}"` };
    if (isBareDomain(url)) {
      return {
        bucket: "homepage_only",
        detail: `HTTP ${status}, but the listing cites the organisation homepage rather than an event page — unverifiable either way`,
      };
    }
    return { bucket: "no_mention", detail: `HTTP ${status} but no mahjong term on this specific page` };
  }
  return { bucket: "blocked", detail: `HTTP ${status}` };
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
  const live = all.filter((g) => g.status === "active" && !isExpired(g, today)).slice(0, LIMIT);

  const withUrl = live.filter((g) => {
    const u = g.website || g.registrationLink || "";
    return /^https?:\/\//i.test(u);
  });
  const noSource = live.filter((g) => !withUrl.includes(g));

  console.log(`  live listings   : ${live.length}`);
  console.log(`  with a source   : ${withUrl.length}`);
  console.log(`  no source URL   : ${noSource.length}\n`);

  const results: Result[] = noSource.map((g) => ({
    id: g.id,
    name: g.name.trim(),
    city: g.city.trim(),
    state: g.state.trim(),
    url: null,
    httpStatus: null,
    bucket: "no_source" as Bucket,
    detail: "No website or registration link on the listing",
    lastVerified: g.lastVerified || null,
  }));

  // Group by URL so a shared calendar page is fetched once, not fifty times.
  const byUrl = new Map<string, Listing[]>();
  for (const g of withUrl) {
    const u = (g.website || g.registrationLink)!.trim();
    if (!byUrl.has(u)) byUrl.set(u, []);
    byUrl.get(u)!.push(g);
  }
  const urls = [...byUrl.keys()];
  console.log(`Checking ${urls.length} unique URLs at concurrency ${CONCURRENCY} ...`);

  let done = 0;
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const checked = await Promise.all(batch.map((u) => check(u)));
    batch.forEach((u, j) => {
      const { status, body, err } = checked[j];
      const { bucket, detail } = classify(status, body, err, u);
      for (const g of byUrl.get(u)!) {
        results.push({
          id: g.id,
          name: g.name.trim(),
          city: g.city.trim(),
          state: g.state.trim(),
          url: u,
          httpStatus: status,
          bucket,
          detail,
          lastVerified: g.lastVerified || null,
        });
      }
    });
    done += batch.length;
    process.stdout.write(`  ${done}/${urls.length}\r`);
  }
  console.log("");

  const counts: Record<Bucket, number> = {
    confirmed: 0, no_mention: 0, homepage_only: 0, dead: 0, blocked: 0, no_source: 0,
  };
  for (const r of results) counts[r.bucket]++;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, "source-verification.json");
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        checkedListings: results.length,
        uniqueUrls: urls.length,
        counts,
        caveat:
          "`confirmed` means the source page still mentions mahjong. It does NOT confirm day, time, price, or that this specific session still runs. Do not treat it as a verification stamp.",
        results: results.sort((a, b) => a.bucket.localeCompare(b.bucket) || a.state.localeCompare(b.state)),
      },
      null,
      2
    )
  );

  const pct = (n: number) => `${((n / results.length) * 100).toFixed(1)}%`;
  console.log("TRIAGE");
  console.log(`  confirmed  (source still mentions mahjong) : ${counts.confirmed} ${pct(counts.confirmed)}`);
  console.log(`  no_mention (event page, mahjong gone)      : ${counts.no_mention} ${pct(counts.no_mention)}`);
  console.log(`  homepage_o (cites a homepage, not an event): ${counts.homepage_only} ${pct(counts.homepage_only)}`);
  console.log(`  dead       (404 / 5xx / unreachable)       : ${counts.dead} ${pct(counts.dead)}`);
  console.log(`  blocked    (bot protection — no evidence)  : ${counts.blocked} ${pct(counts.blocked)}`);
  console.log(`  no_source  (nothing to check)              : ${counts.no_source} ${pct(counts.no_source)}`);
  console.log(`\n  -> ${outPath}`);
  console.log(`\nWork the 'dead' bucket first, then 'no_mention'. 'confirmed' is low priority.`);
  console.log(`'blocked' is not evidence of anything — do not deactivate those.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
