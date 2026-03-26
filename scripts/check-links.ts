/**
 * Link health checker for listings.json.
 *
 * Checks every external URL in the listings data for:
 * - 404, 410, 5xx status codes
 * - Domain redirects (possible hijacking)
 * - Timeouts (10 seconds)
 *
 * Usage:
 *   npx tsx scripts/check-links.ts
 *   npx tsx scripts/check-links.ts --limit=50   # check first 50 listings
 *   npx tsx scripts/check-links.ts --fix        # also clear broken URLs in the JSON
 */

import * as fs from "fs";
import * as path from "path";

const LISTINGS_PATH = path.join(process.cwd(), "public", "listings.json");
const TIMEOUT_MS = 10_000;
const RATE_LIMIT_MS = 200; // 5 req/sec
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
    // Some servers reject HEAD — try GET
    try {
      const res2 = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { "User-Agent": "MahjNearMe Link Checker/1.0" },
      });
      const originalDomain = extractDomain(url);
      const finalDomain = extractDomain(res2.url);
      if (originalDomain && finalDomain && originalDomain !== finalDomain) {
        return { status: res2.status, redirectDomain: finalDomain };
      }
      return { status: res2.status };
    } catch {
      return { status: "error" };
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1]) : Infinity;
  const doFix = args.includes("--fix");

  console.log(`Reading ${LISTINGS_PATH}...`);
  const raw = fs.readFileSync(LISTINGS_PATH, "utf-8");
  const data = JSON.parse(raw);
  const listings = data.listings as Record<string, unknown>[];

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

  for (const check of checks) {
    const result = await checkUrl(check.url);
    checked++;

    if (result.status === "timeout") {
      issues.push({ listingId: check.id, listingName: check.name, field: check.field, url: check.url, status: "timeout", detail: "Request timed out after 10s" });
      console.log(`  [${checked}/${checks.length}] TIMEOUT: ${check.name} → ${check.field}`);
    } else if (result.status === "error") {
      issues.push({ listingId: check.id, listingName: check.name, field: check.field, url: check.url, status: "error", detail: "Connection failed" });
      console.log(`  [${checked}/${checks.length}] ERROR: ${check.name} → ${check.field}`);
    } else if (result.redirectDomain) {
      issues.push({ listingId: check.id, listingName: check.name, field: check.field, url: check.url, status: "redirect", detail: `Redirected to ${result.redirectDomain}` });
      console.log(`  [${checked}/${checks.length}] REDIRECT: ${check.name} → ${check.field} → ${result.redirectDomain}`);
    } else if (typeof result.status === "number" && (result.status === 404 || result.status === 410 || result.status >= 500)) {
      issues.push({ listingId: check.id, listingName: check.name, field: check.field, url: check.url, status: result.status, detail: `HTTP ${result.status}` });
      console.log(`  [${checked}/${checks.length}] ${result.status}: ${check.name} → ${check.field}`);
    } else if (checked % 100 === 0) {
      console.log(`  [${checked}/${checks.length}] ... checking`);
    }

    await sleep(RATE_LIMIT_MS);
  }

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

  // Fix mode: clear broken URLs
  if (doFix && issues.length > 0) {
    console.log(`\nFixing ${issues.length} broken links...`);
    for (const issue of issues) {
      const listing = listings.find((l) => (l as Record<string, unknown>).id === issue.listingId) as Record<string, unknown> | undefined;
      if (listing) {
        const notes = (listing.notes as string) || "";
        listing[issue.field] = null;
        listing.notes = `${notes} [Link removed ${new Date().toISOString().split("T")[0]}: ${issue.field} → ${issue.detail}]`.trim();
      }
    }
    fs.writeFileSync(LISTINGS_PATH, JSON.stringify(data, null, 2));
    console.log(`Saved updated listings.json`);
  }

  // Write report file
  const reportPath = path.join(process.cwd(), "link-report.json");
  fs.writeFileSync(reportPath, JSON.stringify({ checked, issues, timestamp: new Date().toISOString() }, null, 2));
  console.log(`\nReport saved to ${reportPath}`);
}

main().catch(console.error);
