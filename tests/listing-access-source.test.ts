/**
 * SOURCE-INSPECTING TESTS for the proposed access control.
 *
 * ===========================================================================
 * CATEGORY: SOURCE-INSPECTING. Every assertion in this file reads a file and
 * matches its TEXT. Nothing here executes a request, a route handler, or an
 * authorization decision.
 *
 * WHAT THESE CAN CATCH: a guard being deleted, a call site being missed, a
 * cache header regressing, the proposal and the code drifting apart.
 *
 * WHAT THESE CANNOT CATCH: whether authorization actually works. Every
 * assertion in this file would still pass against an endpoint that returns
 * every field to everyone, because that is the current state and these tests
 * pass today.
 *
 * A green run of this file is NOT evidence that the paywall is enforced.
 * The executing tests are in listing-access-executing.test.ts, and the tests
 * that would actually prove the endpoint is closed require a deployed preview
 * and four real accounts. Those are specified in
 * docs/PROPOSAL-listing-access-control.md section 8a and are not in this
 * repository.
 * ===========================================================================
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const proposal = readFileSync("docs/PROPOSAL-listing-access-control.md", "utf8");
const route = readFileSync("src/app/api/listings/route.ts", "utf8");

describe("SOURCE-INSPECTING: the proposal is not yet implemented", () => {
  test("the route does not import the access module", () => {
    // When someone wires it in, this fails. That is deliberate: the failure
    // is the prompt to move these assertions into the implemented set and to
    // add the credentialed tests from section 8a.
    assert.doesNotMatch(route, /listing-access/,
      "listing-access appears to be wired in. If so: update this file, " +
      "docs/PROPOSAL-listing-access-control.md, and add the credentialed tests.");
  });

  test("GET still has no tier resolution", () => {
    const getBody = route.slice(
      route.indexOf("export async function GET"),
      route.indexOf("async function seedFromJSON")
    );
    assert.doesNotMatch(getBody, /resolveTier|applyAccess|requireUser/);
  });

  test("the module exists and nothing under src/app imports it", () => {
    assert.ok(existsSync("src/lib/listing-access.ts"), "the proposed module must exist");

    const importers: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = path.join(dir, name);
        if (statSync(full).isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(name)) continue;
        if (/from "@\/lib\/listing-access"/.test(readFileSync(full, "utf8"))) {
          importers.push(full);
        }
      }
    };
    walk("src/app");
    assert.deepEqual(importers, [],
      `listing-access is imported by:\n${importers.join("\n")}\n` +
      "While this is a proposal it must have no callers.");
  });
});

describe("SOURCE-INSPECTING: the proposal records every blocking decision", () => {
  test("all ten decisions are present", () => {
    for (let i = 1; i <= 10; i++) {
      assert.match(proposal, new RegExp(`### D${i}\\.`), `decision D${i} is missing`);
    }
  });

  test("the four blocking decisions are marked BLOCKING", () => {
    for (const d of ["D1", "D2", "D3", "D4"]) {
      const at = proposal.indexOf(`### ${d}.`);
      assert.ok(at > 0, `${d} missing`);
      const heading = proposal.slice(at, proposal.indexOf("\n", at));
      assert.match(heading, /BLOCKING/, `${d} must be marked BLOCKING`);
    }
  });

  test("options that would reduce a published benefit say so", () => {
    // The brief forbids changing subscriber benefits. Any option that would
    // must be flagged, not buried.
    assert.match(proposal, /Changes the published benefit/);
    assert.match(proposal, /Removes a published benefit/);
  });

  test("it makes no recommendation on the pricing decision", () => {
    assert.match(proposal, /No recommendation\. This is a pricing decision\./);
  });
});

describe("SOURCE-INSPECTING: the proposal cites published copy, not invention", () => {
  test("it cites the pricing feature lists by line", () => {
    assert.match(proposal, /src\/app\/pricing\/page\.tsx:11-18/);
    assert.match(proposal, /src\/app\/pricing\/page\.tsx:20-26/);
  });

  test("it cites both FAQ answers", () => {
    assert.match(proposal, /src\/app\/faq\/page\.tsx:25-26/);
    assert.match(proposal, /src\/app\/pricing\/page\.tsx:31-34/);
  });

  test("the quoted free-tier copy matches the file it cites", () => {
    // Guards against the proposal drifting from the copy it is built on.
    const pricing = readFileSync("src/app/pricing/page.tsx", "utf8");
    assert.match(pricing, /See the map with all game pins/);
    assert.match(pricing, /View full details on the top result per search/);
    assert.match(pricing, /See game type, day, distance & skill level on all results/);
    for (const phrase of [
      "See the map with all game pins",
      "View full details on the top result per search",
    ]) {
      assert.ok(proposal.includes(phrase), `the proposal must quote: ${phrase}`);
    }
  });

  test("the GameCard locked-card comment it quotes still exists", () => {
    const card = readFileSync("src/components/GameCard.tsx", "utf8");
    assert.match(card, /Locked cards: type \+ day \+ distance \+ skill only\. NO name, venue, or identifying info\./);
  });
});

describe("SOURCE-INSPECTING: the findings the proposal rests on are still true", () => {
  test("the paywall is still client-side in GameCard", () => {
    const card = readFileSync("src/components/GameCard.tsx", "utf8");
    assert.match(card, /const canSeeContactInfo = hasAccess;/);
  });

  test("search still ranks in the browser, which is why D1 blocks", () => {
    const search = readFileSync("src/app/search/page.tsx", "utf8");
    assert.match(search, /games\.sort\(/);
    assert.match(search, /haversineDistance/);
  });

  test("the route still has no ranking or pagination", () => {
    const getBody = route.slice(
      route.indexOf("export async function GET"),
      route.indexOf("async function seedFromJSON")
    );
    assert.doesNotMatch(getBody, /\.orderBy\(/);
  });

  test("search still reveals 2 full cards, not the 1 the copy promises", () => {
    // The D2 discrepancy. If this changes, D2 is resolved and the proposal
    // needs updating.
    const search = readFileSync("src/app/search/page.tsx", "utf8");
    assert.match(search, /Non-subscriber: 2 full cards, 3 teasers, then locked/);
    assert.match(search, /if \(index < 2\)/);
  });

  test("the detail page still emits ungated JSON-LD with a street address", () => {
    // The D5 finding, and the reason redacting the API alone is insufficient.
    const detail = readFileSync("src/app/games/[...slug]/page.tsx", "utf8");
    assert.match(detail, /streetAddress: game\.address/);
    assert.match(detail, /<GameJsonLd game=\{game\} \/>/);
    // Not inside an access conditional.
    const at = detail.indexOf("<GameJsonLd game={game} />");
    const line = detail.slice(detail.lastIndexOf("\n", at), detail.indexOf("\n", at));
    assert.doesNotMatch(line, /canSeeDetails|hasAccess/);
  });

  test("city pages still render no restricted field", () => {
    const city = readFileSync("src/app/cities/[state]/[city]/page.tsx", "utf8");
    for (const f of ["venueName", "address", "contactEmail", "contactPhone", "contactName"]) {
      assert.doesNotMatch(city, new RegExp(`\\bg\\.${f}\\b`), `city page renders ${f}`);
    }
  });

  test("the three fallback response paths all still exist", () => {
    // Section 5 requires all three to redact identically.
    assert.match(route, /source: "firestore"/);
    assert.match(route, /source: "json"/);
    assert.match(route, /source: "json-fallback"/);
  });

  test("the listings body is still publicly cached, which section 5 flags", () => {
    // Once the response varies by tier this becomes cross-tier cache
    // poisoning. Recorded here so the risk is not forgotten.
    assert.match(route, /public, s-maxage=60/);
    assert.match(proposal, /cross-tier cache poisoning/);
  });
});

describe("SOURCE-INSPECTING: the proposal covers every surface the brief named", () => {
  for (const surface of ["Search", "Map", "City pages", "Game detail page", "Fallback responses"]) {
    test(`it addresses: ${surface}`, () => {
      assert.ok(proposal.includes(`### ${surface}`), `missing section for ${surface}`);
    });
  }

  test("it gives a field matrix for all four tiers", () => {
    assert.match(proposal, /\| Field \| anonymous \| free \| paid \| admin \|/);
  });

  test("it separates executing from source-inspecting tests", () => {
    assert.match(proposal, /8a\. Tests that EXECUTE authorization behaviour/);
    assert.match(proposal, /8b\. Tests that only INSPECT SOURCE/);
  });

  test("it states that nothing is deployed or enabled", () => {
    assert.match(proposal, /Not implemented, not deployed, nothing enabled/);
  });
});
