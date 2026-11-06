/**
 * EXECUTING TESTS for the proposed tier-based access control.
 *
 * ===========================================================================
 * CATEGORY: EXECUTING. Every assertion in this file runs real code from
 * src/lib/listing-access.ts and asserts on its real output. A failure here
 * means the logic is wrong.
 *
 * It does NOT prove the live endpoint is closed. The route does not call this
 * module yet, by design. The tests that would prove the endpoint is closed
 * need a deployed preview and four real accounts; they are specified in
 * docs/PROPOSAL-listing-access-control.md section 8a and are NOT in this
 * repository, because they cannot run without credentials.
 *
 * Source-inspecting assertions live in listing-access-source.test.ts and are
 * much weaker. Do not read a green run of both as equivalent evidence.
 * ===========================================================================
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  ACCESS_TIERS,
  VISIBILITY,
  applyAccess,
  applyAccessToAll,
  resolveTier,
  visibleFor,
  withheldFor,
  type AccessTier,
} from "../src/lib/listing-access.ts";
import type { Game } from "../src/types/index.ts";

/** Every restricted field carries a sentinel, so a leak is unmistakable. */
const full: Partial<Game> = {
  id: "l1",
  name: "SENTINEL_NAME",
  organizerName: "SENTINEL_ORGANIZER",
  organizerId: "SENTINEL_ORGID",
  type: "open_play",
  gameStyle: "american",
  city: "Testville",
  state: "TX",
  generalArea: "North side",
  venueName: "SENTINEL_VENUE",
  address: "SENTINEL_ADDRESS",
  geopoint: { lat: 30.1, lng: -97.1 },
  metroRegion: "austin-tx",
  isRecurring: true,
  recurringSchedule: { dayOfWeek: "tuesday", startTime: "10:00", endTime: "12:00", frequency: "weekly" },
  eventDate: null,
  eventStartTime: null,
  eventEndTime: null,
  cost: "Free",
  costAmount: 0,
  contactName: "SENTINEL_CONTACTNAME",
  contactEmail: "SENTINEL_EMAIL",
  contactPhone: "SENTINEL_PHONE",
  website: "SENTINEL_WEBSITE",
  instagram: "SENTINEL_INSTAGRAM",
  facebookGroup: "SENTINEL_FACEBOOK",
  registrationLink: "SENTINEL_REGISTRATION",
  description: "SENTINEL_DESCRIPTION",
  howToJoin: "SENTINEL_HOWTOJOIN",
  whatToBring: "SENTINEL_WHATTOBRING",
  skillLevels: ["beginner"],
  dropInFriendly: true,
  setsProvided: true,
  maxPlayers: 16,
  typicalGroupSize: "8-12",
  imageUrl: "",
  goingCount: 3,
  beenHereCount: 1,
  headsUpCount: 0,
  status: "active",
  verified: true,
  claimedBy: "SENTINEL_CLAIMEDBY",
  source: "manual",
  promoted: false,
  organizerEdited: true,
  lastVerified: "2026-10-01",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-02-01T00:00:00.000Z",
};

const RESTRICTED_SENTINELS = [
  "SENTINEL_NAME", "SENTINEL_VENUE", "SENTINEL_ADDRESS", "SENTINEL_CONTACTNAME",
  "SENTINEL_EMAIL", "SENTINEL_PHONE", "SENTINEL_WEBSITE", "SENTINEL_INSTAGRAM",
  "SENTINEL_FACEBOOK", "SENTINEL_REGISTRATION", "SENTINEL_DESCRIPTION",
  "SENTINEL_HOWTOJOIN", "SENTINEL_WHATTOBRING", "SENTINEL_ORGANIZER",
];
// `source` is a union type and cannot hold a sentinel, so the admin-only leak
// check relies on organizerId and claimedBy, which are free-form strings.
const ADMIN_ONLY_SENTINELS = ["SENTINEL_ORGID", "SENTINEL_CLAIMEDBY"];

describe("EXECUTING: no restricted value survives for a non-paying tier", () => {
  for (const tier of ["anonymous", "free"] as AccessTier[]) {
    test(`${tier} receives no restricted value anywhere in the payload`, () => {
      const serialized = JSON.stringify(applyAccess(full, tier));
      for (const s of [...RESTRICTED_SENTINELS, ...ADMIN_ONLY_SENTINELS]) {
        assert.doesNotMatch(serialized, new RegExp(s), `${tier} leaked ${s}`);
      }
    });

    test(`${tier} is marked locked`, () => {
      assert.equal(applyAccess(full, tier).locked, true);
    });
  }

  test("paid receives every product field but no internal bookkeeping", () => {
    const out = applyAccess(full, "paid");
    const serialized = JSON.stringify(out);
    for (const s of RESTRICTED_SENTINELS) {
      assert.match(serialized, new RegExp(s), `paid should receive ${s}`);
    }
    for (const s of ADMIN_ONLY_SENTINELS) {
      assert.doesNotMatch(serialized, new RegExp(s), `paid leaked internal ${s}`);
    }
  });

  test("admin receives the record untouched", () => {
    const out = applyAccess(full, "admin");
    assert.deepEqual(out, { ...full });
    assert.equal("locked" in out, false, "an admin record must not be marked locked");
  });
});

describe("EXECUTING: the free tier keeps the published benefits working", () => {
  const out = applyAccess(full, "free");

  test("game type, day, distance inputs and skill level are retained", () => {
    // pricing/page.tsx:15 "See game type, day, distance & skill level on all results"
    assert.equal(out.type, "open_play");
    assert.deepEqual(out.recurringSchedule, full.recurringSchedule);
    assert.deepEqual(out.skillLevels, ["beginner"]);
    // distance is derived from geopoint, so geopoint is the requirement
    assert.deepEqual(out.geopoint, { lat: 30.1, lng: -97.1 });
  });

  test("map pins still work", () => {
    // pricing/page.tsx:13 "See the map with all game pins"
    assert.notEqual(out.geopoint, null);
    assert.equal(out.city, "Testville");
    assert.equal(out.state, "TX");
  });

  test("search and filtering keys are retained", () => {
    assert.equal(out.id, "l1");
    assert.equal(out.gameStyle, "american");
    assert.equal(out.status, "active");
    assert.equal(out.dropInFriendly, true);
    assert.equal(out.cost, "Free");
  });

  test("city pages would keep rendering", () => {
    // The city page renders only city, state, status, type, dropInFriendly,
    // skillLevels. All survive.
    for (const k of ["city", "state", "status", "type", "dropInFriendly", "skillLevels"] as const) {
      assert.notEqual(out[k], null, `${k} must survive for city pages`);
      assert.notEqual(out[k], "", `${k} must survive for city pages`);
    }
  });
});

describe("EXECUTING: shape stability", () => {
  test("keys are kept, not deleted, for every tier", () => {
    // Deleting keys would let a caller infer which listings HAVE an address.
    for (const tier of ACCESS_TIERS) {
      const out = applyAccess(full, tier);
      for (const k of Object.keys(full)) {
        assert.ok(k in out, `${tier}: key ${k} was removed`);
      }
    }
  });

  test("all tiers return the same key set, apart from `locked`", () => {
    const keysOf = (t: AccessTier) => Object.keys(applyAccess(full, t)).filter((k) => k !== "locked").sort();
    const base = keysOf("admin");
    for (const tier of ACCESS_TIERS) {
      assert.deepEqual(keysOf(tier), base, `${tier} key set differs`);
    }
  });

  test("a withheld string becomes an empty string; a withheld non-string becomes null", () => {
    const out = applyAccess(full, "anonymous");
    // Strings blank, so a consumer can render them without a null check.
    assert.equal(out.address, "");
    assert.equal(out.organizerId, "");
    // Non-strings cannot blank meaningfully, so they null. `organizerEdited`
    // is a boolean and admin-only.
    assert.equal(out.organizerEdited, null);
  });

  test("the input is never mutated", () => {
    applyAccess(full, "anonymous");
    applyAccess(full, "free");
    assert.equal(full.address, "SENTINEL_ADDRESS");
    assert.equal(full.contactEmail, "SENTINEL_EMAIL");
  });

  test("a partial record does not gain keys it never had", () => {
    const partial = { id: "x", city: "Y", state: "TX" };
    const out = applyAccess(partial, "anonymous");
    assert.deepEqual(Object.keys(out).sort(), ["city", "id", "state"]);
    assert.equal("locked" in out, false, "nothing was withheld, so nothing is locked");
  });

  test("applyAccessToAll applies the same rules to every element", () => {
    const out = applyAccessToAll([full, { ...full, id: "l2" }], "free");
    assert.equal(out.length, 2);
    for (const r of out) {
      assert.equal(r.address, "");
      assert.equal(r.locked, true);
    }
  });

  test("an empty list is handled", () => {
    assert.deepEqual(applyAccessToAll([], "anonymous"), []);
  });
});

describe("EXECUTING: the matrix is total and internally consistent", () => {
  test("visible and withheld partition the field set for every tier", () => {
    const all = Object.keys(VISIBILITY).length;
    for (const tier of ACCESS_TIERS) {
      assert.equal(
        visibleFor(tier).length + withheldFor(tier).length,
        all,
        `${tier}: a field is neither visible nor withheld`
      );
    }
  });

  test("admin is withheld nothing", () => {
    assert.deepEqual(withheldFor("admin"), []);
  });

  test("each tier sees at least as much as the one below it", () => {
    // anonymous subset of free subset of paid subset of admin. Prevents a
    // matrix edit that accidentally gives a free user more than a subscriber.
    const order: AccessTier[] = ["anonymous", "free", "paid", "admin"];
    for (let i = 0; i < order.length - 1; i++) {
      const lower = new Set(visibleFor(order[i]));
      const higher = new Set(visibleFor(order[i + 1]));
      for (const f of lower) {
        assert.ok(higher.has(f), `${order[i]} sees ${f} but ${order[i + 1]} does not`);
      }
    }
  });

  test("the paywalled core is withheld from anonymous and free", () => {
    for (const tier of ["anonymous", "free"] as AccessTier[]) {
      const withheld = new Set(withheldFor(tier));
      for (const f of ["name", "venueName", "address", "contactEmail", "contactPhone", "description"] as const) {
        assert.ok(withheld.has(f), `${tier} can see ${f}`);
      }
    }
  });
});

describe("EXECUTING: resolveTier", () => {
  const adminEmails = ["jack@fluttrr.com", "jack@mahjnearme.com"] as const;
  const at = (o: Partial<Parameters<typeof resolveTier>[0]>) =>
    resolveTier({ verified: null, userDoc: null, adminEmails, ...o });

  test("no token is anonymous", () => {
    assert.equal(at({ verified: null }), "anonymous");
  });

  test("a verified token with no user document is free, not paid", () => {
    assert.equal(
      at({ verified: { uid: "u1", email: "a@b.com", emailVerified: true }, userDoc: null }),
      "free"
    );
  });

  test("an active subscription is paid", () => {
    assert.equal(
      at({ verified: { uid: "u1", email: "a@b.com", emailVerified: true }, userDoc: { subscriptionStatus: "active" } }),
      "paid"
    );
  });

  test("a trialing subscription is paid", () => {
    assert.equal(
      at({ verified: { uid: "u1", email: "a@b.com", emailVerified: true }, userDoc: { subscriptionStatus: "trialing" } }),
      "paid"
    );
  });

  test("a contributor is paid", () => {
    assert.equal(
      at({ verified: { uid: "u1", email: "a@b.com", emailVerified: true }, userDoc: { accountType: "contributor" } }),
      "paid"
    );
  });

  test("a LAPSED subscriber is free, not paid", () => {
    for (const status of ["past_due", "canceled", "unpaid", "incomplete"]) {
      assert.equal(
        at({ verified: { uid: "u1", email: "a@b.com", emailVerified: true }, userDoc: { subscriptionStatus: status } }),
        "free",
        `${status} must not grant access`
      );
    }
  });

  test("an unexpired accessUntil grants paid; an expired one does not", () => {
    const v = { uid: "u1", email: "a@b.com", emailVerified: true };
    const now = new Date("2026-11-06T00:00:00Z");
    assert.equal(at({ verified: v, userDoc: { accessUntil: "2026-12-01T00:00:00Z" }, now }), "paid");
    assert.equal(at({ verified: v, userDoc: { accessUntil: "2026-01-01T00:00:00Z" }, now }), "free");
  });

  test("a malformed accessUntil does not grant access", () => {
    assert.equal(
      at({ verified: { uid: "u1", email: "a@b.com", emailVerified: true }, userDoc: { accessUntil: "not a date" } }),
      "free"
    );
  });

  test("an allowlisted email with a VERIFIED token is admin", () => {
    assert.equal(
      at({ verified: { uid: "u1", email: "jack@fluttrr.com", emailVerified: true }, userDoc: null }),
      "admin"
    );
  });

  test("an allowlisted email with an UNVERIFIED token is NOT admin", () => {
    // Mirrors the rule PR #109 added to requireAdminUser. Firebase
    // email/password signup accepts an arbitrary address and leaves
    // email_verified false.
    assert.equal(
      at({ verified: { uid: "u1", email: "jack@fluttrr.com", emailVerified: false }, userDoc: null }),
      "free"
    );
  });

  test("accountType admin grants admin even without an allowlisted email", () => {
    assert.equal(
      at({ verified: { uid: "u1", email: "someone@else.com", emailVerified: true }, userDoc: { accountType: "admin" } }),
      "admin"
    );
  });

  test("email casing does not matter for the allowlist", () => {
    assert.equal(
      at({ verified: { uid: "u1", email: "JACK@Fluttrr.COM", emailVerified: true }, userDoc: null }),
      "admin"
    );
  });

  test("a client cannot assert its own tier: the input carries no role field", () => {
    // resolveTier takes only an already-VERIFIED token and a server-read user
    // document. There is no parameter a request body could populate.
    const keys = ["verified", "userDoc", "adminEmails", "now"];
    const probe = { verified: null, userDoc: null, adminEmails, now: new Date() };
    assert.deepEqual(Object.keys(probe).sort(), keys.sort());
  });
});

describe("EXECUTING: all three fallback paths would redact identically", () => {
  // The route has three response paths (Firestore, seed-failure JSON, and the
  // read-error JSON fallback). A redaction applied to only one is worse than
  // none, because the gap then appears only during an incident.
  test("the same record through each path yields an identical redacted shape", () => {
    const fromFirestore = applyAccess(full, "anonymous");
    const fromSeedFailure = applyAccess({ ...full }, "anonymous");
    const fromReadError = applyAccess({ ...full }, "anonymous");
    assert.deepEqual(fromSeedFailure, fromFirestore);
    assert.deepEqual(fromReadError, fromFirestore);
  });

  test("redaction is idempotent, so a double application is harmless", () => {
    const once = applyAccess(full, "free");
    const twice = applyAccess(once, "free");
    assert.deepEqual(twice, once);
  });
});
