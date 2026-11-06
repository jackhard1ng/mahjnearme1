/**
 * Regression tests for the publicly served dataset.
 *
 * Three files under public/ were served as static assets, so the whole
 * directory, venue addresses and organizer contact details included, was
 * readable by anyone with no subscription and no authentication. They are
 * removed, and public/listings.json is relocated to data/ where it is bundled
 * at build time rather than published.
 *
 * These tests pin two things: that nothing is in public/ that should not be,
 * and that the relocation did not break the code paths that read the dataset.
 *
 * No contact details are reproduced here or in any report. Field presence and
 * counts only.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Remove comments so a check matches code, not prose.
 *
 * Several of these files explain in a comment why the dataset moved, quoting
 * the old published path. That is documentation, not a live reference.
 */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((l) => l.replace(/\/\/.*$/, ""))
    .join("\n");
}

describe("the dataset is no longer published", () => {
  test("public/listings.json is gone", () => {
    assert.equal(existsSync("public/listings.json"), false);
  });

  test("both verification-audit exports are gone", () => {
    assert.equal(existsSync("public/verification-audit-complete.json"), false);
    assert.equal(existsSync("public/verification-audit-2026-04-06.json"), false);
  });

  test("public/ contains no bulk data file at all", () => {
    // A guard against the next export being dropped in here. public/ is
    // served verbatim, so anything data-shaped in it is published.
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(json|csv|tsv|ndjson|sql|xlsx?)$/i.test(entry.name)) continue;
        // A small config file (manifest, site.webmanifest) is fine; a dataset
        // is not. 256 KiB is far above any config and far below any export.
        if (statSync(full).size > 256 * 1024) offenders.push(`${full} (${statSync(full).size} bytes)`);
      }
    };
    if (existsSync("public")) walk("public");
    assert.deepEqual(offenders, [], `bulk data under public/:\n${offenders.join("\n")}`);
  });

  test("the dataset is present in data/ and is the file the loader expects", () => {
    assert.ok(existsSync("data/listings.json"));
    const raw = JSON.parse(readFileSync("data/listings.json", "utf8"));
    assert.ok(Array.isArray(raw.listings), "data/listings.json must hold a listings array");
    assert.ok(raw.listings.length > 1000, "the dataset should be the full export");
  });
});

describe("the relocation did not break any reader", () => {
  test("no source file still references public/listings.json", () => {
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(ts|tsx|mjs|js|json)$/.test(entry.name)) continue;
        if (full.includes("package-lock.json")) continue;
        // Skip this file: it names the old path in its own assertions.
        if (full.endsWith("public-data-exposure.test.ts")) continue;
        // Comments explaining WHY the file moved are not references to it.
        const src = stripComments(readFileSync(full, "utf8"));
        if (/public[/\\]listings\.json/.test(src)) hits.push(full);
      }
    };
    for (const d of ["src", "scripts", "tests"]) if (existsSync(d)) walk(d);
    assert.deepEqual(hits, [], `still referencing the published path:\n${hits.join("\n")}`);
  });

  test("the synchronous loader's require path resolves on disk", () => {
    // listings-data.ts is the fallback /api/listings uses when Firestore is
    // unavailable, and what mock-data.ts is backed by. If the relocation broke
    // it, public listing reads would fail during a Firestore outage.
    //
    // It is checked by resolving the path rather than by importing the module:
    // it uses CommonJS `require`, which Next's bundler provides and Node's ESM
    // loader does not. That the require also BUNDLES correctly is verified by
    // `npm run build`, which is part of this PR's gate.
    const file = "src/lib/listings-data.ts";
    const src = stripComments(readFileSync(file, "utf8"));
    const m = src.match(/require\("([^"]*listings\.json)"\)/);
    assert.ok(m, "listings-data.ts must require the dataset");
    const resolved = path.resolve(path.dirname(file), m![1]);
    assert.ok(existsSync(resolved), `require path does not resolve: ${m![1]} -> ${resolved}`);
    assert.match(resolved, /[/\\]data[/\\]listings\.json$/, "must resolve into data/, not public/");
  });

  test("the organizer-populate route reads the module instead of its own public URL", () => {
    const raw = readFileSync("src/app/api/organizers/populate/route.ts", "utf8");
    // Match code, not the comment that quotes the old call for context.
    const src = stripComments(raw);
    // It used to fetch(`${baseUrl}/listings.json`), which REQUIRED the dataset
    // to be world-readable in order to work. That is both the bug and the
    // reason the file could not simply be deleted.
    assert.doesNotMatch(src, /\/listings\.json`\)/, "must not fetch the dataset over HTTP");
    assert.doesNotMatch(src, /fetch\(`\$\{baseUrl\}/, "must not fetch its own public URL");
    assert.match(src, /require\(".*data\/listings\.json"\)/, "must read the bundled module");
  });

  test("the populate route's require path resolves from its own directory", () => {
    const routeDir = path.dirname("src/app/api/organizers/populate/route.ts");
    const src = stripComments(readFileSync("src/app/api/organizers/populate/route.ts", "utf8"));
    const m = src.match(/require\("([^"]*data\/listings\.json)"\)/);
    assert.ok(m, "require path not found");
    const resolved = path.resolve(routeDir, m![1]);
    assert.ok(existsSync(resolved), `require path does not resolve: ${m![1]} -> ${resolved}`);
  });

  test("the geocoding script points at the new location", () => {
    const src = readFileSync("scripts/batch-geocode.ts", "utf8");
    assert.match(src, /"data", "listings\.json"/);
  });
});
