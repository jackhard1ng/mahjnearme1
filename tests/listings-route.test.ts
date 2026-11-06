/**
 * Listings route tests: upsert safety, caching, and read-source behaviour.
 *
 * These are structural assertions on the route source plus unit tests of its
 * pure helpers. The route itself needs a live Firestore to execute, and this
 * environment has no credentials, so the parts that can be executed are, and
 * the parts that cannot are pinned by shape. Each assertion names the bug it
 * guards against.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { docToGame } from "../src/lib/listings-firestore.ts";

const route = readFileSync("src/app/api/listings/route.ts", "utf8");

describe("PUT cannot create a partial document", () => {
  test("existence is checked before writing", () => {
    const putAt = route.indexOf("export async function PUT");
    const existsAt = route.indexOf("existing.exists", putAt);
    const writeAt = route.indexOf("merge: true", putAt);
    assert.ok(existsAt > putAt, "PUT must check whether the document exists");
    assert.ok(writeAt > existsAt, "the merge write must come after the check");
  });

  test("a missing document is rebuilt from the static dataset, not written as a fragment", () => {
    // merge:true on a missing doc creates it holding only the fields the
    // request sent. docToGame then defaults status to "active", source to
    // "csv_import" and verified/promoted to false — so an edit would silently
    // republish an inactive listing and strip its verification.
    assert.match(route, /loadListings/, "must load the static dataset for the create path");
    assert.match(route, /\{ \.\.\.base, \.\.\.updates, id, createdAt/, "must write a complete record");
  });

  test("a record in neither place is refused with 404 rather than invented", () => {
    assert.match(route, /does not exist in the database or the static dataset/);
    assert.match(route, /status: 404/);
  });

  test("the write is read back, so success is evidence rather than assertion", () => {
    assert.match(route, /Write did not persist/);
    assert.match(route, /docToGame\(saved\.data\(\)/);
  });

  test("the canonical id is always written, so the doc is self-describing", () => {
    assert.match(route, /\{ \.\.\.updates, id, updatedAt: now \}/);
  });

  test("an empty update payload is refused", () => {
    assert.match(route, /No fields to update/);
  });
});

describe("docToGame defaults — why a partial document is dangerous", () => {
  test("an absent status silently becomes active", () => {
    const g = docToGame({ name: "X", city: "Y" }, "id1");
    assert.equal(g.status, "active");
  });

  test("absent verification and promotion become false", () => {
    const g = docToGame({ name: "X" }, "id2");
    assert.equal(g.verified, false);
    assert.equal(g.promoted, false);
  });

  test("an absent source becomes csv_import", () => {
    assert.equal(docToGame({ name: "X" }, "id3").source, "csv_import");
  });

  test("an absent geopoint becomes 0,0 — a point in the Gulf of Guinea", () => {
    assert.deepEqual(docToGame({ name: "X" }, "id4").geopoint, { lat: 0, lng: 0 });
  });

  test("reads trim padded values, which is why stored padding stayed invisible", () => {
    const g = docToGame({ name: "Mahjong in the Mountains ", city: "Red Feather Lakes " }, "id5");
    assert.equal(g.name, "Mahjong in the Mountains");
    assert.equal(g.city, "Red Feather Lakes");
  });

  test("an explicit null and an absent field are indistinguishable to a reader", () => {
    // This is why clearing a field with null is equivalent to deleting it here.
    assert.equal(docToGame({ eventDate: null }, "a").eventDate, docToGame({}, "b").eventDate);
  });
});

describe("write payloads are trimmed server-side", () => {
  test("both POST and PUT trim", () => {
    assert.match(route, /function trimStrings/);
    const posts = route.indexOf("export async function POST");
    const puts = route.indexOf("export async function PUT");
    assert.match(route.slice(posts, puts), /trimStrings\(body\)/, "POST must trim");
    assert.match(route.slice(puts), /trimStrings\(rest\)/, "PUT must trim");
  });

  test("prose fields keep their internal whitespace", () => {
    // Collapsing runs of whitespace in a description destroys paragraph breaks.
    assert.match(route, /key === "description" \|\| key === "howToJoin" \|\| key === "whatToBring"/);
  });
});

describe("caching: the admin read must never be served from a shared cache", () => {
  test("the cache policy is chosen by status, in one helper", () => {
    assert.match(route, /function cacheHeaderFor/);
    assert.match(route, /statusParam === "all"/);
  });

  test("status=all is private and uncacheable", () => {
    assert.match(route, /"private, no-store, max-age=0, must-revalidate"/);
  });

  test("the public variant keeps CDN caching", () => {
    assert.match(route, /"public, s-maxage=60, stale-while-revalidate=300"/);
  });

  test("every listings response body uses the helper, not a hardcoded header", () => {
    // Two response paths exist (Firestore and the seed-failure JSON fallback);
    // both must pick the policy from the same place.
    const hardcoded = route.match(/headers\.set\("Cache-Control", "public/g) || [];
    assert.equal(hardcoded.length, 0, "no response should hardcode the public policy");
  });

  test("admin clients send no-store as well as the route marking it uncacheable", () => {
    for (const f of [
      "src/app/admin/games/page.tsx",
      "src/app/admin/mobile/page.tsx",
      "src/hooks/useFirestoreListings.ts",
    ]) {
      const src = readFileSync(f, "utf8");
      assert.match(src, /cache: "no-store"/, `${f} must bypass the HTTP cache for admin reads`);
    }
  });
});

describe("a failed database read must not look like a reverted edit", () => {
  test("the fallback response is labelled so it can be told apart", () => {
    assert.match(route, /source: "json-fallback"/);
    assert.match(route, /source: "firestore"/);
  });

  test("the error fallback is not cached", () => {
    // A cached fallback body would outlive the outage and keep showing
    // pre-edit values after Firestore recovered.
    const catchAt = route.lastIndexOf("catch (err)");
    const tail = route.slice(catchAt);
    assert.doesNotMatch(tail, /s-maxage/, "the error path must not set a CDN cache header");
  });
});
