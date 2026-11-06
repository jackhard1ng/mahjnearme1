/**
 * /api/listings access control: the documented gap, and the primitive for
 * closing it.
 *
 * The gap is NOT fixed in this PR. See
 * audit/SECURITY-api-listings-access-control.md for why: choosing what a free
 * visitor may see is a product decision, and verifying it needs a real
 * subscriber session.
 *
 * What is tested here:
 *   - the redaction primitive behaves correctly, so wiring it in later is a
 *     small change rather than a design exercise;
 *   - the shape of the gap is pinned, so these tests start failing the moment
 *     someone changes the route, prompting them to finish the job;
 *   - the free-tier field split still matches the published copy.
 *
 * No contact details appear in this file. Synthetic values only.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  PAYWALLED_FIELDS,
  redactListing,
  redactListings,
  isRedacted,
} from "../src/lib/listing-redaction.ts";

/** A listing with every restricted field populated. Values are synthetic. */
const listing = {
  id: "test-1",
  name: "Test Open Play",
  city: "Testville",
  state: "TX",
  type: "open_play",
  isRecurring: true,
  recurringSchedule: { dayOfWeek: "tuesday", startTime: "10:00", endTime: "12:00", frequency: "weekly" },
  skillLevels: ["beginner"],
  geopoint: { lat: 30.1, lng: -97.1 },
  cost: "Free",
  venueName: "VENUE",
  address: "ADDRESS",
  contactName: "NAME",
  contactEmail: "EMAIL",
  contactPhone: "PHONE",
  website: "WEBSITE",
  instagram: "INSTAGRAM",
  facebookGroup: "FACEBOOK",
  registrationLink: "REGISTRATION",
  howToJoin: "HOWTOJOIN",
};

describe("redactListing removes every restricted field", () => {
  const out = redactListing(listing);

  for (const field of PAYWALLED_FIELDS) {
    test(`${field} is blanked`, () => {
      assert.equal(out[field], "", `${field} survived redaction`);
    });
  }

  test("no restricted value survives anywhere in the payload", () => {
    const serialized = JSON.stringify(out);
    for (const sentinel of ["VENUE", "ADDRESS", "NAME", "EMAIL", "PHONE", "WEBSITE", "INSTAGRAM", "FACEBOOK", "REGISTRATION", "HOWTOJOIN"]) {
      assert.doesNotMatch(serialized, new RegExp(sentinel), `${sentinel} leaked`);
    }
  });

  test("keys are kept, not deleted, so the response shape is unchanged", () => {
    // Deleting keys would let a client infer which records HAVE an address by
    // key presence alone.
    for (const field of PAYWALLED_FIELDS) {
      assert.ok(field in out, `${field} key was removed`);
    }
    assert.deepEqual(Object.keys(listing).every((k) => k in out), true);
  });

  test("it is marked locked so the UI can explain the blank", () => {
    assert.equal(out.locked, true);
    assert.equal(isRedacted(out), true);
    assert.equal(isRedacted(listing), false);
  });

  test("the input is not mutated", () => {
    assert.equal(listing.address, "ADDRESS");
    assert.equal(listing.contactEmail, "EMAIL");
  });
});

describe("the free tier keeps working after redaction", () => {
  const out = redactListing(listing);

  test("the fields the published copy promises free users are retained", () => {
    // "game type, day, distance, and skill level"
    assert.equal(out.type, "open_play");
    assert.deepEqual(out.recurringSchedule, listing.recurringSchedule);
    assert.deepEqual(out.skillLevels, ["beginner"]);
  });

  test("map pins still work", () => {
    // "see the map with all game pins"
    assert.deepEqual(out.geopoint, { lat: 30.1, lng: -97.1 });
  });

  test("search and grouping keys are retained", () => {
    assert.equal(out.name, "Test Open Play");
    assert.equal(out.city, "Testville");
    assert.equal(out.state, "TX");
    assert.equal(out.id, "test-1");
  });

  test("the retained set and the removed set do not overlap", () => {
    const retained = ["id", "name", "city", "state", "type", "recurringSchedule", "skillLevels", "geopoint", "cost"];
    for (const r of retained) {
      assert.ok(!(PAYWALLED_FIELDS as readonly string[]).includes(r), `${r} is in both sets`);
    }
  });
});

describe("redactListings honours the top-result promise", () => {
  const list = [listing, { ...listing, id: "test-2" }, { ...listing, id: "test-3" }];

  test("revealCount 0 redacts everything", () => {
    assert.deepEqual(redactListings(list).map(isRedacted), [true, true, true]);
  });

  test("revealCount 1 leaves the first intact", () => {
    // "view complete details for the top result in each search"
    const out = redactListings(list, 1);
    assert.deepEqual(out.map(isRedacted), [false, true, true]);
    assert.equal(out[0].address, "ADDRESS");
    assert.equal(out[1].address, "");
  });

  test("revealCount beyond the list length does not throw", () => {
    assert.deepEqual(redactListings(list, 99).map(isRedacted), [false, false, false]);
  });

  test("an empty list is fine", () => {
    assert.deepEqual(redactListings([], 1), []);
  });
});

describe("the gap is still open, and recorded as such", () => {
  const route = readFileSync("src/app/api/listings/route.ts", "utf8");

  test("GET still has no subscription or auth check", () => {
    // When someone closes this, this assertion fails. That is the intent:
    // the failure is the prompt to update these tests and the audit doc.
    const getBody = route.slice(
      route.indexOf("export async function GET"),
      route.indexOf("async function seedFromJSON")
    );
    assert.doesNotMatch(getBody, /requireUser|requireAdmin|subscriptionStatus|redactListing/,
      "GET /api/listings appears to be gated now. If so, update " +
      "audit/SECURITY-api-listings-access-control.md and this test.");
  });

  test("the write verbs ARE guarded, so this is a read-only exposure", () => {
    for (const verb of ["POST", "PUT", "DELETE"]) {
      const at = route.indexOf(`export async function ${verb}`);
      assert.ok(at > 0, `${verb} handler present`);
      const guardAt = route.indexOf("requireAdmin(request)", at);
      const dbAt = route.indexOf("getAdminDb()", at);
      assert.ok(guardAt > at && guardAt < dbAt, `${verb} must be guarded before any DB access`);
    }
  });

  test("the redaction primitive is present but deliberately not wired in", () => {
    assert.doesNotMatch(route, /listing-redaction/,
      "the primitive is intentionally unused; wiring it in is a separate, " +
      "tested change with a product decision behind it");
  });

  test("the finding is documented", () => {
    const doc = readFileSync("audit/SECURITY-api-listings-access-control.md", "utf8");
    assert.match(doc, /documented, not fixed in this PR/);
    assert.match(doc, /Recommended fix/);
  });

  test("the audit document reproduces no contact data", () => {
    const doc = readFileSync("audit/SECURITY-api-listings-access-control.md", "utf8");
    // An email address, a US phone number, or a street address with a number.
    assert.doesNotMatch(doc, /[\w.+-]+@[\w-]+\.[\w.]{2,}/, "an email address appears in the audit doc");
    assert.doesNotMatch(doc, /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/, "a phone number appears in the audit doc");
    assert.doesNotMatch(doc, /\b\d{2,5}\s+[A-Z][a-z]+\s+(St|Street|Ave|Avenue|Rd|Road|Blvd|Dr|Drive|Way|Pl|Place)\b/,
      "a street address appears in the audit doc");
  });
});
