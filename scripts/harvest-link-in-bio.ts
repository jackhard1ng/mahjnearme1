#!/usr/bin/env npx tsx
/**
 * Read the link-in-bio pages the directory already points at, and pull out
 * where they actually send people.
 *
 *   npx tsx scripts/harvest-link-in-bio.ts
 *   npx tsx scripts/harvest-link-in-bio.ts --limit 20 --out audit
 *
 * WHY THIS AND NOT INSTAGRAM
 *
 * Instagram's crawler-served profile HTML is readable and carries the bio and
 * the link in bio (see scripts/check-instagram-profiles.ts). What it does not
 * survive is volume: roughly ten requests from one address and every further
 * one returns 429, which makes 460 handles impractical in a single pass.
 *
 * Link-in-bio hosts have no such limit — linktr.ee, flow.page, linkbio.co and
 * beacons.ai all return the full page to an ordinary browser User-Agent — and
 * they are where the useful part lives anyway. A mahjong organiser's Linktree
 * is their booking page, their class sign-up and their real website, which is
 * exactly what 1,000 listings with no URL are missing.
 *
 * Linktree embeds the link list as JSON in a __NEXT_DATA__ script tag. The
 * attribute order in that tag is not fixed, so it is located by id alone and
 * the JSON is read from the following brace — matching on the full opening
 * tag silently found nothing.
 */

import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const arg = (k: string, d = "") => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const OUT_DIR = arg("--out", "audit");
const BASE = arg("--url", "https://www.mahjnearme.com");
const LIMIT = Number(arg("--limit", "0"));
const CONCURRENCY = Number(arg("--concurrency", "4"));

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";

/** Hosts whose whole purpose is to forward somewhere else. */
const BIO_HOSTS = /(^|\.)(linktr\.ee|flow\.page|linkbio\.co|beacons\.ai|bio\.link|lnk\.bio|allmylinks\.com|solo\.to|campsite\.bio|taplink\.cc|milkshake\.app)$/i;

interface Harvest {
  page: string;
  status: number | null;
  title: string;
  links: { title: string; url: string }[];
  listingIds: string[];
}

async function get(url: string): Promise<{ status: number | null; html: string }> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 30000);
  try {
    const r = await fetch(url, { redirect: "follow", signal: ctl.signal, headers: { "User-Agent": UA, Accept: "text/html" } });
    return { status: r.status, html: await r.text() };
  } catch {
    return { status: null, html: "" };
  } finally {
    clearTimeout(timer);
  }
}

/** The JSON blob Next.js pages embed, located by id rather than by full tag. */
function nextData(html: string): unknown | null {
  const i = html.indexOf('id="__NEXT_DATA__"');
  if (i < 0) return null;
  const open = html.indexOf("{", i);
  const close = html.indexOf("</script>", open);
  if (open < 0 || close < 0) return null;
  try {
    return JSON.parse(html.slice(open, close));
  } catch {
    return null;
  }
}

/**
 * The organiser's own links, and only those.
 *
 * Read from `props.pageProps.account.links` rather than by walking the blob
 * for anything with a url. Linktree injects its own sponsored offers into the
 * page — Hulu trials, Fabletics, Amazon affiliate links, click.linksynergy.com
 * — and a walk cannot tell them from the organiser's. On 27 pages it collected
 * 1,168 links; the real ones number in the dozens. cdamahj alone went from 37
 * to its actual 10.
 */
function linksFrom(blob: unknown): { title: string; url: string }[] {
  const root = blob as { props?: { pageProps?: { account?: { links?: unknown }; links?: unknown } } };
  const raw = root?.props?.pageProps?.account?.links ?? root?.props?.pageProps?.links;
  if (!Array.isArray(raw)) return [];
  const out: { title: string; url: string }[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const url = typeof r.url === "string" ? r.url : "";
    if (!/^https?:\/\//i.test(url) || seen.has(url)) continue;
    seen.add(url);
    out.push({ title: String(r.title ?? "").slice(0, 140), url });
  }
  return out;
}

/** Fallback for hosts that are not Next.js: visible anchors leaving the site. */
function anchorsFrom(html: string, self: string): { title: string; url: string }[] {
  const out: { title: string; url: string }[] = [];
  const seen = new Set<string>();
  for (const m of html.matchAll(/<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>([\s\S]{0,200}?)<\/a>/gi)) {
    const url = m[1];
    let host = "";
    try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { continue; }
    if (BIO_HOSTS.test(host) || host === self || seen.has(url)) continue;
    seen.add(url);
    out.push({ title: m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 140), url });
    if (out.length >= 40) break;
  }
  return out;
}

async function main() {
  console.log(`Fetching listings from ${BASE}/api/listings ...`);
  const res = await fetch(`${BASE}/api/listings`);
  if (!res.ok) { console.error(`Failed: ${res.status}`); process.exit(1); }
  const live: Record<string, unknown>[] = (await res.json()).listings;

  // Every link-in-bio URL the directory stores, in any of its link fields.
  const pages = new Map<string, string[]>();
  for (const l of live) {
    for (const f of ["website", "registrationLink", "instagram", "sourceURL"] as const) {
      const raw = String(l[f] || "").trim();
      if (!raw) continue;
      const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      let u: URL;
      try { u = new URL(withScheme); } catch { continue; }
      if (!BIO_HOSTS.test(u.hostname.replace(/^www\./, ""))) continue;
      if (!u.pathname || u.pathname === "/") continue;
      const key = `https://${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/+$/, "")}`;
      if (!pages.has(key)) pages.set(key, []);
      pages.get(key)!.push(String(l.id));
    }
  }
  let list = [...pages.keys()].sort();
  console.log(`  ${live.length} listings, ${list.length} distinct link-in-bio pages`);
  if (LIMIT) list = list.slice(0, LIMIT);

  const results: Harvest[] = [];
  for (let i = 0; i < list.length; i += CONCURRENCY) {
    const batch = list.slice(i, i + CONCURRENCY);
    const got = await Promise.all(batch.map((u) => get(u)));
    batch.forEach((page, j) => {
      const { status, html } = got[j];
      let self = "";
      try { self = new URL(page).hostname.replace(/^www\./, ""); } catch { /* keep "" */ }
      const blob = nextData(html);
      const links = blob ? linksFrom(blob).filter((l) => { 
        try { return !BIO_HOSTS.test(new URL(l.url).hostname.replace(/^www\./, "")); } catch { return false; }
      }) : anchorsFrom(html, self);
      results.push({
        page, status,
        title: (html.match(/<title>([^<]{0,140})<\/title>/i)?.[1] ?? "").trim(),
        links,
        listingIds: pages.get(page) ?? [],
      });
    });
    process.stdout.write(`  ${Math.min(i + CONCURRENCY, list.length)}/${list.length}\r`);
  }
  console.log("");

  const ok = results.filter((r) => r.status === 200);
  const dead = results.filter((r) => r.status !== 200);
  const withLinks = ok.filter((r) => r.links.length > 0);
  const totalLinks = withLinks.reduce((a, r) => a + r.links.length, 0);

  console.log("RESULT");
  console.log(`  pages read       : ${results.length}`);
  console.log(`  reachable        : ${ok.length}`);
  console.log(`  dead / unreadable: ${dead.length}`);
  console.log(`  with links       : ${withLinks.length}`);
  console.log(`  links harvested  : ${totalLinks}`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const out = path.join(OUT_DIR, `link-in-bio-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), pages: results }, null, 2));
  console.log(`\n  -> ${out}`);
  for (const r of dead) console.log(`   DEAD  ${r.page}  (${r.status ?? "no response"})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
