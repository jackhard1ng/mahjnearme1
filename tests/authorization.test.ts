/**
 * Authorization regression tests.
 *
 * Three gaps are covered. None was introduced by this PR; all three are
 * live on main at the time of writing.
 *
 *   1. requireAdminUser matched the ADMIN_EMAILS allowlist without checking
 *      email_verified.
 *   2. PATCH /api/contributor-apply had no authorization check at all.
 *   3. GET /api/organizers had no authorization check, and its "all=true"
 *      branch returned every stored field of every organizer document.
 *
 * These are structural assertions on the route sources plus unit tests of the
 * pure helpers. Executing the routes needs live Firebase credentials, which
 * this environment does not have, so the parts that can be executed are and
 * the parts that cannot are pinned by shape, each naming the gap it guards.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const apiAuth = readFileSync("src/lib/api-auth.ts", "utf8");

describe("gap 1: the email allowlist requires a verified email", () => {
  test("email_verified is checked before the allowlist grants admin", () => {
    // Firebase email/password signup accepts an arbitrary address and leaves
    // email_verified false. If an allowlisted address is not already
    // registered, anyone could register it and hold full admin.
    const fnStart = apiAuth.indexOf("export async function requireAdminUser");
    const body = apiAuth.slice(fnStart);
    const allowlistAt = body.indexOf("ADMIN_EMAILS.includes(email)");
    const verifiedAt = body.indexOf("decoded.email_verified", allowlistAt);
    const returnAt = body.indexOf("return { uid: decoded.uid, email }", allowlistAt);
    assert.ok(allowlistAt > 0, "allowlist check present");
    assert.ok(verifiedAt > allowlistAt, "email_verified must be checked inside the allowlist branch");
    assert.ok(verifiedAt < returnAt, "email_verified must be checked BEFORE granting admin");
  });

  test("an unverified allowlisted token does not return early", () => {
    // It falls through to the accountType check, so a real admin whose
    // address happens to be unverified is not locked out.
    assert.match(apiAuth, /Fall through to the accountType check/);
  });

  test("the decoded token type includes email_verified", () => {
    assert.match(apiAuth, /email_verified\?: boolean/);
  });

  test("the email is taken from the verified token, never from the request body", () => {
    const fn = apiAuth.slice(apiAuth.indexOf("export async function requireAdminUser"));
    assert.match(fn, /const email = \(decoded\.email \|\| ""\)\.toLowerCase\(\)/);
    // A body-supplied email or role must never reach an authorization decision.
    assert.doesNotMatch(fn, /await req\.json\(\)/);
    assert.doesNotMatch(fn, /body\.(email|role|accountType|isAdmin)/);
  });

  test("the accountType fallback is keyed on the verified uid", () => {
    const fn = apiAuth.slice(apiAuth.indexOf("export async function requireAdminUser"));
    assert.match(fn, /collection\("users"\)\.doc\(decoded\.uid\)/);
  });
});

describe("gap 2: PATCH /api/contributor-apply requires admin", () => {
  const route = readFileSync("src/app/api/contributor-apply/route.ts", "utf8");

  test("the guard is the first thing the handler does", () => {
    const patchAt = route.indexOf("export async function PATCH");
    const guardAt = route.indexOf("requireAdmin(request)", patchAt);
    const dbAt = route.indexOf("getAdminDb()", patchAt);
    const grantAt = route.indexOf('accountType: "contributor"', patchAt);
    assert.ok(guardAt > patchAt, "PATCH must call requireAdmin");
    assert.ok(guardAt < dbAt, "the guard must precede any database access");
    assert.ok(guardAt < grantAt, "the guard must precede the entitlement grant");
  });

  test("requireAdmin is imported", () => {
    assert.match(route, /import \{[^}]*requireAdmin[^}]*\} from "@\/lib\/api-auth"/);
  });

  test("the grant it protects is a permanent paid-access entitlement", () => {
    // Worth pinning: if this write is ever widened, the guard matters more,
    // not less.
    assert.match(route, /accountType: "contributor"/);
    assert.match(route, /isContributor: true/);
  });

  test("the applicationId still comes from the body, which is why the guard is the control", () => {
    // The handler trusts an id from the request body. That is acceptable only
    // because the caller is now proven to be an admin.
    assert.match(route, /const \{ applicationId, action \} = body/);
  });
});

describe("gap 3: GET /api/organizers requires admin", () => {
  const route = readFileSync("src/app/api/organizers/route.ts", "utf8");

  test("the guard is the first thing the handler does", () => {
    const getAt = route.indexOf("export async function GET");
    const guardAt = route.indexOf("requireAdmin(request)", getAt);
    const dbAt = route.indexOf("getAdminDb()", getAt);
    assert.ok(guardAt > getAt, "GET must call requireAdmin");
    assert.ok(guardAt < dbAt, "the guard must precede any database access");
  });

  test("the all=true branch is behind that guard", () => {
    const guardAt = route.indexOf("requireAdmin(request)");
    const allAt = route.indexOf('searchParams.get("all")');
    assert.ok(guardAt < allAt, "the admin-view branch must be behind the guard");
  });
});

describe("the public organizer surfaces project fields and leak no internals", () => {
  // These two ARE public, by design, and are what the public pages use. They
  // must never spread a raw document.
  const INTERNAL = ["userId", "stripePromoId", "referralCode", "personalName", "managementPreference"];

  for (const file of [
    "src/app/api/organizers/overrides/route.ts",
    "src/app/api/organizers/instructors/route.ts",
  ]) {
    const src = readFileSync(file, "utf8");

    test(`${file} does not spread a raw document`, () => {
      assert.doesNotMatch(src, /\.\.\.doc\.data\(\)/, "must project fields explicitly");
      assert.doesNotMatch(src, /\.\.\.data\b/, "must project fields explicitly");
    });

    test(`${file} returns no internal field`, () => {
      for (const field of INTERNAL) {
        // `data.userId` reduced to a boolean is fine; returning it is not.
        const returnsIt = new RegExp(`^\\\\s*${field}\\\\s*:`, "m").test(src);
        assert.equal(returnsIt, false, `${file} returns ${field}`);
      }
    });
  }

  test("instructors reduces userId to a boolean rather than exposing the uid", () => {
    const src = readFileSync("src/app/api/organizers/instructors/route.ts", "utf8");
    assert.match(src, /hasUser: !!data\.userId/);
  });
});

describe("admin-proxy remains the only way a browser reaches an admin route", () => {
  const proxy = readFileSync("src/app/api/admin-proxy/route.ts", "utf8");

  test("it verifies an admin USER before forwarding", () => {
    const verifyAt = proxy.indexOf("requireAdminUser(req)");
    const forwardAt = proxy.indexOf("await fetch(");
    assert.ok(verifyAt > 0, "must verify the caller");
    assert.ok(verifyAt < forwardAt, "verification must precede forwarding");
  });

  test("it forwards CRON_SECRET, which is what downstream requireAdmin accepts", () => {
    assert.match(proxy, /"x-admin-key": cronSecret/);
  });

  test("it refuses to run without CRON_SECRET configured", () => {
    assert.match(proxy, /if \(!cronSecret\)/);
  });

  test("it only proxies to an allowlisted route prefix", () => {
    assert.match(proxy, /allowedPrefixes/);
    assert.match(proxy, /Route not allowed/);
  });

  test("contributor-apply is NOT proxyable, so guarding its PATCH breaks no caller", () => {
    const m = proxy.match(/const allowedPrefixes = \[([^\]]*)\]/);
    assert.ok(m, "allowlist not found");
    assert.doesNotMatch(m![1], /contributor-apply/);
  });

  test("organizers IS proxyable, so guarding its GET keeps the admin screens working", () => {
    const m = proxy.match(/const allowedPrefixes = \[([^\]]*)\]/);
    assert.match(m![1], /"\/api\/organizers"/);
  });
});

describe("no endpoint writes accountType from client input", () => {
  test("every accountType write is a hardcoded literal", () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = path.join(dir, name);
        if (statSync(full).isDirectory()) {
          walk(full);
          continue;
        }
        if (name !== "route.ts") continue;
        for (const line of readFileSync(full, "utf8").split("\n")) {
          const m = line.match(/accountType:\s*(.+?)[,;]?\s*$/);
          if (!m) continue;
          const value = m[1].trim();
          // A quoted literal is safe. Anything reading from the request is not.
          const isLiteral = /^"[a-z_]+"$/.test(value);
          const readsRequest = /\bbody\b|\breq\b|\brequest\b|searchParams/.test(value);
          if (!isLiteral && readsRequest) offenders.push(`${full}: ${line.trim()}`);
        }
      }
    };
    walk("src/app/api");
    assert.deepEqual(offenders, [], `accountType written from request data:\n${offenders.join("\n")}`);
  });

  test("firestore.rules blocks accountType from the client on create and update", () => {
    const rules = readFileSync("firestore.rules", "utf8");
    assert.match(rules, /privilegedUserFields/);
    assert.match(rules, /'accountType'/);
    assert.match(rules, /allow create:[\s\S]*?hasAny\(privilegedUserFields\(\)\)/);
    assert.match(rules, /allow update:[\s\S]*?hasAny\(privilegedUserFields\(\)\)/);
  });
});
