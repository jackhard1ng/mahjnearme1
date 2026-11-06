# Duplicate listings: read-only audit

Generated 2026-11-05 from a read of the live `/api/listings?status=all` response
(3,801 documents, 2,879 active) plus a per-record query of the `listingReactions`
collection through the public reactions endpoint.

**Nothing was deleted, deactivated, merged or edited.** Every record named here is
still live and unchanged. Full machine-readable detail, including source URLs,
schedules, organizer ownership and engagement counters for every record, is in
`audit/duplicate-groups.json`.

## Two categories, and why the distinction matters

| | Groups | Records |
|---|---|---|
| Exact duplicates (identical on every stored field) | 94 | 190 |
| Same name + city + state, **different** schedule or venue | 36 | 86 |

The second category is the reason not to reach for a name-based dedupe key. These
are listings that look like duplicates by name and location and are not:

- **2026 NMJL Card Review & Open Play** (Little Rock, AR)
  - `2026-nmjl-card-review-open-play-access-student-union` / Student Union building / one-off 2026-04-14
  - `little-rock-devine-mahjong-4` / ACCESS student union building / one-off 2026-04-14
- **Guided Play Lesson with Kim** (Mobile, AL)
  - `KKrdkVjt1TiUMjVtIN31` / Coffee Monster / weekly friday 14:00-16:30
  - `ldExzb6sEGRYR7iFjGZo` / Coffee Monster / weekly friday 14:00-16:00
- **ACC Senior Services Mahjong Club** (Sacramento, CA)
  - `acc-senior-services-mahjong-club-sacramento-ca-monday-11-00-269ab5fa` / ACC Senior Services / no schedule stored
  - `acc-senior-services-mahjong-club-sacramento-california-900-am` / ACC Senior Services (Culinary Center) / weekly monday|wednesday|friday 09:00-15:00
- **Mahjong 101** (Alpharetta, GA)
  - `alpharetta-le-mahj-club-2` / Painted Horse Winery / one-off 2026-04-15
  - `alpharetta-le-mahj-club-4` / Painted Horse Winery / one-off 2026-04-29
- **Social Play at Hinge @ Pearl Hotel** (Bay St. Louis, MS)
  - `bay-st-louis-hinge-social-play-1` / Hinge at Pearl Hotel / one-off 2026-04-13
  - `bay-st-louis-hinge-social-play-2` / Hinge at Pearl Hotel / one-off 2026-04-27

Some of those are genuinely separate sessions (Mahjong 101 runs on 15 April and on
29 April; the Mobile lesson runs 14:00-16:30 and 14:00-16:00). Others are the same
real session recorded twice with different data quality (Bryant Park has one record
with a Thursday schedule and one with none). The two cases need opposite
treatment, and only a human reading the source can tell them apart, so neither is
actioned here.

**Zero engagement is not permission to remove a record.** Every record in every
group has 0 going / 0 been-here / 0 heads-up and no rows in `listingReactions`, so
no *user* data would be lost. That says nothing about whether the listing is
accurate, whether an organizer depends on it, or whether an inbound link points at
it. It removes one objection, not the need for judgement.

## Exact duplicates: three distinct causes

### Re-import with regenerated ids: 84 groups

One dataset imported twice, 4,839 seconds (80m 39s) apart, at 2026-04-08T07:12 and 2026-04-08T08:33. The ids give it away: the same event appears as `afternoon-mahjong-meetups-at-henry-carte-clinton-ct-monday-1-716e617f` from the first run and `clinton-ct-hch-mj-monday-afternoon-1` from the second. `/api/listings/import` dedupes by document id, so a different slug scheme is a different record. It does carry a name+city+state check, but `src/app/api/listings/import/route.ts:65` scopes that index to `organizerEdited == true`; these are `web_research` rows, so nothing caught them.

### Same-batch duplicates: 9 groups

Created in the same write batch, so the source payload itself contained the row twice under two ids. A pre-import check inside the payload would catch these; the API never sees them as a collision.

### Organizer double-submit: 1 group

The two "Mahjong in the Mountains" records, 27.3 seconds apart, identical across 51 of 54 fields, same organizerId `gPo4uIdASaLV1MHijrlN` and same claimedBy. One organizer submitting the form twice. See the dedicated section below.

## The Mahjong in the Mountains pair

| | `ZqfVlERIeq1SUF3VPSmS` | `2Nj4XcjTYJF3tsHnnlaX` |
|---|---|---|
| createdAt | 2026-06-21T04:16:07.536Z | 2026-06-21T04:16:34.791Z |
| updatedAt | identical to createdAt | identical to createdAt |
| Other 51 fields | identical | identical |
| Engagement | 0/0/0, no reactions | 0/0/0, no reactions |
| organizerId | gPo4uIdASaLV1MHijrlN | gPo4uIdASaLV1MHijrlN |
| claimedBy | P1yUIh65wfU6nmkXuTNXgg00dMC2 | P1yUIh65wfU6nmkXuTNXgg00dMC2 |

`updatedAt` still equals `createdAt` on both, which is independent evidence for the
save bug: nobody has ever successfully written to either record, despite both
carrying a trailing space on name, city and address.

### Recommendation, for Jack to action

Keep `ZqfVlERIeq1SUF3VPSmS`, the first submit. Set the other to `inactive` rather
than deleting it: reversible, and `/api/listings` DELETE already soft-deletes.
Before doing either, fix the record being kept, and drop the other record's entries
from `audit/corrections.json`, `audit/review.json` and
`audit/instagram-watchlist.json` so the apply step does not resurrect it.

## What was deliberately not done

- No record deleted, deactivated, merged or edited.
- **Import dedupe unchanged.** Widening the key to name+city+state would reject the
  86 records in the second table above. A safe key needs the schedule in it, for
  example name + city + state + dayOfWeek + startTime, or eventDate for a one-off,
  and that is a behavioural change worth making deliberately rather than as a
  side effect of a duplicate cleanup.
- No bulk rewrite of the `isRecurring` / `eventDate` contradiction. The admin forms
  now write the two shapes exclusively and the detail panel flags records holding
  both, but a date on a record whose recurrence is merely mis-recorded would be
  destroyed by a blind migration.
