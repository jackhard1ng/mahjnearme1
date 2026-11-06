/**
 * Link health checker for the live directory.
 *
 * Usage:
 *   npx tsx scripts/check-links.ts
 *   npx tsx scripts/check-links.ts --limit=50
 *   npx tsx scripts/check-links.ts --file        # read data/listings.json instead
 *   npx tsx scripts/check-links.ts --out audit/dead-links.json
 *
 * Reads production by default. It used to read data/listings.json, which is a
 * stale legacy copy — 2,744 listings against production's 3,801, and still
 * carrying full state names where production uses two-letter codes. Checking
 * links in a file the site does not serve reports on a site that does not
 * exist.
 *
 * Only active listings are checked; the 922 inactive ones are not shown to
 * anybody.
 *
 * WHAT COUNTS AS BROKEN
 *
 * 404 and 410, and a redirect that lands on a different domain. Not 403, and
 * NOT 503. An earlier audit in this repo learned that the hard way: healthy
 * library and JCC sites flap between 403 and 200 and between 200 and 503
 * depending on which edge node answers, and counting those as dead produced
 * six false alarms per three hundred sources. A 5xx is a server having a
 * moment, not a page that has gone.
 */

import * as fs from "fs";
import * as path from "path";

const LISTINGS_PATH = path.join(process.cwd(), "data", "listings.json");
const TIMEOUT_MS = 10_000;
const CONCURRENCY = 12;
const URL_FIELDS = ["website", "sourceURL", "registrationLink", "facebookGroup", "instagram"] as const;

interface LinkIssue {
  listingId: string;
  listingName: string;
  field: string;
  url: string;
  status: number | "timeout" | "error" | "redirect";
  detail: string;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

/** GET the URL, used when HEAD is unreliable or refused. */
async function getFallback(url: string, headStatus: number | "timeout" | "error"): Promise<{ status: number | "timeout" | "error"; redirectDomain?: string }> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "MahjNearMe Link Checker/1.0" },
    });
    const originalDomain = extractDomain(url);
    const finalDomain = extractDomain(res.url);
    if (originalDomain && finalDomain && originalDomain !== finalDomain) {
      return { status: res.status, redirectDomain: finalDomain };
    }
    return { status: res.status };
  } catch {
    return { status: headStatus === "timeout" ? "timeout" : "error" };
  }
}

async function checkUrl(url: string): Promise<{ status: number | "timeout" | "error"; redirectDomain?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "MahjNearMe Link Checker/1.0" },
    });
    clearTimeout(timer);

    // Some servers answer HEAD with 404, 405 or 501 while serving the page
    // perfectly well to GET. 92ny.org does exactly that, and taking its HEAD
    // at face value would have cleared a working link off a live listing. A
    // "gone" verdict is only accepted once GET agrees.
    if (res.status === 404 || res.status === 405 || res.status === 501) {
      return await getFallback(url, res.status);
    }

    // Check for domain redirect (hijacking)
    const originalDomain = extractDomain(url);
    const finalDomain = extractDomain(res.url);
    if (originalDomain && finalDomain && originalDomain !== finalDomain) {
      return { status: res.status, redirectDomain: finalDomain };
    }

    return { status: res.status };
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") {
      return { status: "timeout" };
    }
    // Some servers reject HEAD outright — try GET.
    return await getFallback(url, "error");
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1]) : Infinity;

  const useFile = args.includes("--file");
  const outArg = args.find((a) => a.startsWith("--out="));
  const baseArg = args.find((a) => a.startsWith("--url="));
  const base = baseArg ? baseArg.split("=")[1] : "https://www.mahjnearme.com";

  let listings: Record<string, unknown>[];
  if (useFile) {
    console.log(`Reading ${LISTINGS_PATH}...`);
    listings = JSON.parse(fs.readFileSync(LISTINGS_PATH, "utf-8")).listings;
  } else {
    console.log(`Fetching ${base}/api/listings ...`);
    const res = await fetch(`${base}/api/listings`);
    if (!res.ok) { console.error(`Failed: ${res.status}`); process.exit(1); }
    listings = (await res.json()).listings;
  }
  const before = listings.length;
  listings = listings.filter((l) => String(l.status ?? "active") === "active");
  console.log(`  ${before} listings, ${listings.length} active\n`);

  // Collect all URLs to check
  const checks: { index: number; id: string; name: string; field: string; url: string }[] = [];

  for (let i = 0; i < Math.min(listings.length, limit); i++) {
    const l = listings[i];
    for (const field of URL_FIELDS) {
      const val = l[field] as string | null;
      if (val && typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://"))) {
        checks.push({ index: i, id: l.id as string, name: (l.name as string).slice(0, 50), field, url: val });
      }
    }
  }

  console.log(`Found ${checks.length} URLs to check across ${Math.min(listings.length, limit)} listings\n`);

  const issues: LinkIssue[] = [];
  let checked = 0;

  for (let i = 0; i < checks.length; i += CONCURRENCY) {
    const batch = checks.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((c) => checkUrl(c.url)));
    batch.forEach((check, j) => {
      const result = results[j];
      checked++;
      const add = (status: LinkIssue["status"], detail: string) =>
        issues.push({ listingId: check.id, listingName: check.name, field: check.field, url: check.url, status, detail });

      if (result.status === "timeout") add("timeout", "Request timed out after 10s");
      else if (result.status === "error") add("error", "Connection failed");
      else if (result.redirectDomain) add("redirect", `Redirected to ${result.redirectDomain}`);
      // 404/410 only. A 403 or 5xx is bot protection or a server having a
      // moment — see the note at the top of this file.
      else if (typeof result.status === "number" && (result.status === 404 || result.status === 410)) {
        add(result.status, `HTTP ${result.status}`);
      }
    });
    process.stdout.write(`  ${Math.min(i + CONCURRENCY, checks.length)}/${checks.length}\r`);
  }
  console.log("");

  // Report
  console.log(`\n${"=".repeat(60)}`);
  console.log(`LINK HEALTH REPORT`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Checked: ${checked} URLs`);
  console.log(`Issues found: ${issues.length}`);
  console.log();

  if (issues.length > 0) {
    for (const issue of issues) {
      console.log(`  ${issue.listingName}`);
      console.log(`    Field: ${issue.field}`);
      console.log(`    URL: ${issue.url}`);
      console.log(`    Issue: ${issue.detail}`);
      console.log();
    }
  }

  // Emit a correction file rather than editing anything in place.
  //
  // This used to write the cleared URLs back into data/listings.json. That is
  // the stale legacy copy the site does not serve, so the "fix" changed
  // nothing a visitor would see. Everything else in this repo applies through
  // audit/*.json and scripts/apply-audit-corrections.ts, and this now does the
  // same. Only 404 and 410 become operations: a timeout, a connection failure
  // or a cross-domain redirect is worth a human look, not an automatic wipe.
  const outPath = outArg ? outArg.split("=")[1] : path.join("audit", "dead-links.json");
  // One operation per listing, not per field. A listing whose website and
  // registrationLink are the same dead URL produces two findings, and two
  // operations against one id would leave whichever applied second to
  // overwrite the first.
  const byListing = new Map<string, { deadByField: Record<string, string> }>();
  for (const i of issues) {
    if (i.status !== 404 && i.status !== 410) continue;
    if (!byListing.has(i.listingId)) byListing.set(i.listingId, { deadByField: {} });
    byListing.get(i.listingId)!.deadByField[i.field] = i.url;
  }
  // Most dead links here are an event page that has aged out — a JCC calendar
  // entry dated February, a library event permalink — while the organisation's
  // own site is perfectly alive. Emptying the field throws the organiser away
  // along with the stale URL. Where the root of the same domain answers, the
  // field is set to the root instead: less precise than a working event page,
  // far more use than nothing.
  const roots = new Map<string, boolean>();
  const deadUrls = [...new Set(issues.filter((i) => i.status === 404 || i.status === 410).map((i) => i.url))];
  for (let i = 0; i < deadUrls.length; i += CONCURRENCY) {
    const batch = deadUrls.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async (u) => {
      let root = "";
      try { root = new URL(u).origin; } catch { return; }
      if (root === u || root + "/" === u) return; // the root itself is what died
      const r = await checkUrl(root);
      roots.set(u, typeof r.status === "number" && r.status < 400 && !r.redirectDomain);
    }));
  }

  const today = new Date().toISOString().slice(0, 10);
  const ops = [...byListing].map(([id, e]) => {
    const updates: Record<string, string> = {};
    const notes: string[] = [];
    for (const [field, url] of Object.entries(e.deadByField)) {
      let root = "";
      try { root = new URL(url).origin; } catch { /* leave empty */ }
      if (root && roots.get(url)) {
        updates[field] = root;
        notes.push(`${field} → ${url} is gone; ${root} still answers, so the field points there`);
      } else {
        updates[field] = "";
        notes.push(`${field} → ${url} is gone and ${root || "its domain"} does not answer either, so the field is cleared`);
      }
    }
    return {
      id,
      updates,
      reason: `Dead link${notes.length > 1 ? "s" : ""} confirmed ${today} by HEAD and then GET. ${notes.join("; ")}. The listing itself is untouched — the session may well still run, only the link to it has gone.`,
    };
  });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(ops, null, 2));
  console.log(`\n  -> ${outPath}  (${ops.length} operations)`);

  const reportPath = path.join("audit", "link-report.json");
  fs.writeFileSync(reportPath, JSON.stringify({ checked, issues, timestamp: new Date().toISOString() }, null, 2));
  console.log(`  -> ${reportPath}  (all ${issues.length} findings, including the ones not turned into operations)`);
}

main().catch(console.error);
