/**
 * Customer-facing copy audit.
 *
 * Two rules are enforced here:
 *
 * 1. No cadence promise the programme is not keeping. The site advertised
 *    "Every month we give away...", "winner is drawn on the last day of the
 *    month" and "automatically entered every month" while the giveaways page
 *    carried a notice explaining that monthly drawings had not run since April
 *    2026 — including in the welcome email sent to every new subscriber and in
 *    the share text organizers post on the brand's behalf.
 *
 * 2. No em dashes in customer-facing copy (house style).
 *
 * Entitlements are deliberately NOT removed: automatic entry, 2x for annual
 * and the loyalty bonus are all still stated. Only the schedule claim is gone.
 * The historical sweepstakes rules are exempt from rule 1 — they are the
 * published ruleset for drawings that already ran, not a current claim.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/** Surfaces named in the brief, plus the shared copy modules. */
const SURFACES = [
  "src/app/page.tsx",
  "src/app/pricing/page.tsx",
  "src/app/signup/page.tsx",
  "src/app/giveaways/page.tsx",
  "src/app/faq/page.tsx",
  "src/app/welcome/page.tsx",
  "src/app/account/page.tsx",
  "src/app/organizer/page.tsx",
  "src/components/UpgradePrompt.tsx",
  "src/lib/constants.ts",
  "src/lib/email.ts",
  "src/lib/giveaway-config.ts",
  "src/app/api/giveaway/route.ts",
  "src/app/api/giveaway/announce/route.ts",
];

/**
 * The lines of a file that are actual copy, with comments removed.
 *
 * This has to be stateful rather than a per-line prefix test: block comments
 * and JSX comments span lines, and the comment bodies in these files quote the
 * very phrases being banned in order to explain why they were removed. A
 * naive filter flags those explanations as violations.
 */
function copyLines(file: string): { n: number; text: string }[] {
  const out: { n: number; text: string }[] = [];
  let inBlock = false;

  readFileSync(file, "utf8")
    .split("\n")
    .forEach((raw, i) => {
      let text = raw;

      if (inBlock) {
        const close = text.indexOf("*/");
        if (close === -1) return; // whole line is inside a comment
        text = text.slice(close + 2);
        inBlock = false;
      }

      // Strip any complete /* ... */ or {/* ... */} spans on this line.
      let guard = 0;
      while (guard++ < 50) {
        const open = text.indexOf("/*");
        if (open === -1) break;
        const close = text.indexOf("*/", open + 2);
        if (close === -1) {
          text = text.slice(0, open);
          inBlock = true;
          break;
        }
        text = text.slice(0, open) + text.slice(close + 2);
      }

      // Strip a trailing line comment.
      const line = text.indexOf("//");
      if (line !== -1) text = text.slice(0, line);

      if (text.trim()) out.push({ n: i + 1, text });
    });

  return out;
}

describe("no suspended-cadence promises", () => {
  const BANNED: [RegExp, string][] = [
    [/Every month,? we give away/i, "claims a monthly giveaway cadence"],
    [/entered every month/i, "claims monthly entry into a running drawing"],
    [/drawn on the last day of the month/i, "promises a draw date that is not scheduled"],
    [/monthly set giveaway/i, "claims a monthly giveaway"],
    [/does a monthly giveaway/i, "claims a monthly giveaway"],
    [/Automatic monthly giveaway entry/i, "claims a monthly cadence in a feature list"],
    [/2 entries every month/i, "claims monthly entries"],
    [/entry in our monthly giveaway/i, "claims a monthly giveaway"],
    [/enter for free by submitting your email/i, "describes an entry route that returns HTTP 410"],
    [/enter for free each month via the giveaway page/i, "describes an entry route that returns HTTP 410"],
  ];

  for (const file of SURFACES) {
    test(file, () => {
      for (const { n, text } of copyLines(file)) {
        for (const [re, why] of BANNED) {
          assert.doesNotMatch(text, re, `${file}:${n} ${why}\n    ${text.trim().slice(0, 140)}`);
        }
      }
    });
  }
});

describe("entitlements are still stated, not quietly removed", () => {
  test("automatic entry for paid members is still promised somewhere", () => {
    const all = SURFACES.map((f) => readFileSync(f, "utf8")).join("\n");
    assert.match(all, /entered automatically|entry is automatic|entered? automatically/i);
  });

  test("the 2x annual benefit is still stated", () => {
    const all = SURFACES.map((f) => readFileSync(f, "utf8")).join("\n");
    assert.match(all, /2x entries/i);
  });

  test("the loyalty bonus is still stated on the giveaways page", () => {
    const src = readFileSync("src/app/giveaways/page.tsx", "utf8");
    assert.match(src, /every 6 months subscribed/i);
  });

  test("cancelling still explains removal from drawings, not silence", () => {
    const src = readFileSync("src/app/account/page.tsx", "utf8");
    assert.match(src, /removed from giveaway drawings/i);
    assert.match(src, /re-entered going forward/i);
  });
});

describe("historical rules are preserved, not rewritten", () => {
  const rules = readFileSync("src/app/sweepstakes-rules/page.tsx", "utf8");

  test("the published monthly ruleset still describes the monthly period", () => {
    // These describe drawings that already ran. Editing them would rewrite
    // the terms past entrants accepted.
    assert.match(rules, /Each monthly Drawing period begins on the first/i);
    assert.match(rules, /last day of each Drawing period/i);
  });

  test("the mail-in method of entry is still documented", () => {
    assert.match(rules, /postmarked by the last day of the Drawing period/i);
  });
});

describe("no em dashes in customer-facing copy", () => {
  for (const file of SURFACES) {
    test(file, () => {
      for (const { n, text } of copyLines(file)) {
        assert.doesNotMatch(
          text,
          /—/,
          `${file}:${n} contains an em dash\n    ${text.trim().slice(0, 140)}`
        );
      }
    });
  }
});
