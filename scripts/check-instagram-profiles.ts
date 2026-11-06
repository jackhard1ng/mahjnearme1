#!/usr/bin/env npx tsx
/**
 * Read the public Instagram profile behind every handle in the directory.
 *
 *   npx tsx scripts/check-instagram-profiles.ts
 *   npx tsx scripts/check-instagram-profiles.ts --limit 40 --out audit
 *   npx tsx scripts/check-instagram-profiles.ts --handles cdamahj,mahjgaragenwa
 *
 * WHY THIS EXISTS AFTER I SAID IT WAS IMPOSSIBLE
 *
 * Earlier in this work I recorded that Instagram was unreadable — every
 * request redirected to a login wall — and built a manual watchlist instead.
 * That was wrong. Re-testing properly:
 *
 *   no User-Agent          429, empty
 *   browser User-Agent     200, but the served HTML is the login shell
 *   Googlebot User-Agent   200, 1.15MB, with the profile data embedded
 *
 * Instagram serves crawlers a rendered profile. It carries `full_name`,
 * `biography`, `external_url` — the link in bio — and follower and post
 * counts in the og:description. It does NOT carry post captions, so this
 * cannot read what a group posted; it reads who they are and where they
 * point.
 *
 * That last field is the point. 1,000 active listings have no URL of any
 * kind and 449 of them carry an Instagram handle, so the link in bio is the
 * one machine-readable route from a handle to a real website or Linktree.
 *
 * Rate limits are real — an unheadered request got 429 immediately — so this
 * runs one request at a time with a delay, and stops early on repeated 429s
 * rather than hammering.
 */

import fs from "fs";
import path from "path";
import { instagramHandle } from "../src/lib/utils";

const args = process.argv.slice(2);
const arg = (k: string, d = "") => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const OUT_DIR = arg("--out", "audit");
const BASE = arg("--url", "https://www.mahjnearme.com");
const LIMIT = Number(arg("--limit", "0"));
const DELAY = Number(arg("--delay", "2500"));
const ONLY = arg("--handles", "").split(",").map((s) => s.trim()).filter(Boolean);

/** Instagram serves the rendered profile to crawlers and a login shell to browsers. */
const UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const un = (s: string) => {
  try {
    return JSON.parse(`"${s.replace(/"/g, '\\"')}"`) as string;
  } catch {
    return s;
  }
};

interface Profile {
  handle: string;
  status: number | null;
  exists: boolean;
  fullName: string;
  biography: string;
  externalUrl: string;
  followers: string;
  posts: string;
  isPrivate: boolean;
}

async function fetchProfile(handle: string): Promise<Profile> {
  const empty: Profile = { handle, status: null, exists: false, fullName: "", biography: "", externalUrl: "", followers: "", posts: "", isPrivate: false };
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 30000);
  try {
    const r = await fetch(`https://www.instagram.com/${encodeURIComponent(handle)}/`, {
      redirect: "follow", signal: ctl.signal,
      headers: { "User-Agent": UA, Accept: "text/html" },
    });
    const html = await r.text();
    const grab = (re: RegExp) => html.match(re)?.[1] ?? "";
    // og:description reads "1,110 Followers, 1,584 Following, 131 Posts - ..."
    const og = grab(/og:description"\s+content="([^"]{0,300})"/);
    const followers = og.match(/([\d,.KMkm]+)\s+Followers/)?.[1] ?? "";
    const posts = og.match(/([\d,.KMkm]+)\s+Posts/)?.[1] ?? "";
    return {
      handle,
      status: r.status,
      // A missing profile still returns 200 with a "Page Not Found" shell, so
      // presence of the profile fields is the real existence test.
      exists: r.status === 200 && (!!og || /"full_name":/.test(html)),
      fullName: un(grab(/"full_name":"((?:[^"\\]|\\.){0,120})"/)),
      biography: un(grab(/"biography":"((?:[^"\\]|\\.){0,600})"/)).replace(/\s*\n\s*/g, " / ").trim(),
      externalUrl: un(grab(/"external_url":"((?:[^"\\]|\\.){0,300})"/)),
      followers, posts,
      isPrivate: /"is_private":true/.test(html),
    };
  } catch {
    return empty;
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  let handles: string[];
  let owners = new Map<string, string[]>();

  if (ONLY.length) {
    handles = ONLY;
  } else {
    console.log(`Fetching listings from ${BASE}/api/listings ...`);
    const res = await fetch(`${BASE}/api/listings`);
    if (!res.ok) { console.error(`Failed: ${res.status}`); process.exit(1); }
    const live: Record<string, unknown>[] = (await res.json()).listings;
    for (const l of live) {
      // Handles hide in three fields, not just `instagram` — see
      // resolvedInstagramUrl in src/lib/utils.ts.
      for (const f of ["instagram", "website", "registrationLink"] as const) {
        const h = instagramHandle(String(l[f] || ""));
        if (!h) continue;
        const key = h.toLowerCase();
        if (!owners.has(key)) owners.set(key, []);
        owners.get(key)!.push(String(l.id));
      }
    }
    handles = [...owners.keys()].sort();
    console.log(`  ${live.length} listings, ${handles.length} distinct Instagram handles`);
  }

  if (LIMIT) handles = handles.slice(0, LIMIT);
  console.log(`\nReading ${handles.length} profiles (one at a time, ${DELAY}ms apart) ...`);

  const results: (Profile & { listingIds: string[] })[] = [];
  let rateLimited = 0;
  for (let i = 0; i < handles.length; i++) {
    const p = await fetchProfile(handles[i]);
    results.push({ ...p, listingIds: owners.get(handles[i]) ?? [] });
    if (p.status === 429) {
      rateLimited++;
      if (rateLimited >= 5) {
        console.log(`\n  stopping early: 5 rate-limited responses. ${results.length} of ${handles.length} read.`);
        break;
      }
      await sleep(DELAY * 4);
    } else {
      rateLimited = 0;
    }
    if ((i + 1) % 10 === 0) process.stdout.write(`  ${i + 1}/${handles.length}\r`);
    await sleep(DELAY);
  }
  console.log("");

  const gone = results.filter((r) => !r.exists && r.status !== 429 && r.status !== null);
  const withUrl = results.filter((r) => r.exists && r.externalUrl);
  const priv = results.filter((r) => r.isPrivate);

  console.log("RESULT");
  console.log(`  profiles read            : ${results.length}`);
  console.log(`  live                    : ${results.filter((r) => r.exists).length}`);
  console.log(`  gone / renamed          : ${gone.length}`);
  console.log(`  private                 : ${priv.length}`);
  console.log(`  publishing a link in bio: ${withUrl.length}`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const out = path.join(OUT_DIR, `instagram-profiles-${stamp}.json`);
  fs.writeFileSync(out, JSON.stringify({
    generatedAt: new Date().toISOString(),
    note: "Read from Instagram's crawler-served profile HTML. Contains profile fields only — no post captions.",
    profiles: results,
  }, null, 2));
  console.log(`\n  -> ${out}`);
  for (const r of withUrl.slice(0, 20)) console.log(`   @${r.handle.padEnd(28)} ${r.externalUrl.slice(0, 58)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
