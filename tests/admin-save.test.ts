/**
 * Save-persistence regression tests.
 *
 * These exist because of a specific failure: admin listing edits reported
 * success and did not persist. Three of the four admin screens sent no
 * Firebase ID token, /api/admin-proxy answered 401, and the caller discarded
 * the response and showed a success toast anyway. Nothing in the codebase
 * would have caught that, so these tests pin the contract that makes it
 * impossible to repeat: a save is only a success when the server says so.
 *
 * Run: npm test
 */
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { adminWrite, adminFetch } from "../src/lib/admin-fetch.ts";

const realFetch = globalThis.fetch;

/** Record calls and reply with a scripted response. */
function stubFetch(reply: {
  ok?: boolean;
  status?: number;
  body?: unknown;
  throws?: Error;
  bodyIsNotJson?: boolean;
}) {
  const calls: { url: string; init: RequestInit }[] = [];
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url: String(url), init });
    if (reply.throws) throw reply.throws;
    const status = reply.status ?? 200;
    return {
      ok: reply.ok ?? (status >= 200 && status < 300),
      status,
      json: async () => {
        if (reply.bodyIsNotJson) throw new SyntaxError("Unexpected token");
        return reply.body;
      },
    };
  }) as unknown as typeof globalThis.fetch;
  return calls;
}

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("adminWrite — failures must be surfaced, never reported as success", () => {
  test("missing token (proxy 401) rejects with the server's reason", async () => {
    stubFetch({ status: 401, body: { error: "Missing auth token" } });
    await assert.rejects(
      () => adminWrite("/api/listings", "PUT", { id: "x", city: "Las Vegas" }),
      (err: Error) => {
        // The exact production failure: this is what the three broken admin
        // screens were getting back while showing "has been updated".
        assert.match(err.message, /Not authorized/);
        assert.match(err.message, /Missing auth token/);
        assert.match(err.message, /Sign out and back in/);
        return true;
      }
    );
  });

  test("expired/invalid token (401) rejects and tells the operator what to do", async () => {
    stubFetch({ status: 401, body: { error: "Invalid auth token" } });
    await assert.rejects(
      () => adminWrite("/api/listings", "PUT", { id: "x" }),
      (err: Error) => {
        assert.match(err.message, /Invalid auth token/);
        assert.match(err.message, /Sign out and back in/);
        return true;
      }
    );
  });

  test("valid token, non-admin user (403) rejects — authentication is not authorization", async () => {
    stubFetch({ status: 403, body: { error: "Forbidden" } });
    await assert.rejects(
      () => adminWrite("/api/giveaway", "POST", { action: "save_config" }),
      (err: Error) => {
        assert.match(err.message, /Not authorized/);
        return true;
      }
    );
  });

  test("backend failure (500) rejects with the server's message", async () => {
    stubFetch({ status: 500, body: { error: "Failed to update listing: NOT_FOUND" } });
    await assert.rejects(
      () => adminWrite("/api/listings", "PUT", { id: "ghost" }),
      (err: Error) => {
        assert.match(err.message, /Failed to update listing/);
        assert.match(err.message, /NOT_FOUND/);
        return true;
      }
    );
  });

  test("network-level failure rejects with an actionable message", async () => {
    stubFetch({ throws: new TypeError("Failed to fetch") });
    await assert.rejects(
      () => adminWrite("/api/listings", "PUT", { id: "x" }),
      (err: Error) => {
        assert.match(err.message, /Could not reach the server/);
        return true;
      }
    );
  });

  test("non-2xx with an unparseable body still rejects (status decides, not the body)", async () => {
    stubFetch({ status: 502, bodyIsNotJson: true });
    await assert.rejects(
      () => adminWrite("/api/listings", "PUT", { id: "x" }),
      (err: Error) => {
        assert.match(err.message, /502/);
        return true;
      }
    );
  });

  test("a 200 carrying an error field is NOT treated as failure (status is the contract)", async () => {
    // Guards against a future refactor deciding to sniff the body instead of
    // the status code; the route returns a real status for every outcome.
    stubFetch({ status: 200, body: { success: true, listing: { id: "x" } } });
    const out = await adminWrite<{ success: boolean }>("/api/listings", "PUT", { id: "x" });
    assert.equal(out.success, true);
  });
});

describe("adminWrite — success path", () => {
  test("resolves with the parsed body on 200", async () => {
    stubFetch({ status: 200, body: { success: true, listing: { id: "abc", city: "Las Vegas" } } });
    const out = await adminWrite<{ success: boolean; listing: { city: string } }>(
      "/api/listings",
      "PUT",
      { id: "abc", city: "Las Vegas" }
    );
    assert.equal(out.success, true);
    // The route echoes the stored record back, so a caller can confirm the
    // save landed on the record it meant and with the values it sent.
    assert.equal(out.listing.city, "Las Vegas");
  });

  test("routes through /api/admin-proxy and forwards route/method/body intact", async () => {
    const calls = stubFetch({ status: 200, body: { success: true } });
    await adminWrite("/api/listings", "PUT", { id: "abc", city: "Las Vegas" });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "/api/admin-proxy");
    assert.equal(calls[0].init.method, "POST");
    const sent = JSON.parse(String(calls[0].init.body));
    assert.equal(sent.route, "/api/listings");
    assert.equal(sent.method, "PUT");
    assert.deepEqual(sent.body, { id: "abc", city: "Las Vegas" });
  });

  test("adminFetch returns the Response rather than throwing, for callers that inspect it", async () => {
    stubFetch({ status: 401, body: { error: "Missing auth token" } });
    const res = await adminFetch("/api/listings", "PUT", { id: "x" });
    assert.equal(res.ok, false);
    assert.equal(res.status, 401);
  });
});

describe("all four admin screens use the shared helper", () => {
  const screens = [
    "src/app/admin/page.tsx",
    "src/app/admin/games/page.tsx",
    "src/app/admin/events/page.tsx",
    "src/app/admin/mobile/page.tsx",
  ];

  for (const file of screens) {
    test(`${file} imports adminFetch from the shared module`, () => {
      const src = readFileSync(file, "utf8");
      assert.match(
        src,
        /from "@\/lib\/admin-fetch"/,
        `${file} must import the shared helper`
      );
    });

    test(`${file} defines no local adminFetch`, () => {
      const src = readFileSync(file, "utf8");
      // The original bug was four copies of this helper, three of which had
      // dropped the token. A local definition reintroduces that risk.
      assert.doesNotMatch(
        src,
        /(async )?function adminFetch\s*\(/,
        `${file} must not define its own adminFetch`
      );
    });
  }

  test("the shared helper attaches the Firebase ID token", () => {
    const src = readFileSync("src/lib/admin-fetch.ts", "utf8");
    assert.match(src, /getIdToken\(\)/);
    assert.match(src, /headers\.Authorization\s*=\s*`Bearer \$\{idToken\}`/);
  });
});

describe("no admin write fires without awaiting its result", () => {
  test("no admin screen discards a write with .catch(() => {})", () => {
    // `adminFetch(...).catch(() => {})` is the exact shape that made a 401
    // indistinguishable from a successful save.
    for (const file of [
      "src/app/admin/page.tsx",
      "src/app/admin/games/page.tsx",
      "src/app/admin/events/page.tsx",
      "src/app/admin/mobile/page.tsx",
    ]) {
      const src = readFileSync(file, "utf8");
      assert.doesNotMatch(
        src,
        /admin(Fetch|Write)\([^)]*\)[\s\S]{0,80}?\.catch\(\(\)\s*=>\s*\{\s*\}\)/,
        `${file} swallows the result of an admin write`
      );
    }
  });
});
