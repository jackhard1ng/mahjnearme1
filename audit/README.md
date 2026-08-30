# Audit output — 2026-08-30

Generated against live production data (3,801 listings, 2,297 visible).
Regenerate any of these at any time; nothing here is hand-written.

Every file is input for the existing pipeline:

```
ADMIN_KEY=… npx tsx scripts/apply-audit-corrections.ts audit/<file>.json --dry-run
ADMIN_KEY=… npx tsx scripts/apply-audit-corrections.ts audit/<file>.json
```

**Always dry-run first.** These were generated without Firestore credentials,
so none of them has been applied.

## Apply in this order

### 1. `corrections.json` — 346 ops, mechanical
`npx tsx scripts/audit-listing-data.ts`

- 17 listings with untrimmed name/city/state/venueName. `" Red Feather Lakes "`
  groups separately from the real city, so it splits city pages and hides
  duplicates from any name match.
- 329 recurring listings carrying a past one-off `eventDate`. Safe to clear
  only because each has a real weekday schedule, so the timing helper derives
  the next occurrence and ignores the stale date entirely.

Lowest risk of anything here. Nothing is deleted; no listing leaves the site.

### 2. `schedule-days.json` — 635 ops, highest impact
`npx tsx scripts/recover-schedule-days.ts`

Fills the missing `recurringSchedule.dayOfWeek` on recurring listings.

This is the biggest single win available. 1,870 of 2,253 recurring listings
(83%) have no day, and without one `getEventTiming` cannot compute a next
occurrence — so those listings show a bare "Recurring" label, sort last
wherever the site orders by soonest, and never appear in the homepage
carousels or any "what's on this week" surface. Applying this takes listings
able to show a real next date from **383 to 1,018**, and also recovers a start
time for 224 of them.

Sources, most reliable first: 469 from the listing id (ids were generated from
structured data at import, so the day was known and lost on the way into the
schedule field), 76 from the name, 90 from the description.

Confidence: on the 421 corrections where the listing text independently names a
day, the recovered day agrees 421 times and disagrees zero times.

### 3. `dedupe.json` — 75 ops, review first
Same script as (1).

69 deactivations plus 6 keepers backfilled beforehand, so no phone number,
email or website survives only on a record about to be switched off. Duplicates
are set to `status: "inactive"`, never deleted, so every merge is reversible.

Grouped by name + city + state + **day + start time**. The day matters: a club
meeting several times a week files one listing per session under one name, and
an earlier name-only version of this key called Huntersville NC's four separate
Monday-to-Thursday "American Mahjong" sessions duplicates of each other.

## Needs a person — not applyable

### `review.json`
- **2 duplicate groups withheld.** "Mahjong in the Mountains" (Red Feather
  Lakes, CO) and "Guided Play Lesson with Kim" (Mobile, AL). Both records in
  each pair are organizer-edited, so switching either off would override a real
  person's listing.
- **6 recurring listings with a past date and no weekday.** Likely annual
  retreats where the date is the only timing information there is, so clearing
  it would lose data. They need a real recurrence filled in instead.

### `schedule-days-review.json`
- **9 ambiguous** — two or more distinct weekdays in the text. Some are
  genuinely multi-day and the schema supports `"tuesday|thursday"`, but a
  mention of two days is not evidence of a two-day session.
- **1 conflict** — Brick Township Senior Center: the id says wednesday, the
  description says thursday. No way to tell which is right without checking.

### `source-verification-actionable.json`
`npx tsx scripts/verify-listing-sources.ts`

The two buckets worth acting on, out of 2,297 live listings checked:

- **66 dead** — 404, 500 or unreachable. Spot-checked independently: the 404s
  reproduce and sit on mahjong-specific paths (`/mahjongg`,
  `/summer-mahjong-club/`), so those programme pages were removed rather than
  moved. One domain no longer resolves at all.
- **170 no_mention** — a real event page still loads, but no longer mentions
  mahjong. Most likely ended.

Not included, and not action items: 734 `confirmed`, 338 `homepage_only`
(the listing cites the organisation's front door rather than an event page — a
source-quality problem, not a dead listing), 114 `blocked` (bot protection,
which is evidence of nothing), 875 `no_source`.

Note that `confirmed` only means the page still mentions mahjong somewhere. It
does not confirm the day, time, price, or that the specific session survived —
which is exactly why no script here stamps `lastVerified`.

## The finding no file can fix

**875 live listings carry no source URL at all.** They can never be re-verified
by any automated pass, and they are 38% of the live inventory. Getting a source
onto those is the structural fix behind the "Not recently verified" badge.
