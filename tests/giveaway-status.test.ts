/**
 * Giveaway status tests.
 *
 * The programme had only a boolean `paused` and prize fields that always
 * demanded values, so the live Firestore record was pressed into service as a
 * notice board: prizeName "Giveaway update", prizeValue "prize to be
 * announced", drawDate "Not yet scheduled", numberOfWinners forced to 1,
 * month "Update" (which the hero rendered as "Update Mahjong Giveaway").
 *
 * These tests pin the rule that replaced it: outside "running", there is no
 * prize, no value, no winner count and no draw date to display, and neither a
 * draw nor an announcement can be performed.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CURRENT_GIVEAWAY,
  isRunning,
  resolveGiveawayStatus,
  giveawayPublicFields,
  type GiveawayStatus,
} from "../src/lib/giveaway-config.ts";

const computed = { drawDate: "November 30, 2026 at 3:00 PM CT", month: "November" };

/** The exact live production config as read on 2026-11-05. */
const PRODUCTION_WORKAROUND = {
  prizeName: "Giveaway update",
  prizeValue: "prize to be announced",
  prizeDescription:
    "Giveaway update: The May drawing did not take place, and monthly drawings have not run since April 2026.",
  drawDate: "Not yet scheduled",
  numberOfWinners: 1,
  month: "Update",
};

describe("status resolution", () => {
  test("an explicit status wins", () => {
    for (const s of ["running", "paused", "reviewing"] as GiveawayStatus[]) {
      assert.equal(resolveGiveawayStatus({ status: s, prizeName: "Set" }), s);
    }
  });

  test("a legacy doc with only paused:true resolves to paused", () => {
    assert.equal(resolveGiveawayStatus({ paused: true }), "paused");
  });

  test("a legacy doc with only paused:false resolves to running", () => {
    assert.equal(resolveGiveawayStatus({ paused: false }), "running");
  });

  test("a missing doc falls back to the config file, which is not running", () => {
    assert.equal(resolveGiveawayStatus(null), CURRENT_GIVEAWAY.status);
    assert.equal(isRunning(resolveGiveawayStatus(null)), false);
  });

  test("the live production workaround doc resolves to a non-running state", () => {
    // It carries no `status` and no `paused`, so it must not read as running.
    assert.equal(isRunning(resolveGiveawayStatus(PRODUCTION_WORKAROUND)), false);
  });

  test("an unrecognised status value is ignored, not trusted", () => {
    assert.equal(resolveGiveawayStatus({ status: "live" }), CURRENT_GIVEAWAY.status);
  });
});

describe("non-running states publish no prize, value, winner count or date", () => {
  const cases: [string, Record<string, unknown> | null][] = [
    ["explicit paused", { status: "paused" }],
    ["explicit reviewing", { status: "reviewing", statusNotice: "custom" }],
    ["legacy paused:true", { paused: true }],
    ["missing doc (also the failed-API-fetch path)", null],
    ["the live production workaround", PRODUCTION_WORKAROUND],
    ["running but with a blank prize name", { status: "running", prizeName: "   ", numberOfWinners: 2 }],
  ];

  for (const [label, cfg] of cases) {
    test(label, () => {
      const out = giveawayPublicFields(cfg, computed);
      assert.equal(isRunning(out.status), false, "must not be running");
      for (const k of [
        "prizeName",
        "prizeValue",
        "prizePhoto",
        "prizeDescription",
        "prizeLink",
        "numberOfWinners",
        "drawDate",
        "month",
      ] as const) {
        assert.equal(out[k], null, `${k} must be null, got ${JSON.stringify(out[k])}`);
      }
      // A notice is always available so the page has something honest to show.
      assert.ok(out.statusNotice && out.statusNotice.length > 0);
      assert.ok(out.statusHeadline && out.statusHeadline.length > 0);
    });
  }

  test("none of the placeholder strings can reach the client", () => {
    const out = giveawayPublicFields(PRODUCTION_WORKAROUND, computed);
    const serialized = JSON.stringify(out);
    for (const bad of ["Giveaway update", "prize to be announced", "Not yet scheduled", '"Update"']) {
      assert.doesNotMatch(serialized, new RegExp(bad.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
  });
});

describe("running state requires real configuration", () => {
  test("a properly configured drawing publishes every field", () => {
    const out = giveawayPublicFields(
      {
        status: "running",
        prizeName: "3 Premium Mahjong Mats",
        prizeValue: "$270 value",
        numberOfWinners: 3,
        drawDate: "November 30, 2026 at 3:00 PM CT",
        month: "November",
      },
      computed
    );
    assert.equal(out.status, "running");
    assert.equal(out.prizeName, "3 Premium Mahjong Mats");
    assert.equal(out.numberOfWinners, 3);
    assert.ok(out.drawDate);
    assert.ok(out.month);
  });

  test("an unset draw date falls back to the calendar, never to a stale string", () => {
    const out = giveawayPublicFields(
      { status: "running", prizeName: "Set", numberOfWinners: 1 },
      computed
    );
    assert.equal(out.drawDate, computed.drawDate);
    assert.equal(out.month, computed.month);
  });
});

describe("the disclosure is preserved", () => {
  // Jack's requirement: the factual notice must survive, and must not imply
  // that posting it discharges the missed drawings.
  const notice = CURRENT_GIVEAWAY.statusNotice;

  test("names May 2026 as not having taken place", () => {
    assert.match(notice, /May 2026/);
    assert.match(notice, /did not take place/i);
  });

  test("states drawings have not run since April 2026", () => {
    assert.match(notice, /have not run since April 2026/i);
  });

  test("states the missed drawings are under review", () => {
    assert.match(notice, /reviewing the missed drawings/i);
  });

  test("states no new date is scheduled", () => {
    assert.match(notice, /no new drawing date has been scheduled/i);
  });

  test("does not claim the matter is resolved or concluded", () => {
    assert.doesNotMatch(notice, /resolved|settled|concluded|compensat|made good|no further action/i);
  });

  test("survives into every non-running response", () => {
    for (const cfg of [null, { status: "paused" }, { paused: true }, PRODUCTION_WORKAROUND]) {
      const out = giveawayPublicFields(cfg, computed);
      assert.match(out.statusNotice, /April 2026/);
    }
  });
});

describe("draw and announce are gated server-side, not only in the UI", () => {
  const giveawayRoute = readFileSync("src/app/api/giveaway/route.ts", "utf8");
  const announceRoute = readFileSync("src/app/api/giveaway/announce/route.ts", "utf8");

  test("the draw action checks status before building a pool or writing", () => {
    const drawAt = giveawayRoute.indexOf('body.action === "draw"');
    const gateAt = giveawayRoute.indexOf("resolveGiveawayStatus(", drawAt);
    const poolAt = giveawayRoute.indexOf("giveawayDraws", gateAt);
    assert.ok(drawAt > 0, "draw action present");
    assert.ok(gateAt > drawAt, "status gate inside the draw branch");
    assert.ok(poolAt > gateAt, "gate precedes any draw write");
    assert.match(giveawayRoute.slice(gateAt, gateAt + 600), /isRunning\(drawStatus\)/);
    assert.match(giveawayRoute.slice(gateAt, gateAt + 900), /status: 409/);
  });

  test("the announce endpoint checks status before sending anything", () => {
    // Search for the CALL site, not the import at the top of the file.
    const gateAt = announceRoute.indexOf("resolveGiveawayStatus(");
    const sendAt = announceRoute.indexOf("sendEmail({");
    assert.ok(gateAt > 0, "status gate present");
    assert.ok(sendAt > gateAt, "gate precedes any send");
    assert.match(announceRoute.slice(gateAt, gateAt + 500), /status: 409/);
  });

  test("opening a drawing requires a prize name and a winner count", () => {
    assert.match(giveawayRoute, /A prize name is required to open a drawing/);
    assert.match(giveawayRoute, /Number of winners must be at least 1/);
  });

  test("an invalid status value is rejected on save", () => {
    assert.match(giveawayRoute, /status must be "running", "paused" or "reviewing"/);
  });

  test("both routes share one resolver rather than keeping private copies", () => {
    // The announce route previously had its own copy of this rule; divergence
    // is how one gate drifts open while the other stays shut.
    assert.doesNotMatch(giveawayRoute, /function resolveStatus\s*\(/);
    assert.doesNotMatch(announceRoute, /function resolveAnnounceStatus\s*\(/);
  });
});
