#!/usr/bin/env npx tsx
/**
 * What the live site actually shows, measured with the site's own helpers.
 *
 *   npx tsx scripts/audit-live-quality.ts
 *   npx tsx scripts/audit-live-quality.ts --json audit/live-quality.json
 *
 * Deliberately runs the real code — resolveRecurringSchedule, isEventExpired,
 * normalizeWebsiteUrl, resolvedInstagramUrl — rather than reimplementing the
 * rules. An audit that models the site's behaviour instead of calling it
 * measures a site that does not exist. The schedule figure in particular only
 * means anything after recovery: counting listings whose stored dayOfWeek is
 * empty says 1,870 are broken when most of them render a real next date.
 */

import fs from "fs";
import { resolveRecurringSchedule } from "../src/lib/schedule-recovery";
import { isEventExpired, normalizeWebsiteUrl, resolvedInstagramUrl } from "../src/lib/utils";

const args = process.argv.slice(2);
const OUT = args.includes("--json") ? args[args.indexOf("--json") + 1] : "";
const BASE = args.includes("--url") ? args[args.indexOf("--url") + 1] : "https://www.mahjnearme.com";

type L = Record<string, unknown>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

async function main() {
  console.log(`Fetching ${BASE}/api/listings ...`);
  const res = await fetch(`${BASE}/api/listings?status=all`);
  if (!res.ok) { console.error(`Failed: ${res.status}`); process.exit(1); }
  const all: L[] = (await res.json()).listings;
  const live = all.filter((l) => s(l.status) === "active");

  const noSchedule: L[] = [];
  const expired: L[] = [];
  const noLink: L[] = [];
  const noLinkNoSchedule: L[] = [];
  const noPin: L[] = [];
  const placeholderVenue: L[] = [];

  for (const l of live) {
    const g = l as unknown as Parameters<typeof resolveRecurringSchedule>[0];
    const recovered = resolveRecurringSchedule(g);
    const hasDay = !!s(recovered?.dayOfWeek);
    const hasDate = !!s(l.eventDate);
    const scheduled = l.isRecurring ? hasDay : hasDate;

    if (!scheduled) noSchedule.push(l);
    if (isEventExpired(l as unknown as { isRecurring: boolean; eventDate: string | null })) expired.push(l);

    const linked =
      !!normalizeWebsiteUrl(s(l.website)) ||
      !!normalizeWebsiteUrl(s(l.registrationLink)) ||
      !!resolvedInstagramUrl(l as Parameters<typeof resolvedInstagramUrl>[0]) ||
      !!s(l.facebookGroup) ||
      !!s(l.contactEmail) ||
      !!s(l.contactPhone);
    if (!linked) noLink.push(l);
    if (!linked && !scheduled) noLinkNoSchedule.push(l);

    const gp = l.geopoint as { lat: number; lng: number } | null;
    if (!gp || (gp.lat === 0 && gp.lng === 0)) noPin.push(l);

    if (/^(tbd|tba|varies|various|multiple|rotating|n\/a|unknown)\b/i.test(s(l.venueName))) placeholderVenue.push(l);
  }

  // Same place, same slot, twice.
  const seen = new Map<string, L[]>();
  for (const l of live) {
    const r = resolveRecurringSchedule(l as unknown as Parameters<typeof resolveRecurringSchedule>[0]);
    const key = [s(l.venueName).toLowerCase(), s(l.city).toLowerCase(), s(l.state), s(r?.dayOfWeek), s(r?.startTime), s(l.eventDate)].join("|");
    if (!s(l.venueName)) continue;
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key)!.push(l);
  }
  const dupes = [...seen.values()].filter((g) => g.length > 1);

  const pct = (n: number) => `${((n / live.length) * 100).toFixed(1)}%`;
  console.log(`\n${all.length} listings, ${live.length} active\n`);
  const rows: [string, number][] = [
    ["no schedule anyone can act on (after recovery)", noSchedule.length],
    ["one-off events whose date has passed", expired.length],
    ["no link and no contact of any kind", noLink.length],
    ["  ...and no schedule either", noLinkNoSchedule.length],
    ["no map pin (geopoint 0,0 or missing)", noPin.length],
    ["venue is a placeholder (TBD/Varies/Rotating)", placeholderVenue.length],
    ["duplicate venue+city+slot groups", dupes.length],
  ];
  for (const [label, n] of rows) console.log(`  ${String(n).padStart(5)}  ${pct(n).padStart(6)}  ${label}`);

  if (OUT) {
    const brief = (l: L) => ({ id: l.id, name: s(l.name), city: s(l.city), state: s(l.state), venueName: s(l.venueName) });
    fs.writeFileSync(OUT, JSON.stringify({
      generatedAt: new Date().toISOString(), total: all.length, active: live.length,
      noSchedule: noSchedule.map(brief),
      expired: expired.map(brief),
      noLink: noLink.map(brief),
      noLinkNoSchedule: noLinkNoSchedule.map(brief),
      noPin: noPin.map(brief),
      placeholderVenue: placeholderVenue.map(brief),
      duplicateGroups: dupes.map((g) => g.map(brief)),
    }, null, 2));
    console.log(`\n  -> ${OUT}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
