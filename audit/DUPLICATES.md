# Duplicate listings — review, no deletions performed

Produced from a read of the live `/api/listings?status=all` response on 2026-11-05
(3,801 documents, 2,879 active). **Nothing was deleted, deactivated or merged.**
Every record named here is still live and unchanged.

## Method

Active listings were grouped by every stored field *except* `id`, `createdAt`,
`updatedAt` and `metroRegion` (the last is derived on read, not authored). A group
of two or more means the records are byte-identical in everything a visitor or an
operator would use to tell them apart — name, venue, address, city, state,
schedule, cost, contact, description, organizer, status, the lot.

For each group I also checked the two places user engagement is stored:
the counters on the document (`goingCount`, `beenHereCount`, `headsUpCount`) and
the separate `listingReactions` collection, queried per record through the public
reactions endpoint.

## Headline

- **94 duplicate groups**, covering **190 active records** — about 96 redundant rows.
- **Zero engagement on any of them.** Every record in every group has 0 going / 0 been-here / 0 heads-up, and `listingReactions` returns an empty set for each. No user data is attached to any duplicate.
- They fall into three distinct causes, with different fixes.

## The two Mahjong in the Mountains records (what you asked about)

| | `ZqfVlERIeq1SUF3VPSmS` | `2Nj4XcjTYJF3tsHnnlaX` |
|---|---|---|
| createdAt | 2026-06-21T04:16:07.536Z | 2026-06-21T04:16:34.791Z |
| updatedAt | same as createdAt | same as createdAt |
| Every other field (51 of them) | identical | identical |
| Engagement | 0 / 0 / 0, no reactions | 0 / 0 / 0, no reactions |

**27.3 seconds apart, never edited since.** Same `organizerId`
(`gPo4uIdASaLV1MHijrlN`), same `claimedBy` (`P1yUIh65wfU6nmkXuTNXgg00dMC2`), same
`source: organizer_submitted`. This is one organizer submitting the form twice —
most likely a double click, or a first submit that looked like it had failed.

The identical `updatedAt` is itself evidence for the save bug fixed in this branch:
neither record has ever been successfully written to since creation, despite both
carrying a trailing space on name, city and address that someone editing them would
have tried to remove.

### Recommendation (yours to action, not done here)

Keep `ZqfVlERIeq1SUF3VPSmS` (the first submit), set the other to `inactive`.
Reasoning: the two are indistinguishable on content, so the tiebreak is provenance,
and the first submit is the one the organizer meant. Prefer deactivating over
deleting — it is reversible, and `/api/listings` DELETE already soft-deletes.

Two things to do at the same time:

1. **Fix the record you keep before deactivating the other.** Both describe a
   three-day retreat (July 21–23, 2026) but are stored as a *weekly Tuesday*
   session, 10:00–22:00, with `eventDate: 2026-07-21` sitting underneath. Because
   `isRecurring` is true, `isEventExpired()` returns false and the page still shows
   it as a live weekly game four months after the retreat ended. The admin edit
   form in this branch now has a Recurring / One-time switch; set it to One-time
   with date 2026-07-21 and the expiry logic will treat it correctly.
2. **Update the queued correction files.** Both IDs appear in `audit/corrections.json`,
   `audit/review.json` and `audit/instagram-watchlist.json`. If you deactivate one,
   drop its entries so the apply step does not resurrect it.

## The other 93 groups — two different causes

### a) Re-import with regenerated IDs — 84 groups

Every group in this cohort has its two records created **exactly 4,839 seconds
(80 minutes 39 seconds) apart**, at 2026-04-08T07:12 and 2026-04-08T08:33. That is
not user behaviour; it is the same dataset imported twice.

The give-away is the ID shape. For one pair:

```
afternoon-mahjong-meetups-at-henry-carte-clinton-ct-monday-1-716e617f   (07:12 run)
clinton-ct-hch-mj-monday-afternoon-1                                   (08:33 run)
```

Same event, two different slug schemes. `/api/listings/import` dedupes by document
ID, so a different ID is a different record. It *does* have a name+city+state
check — but `src/app/api/listings/import/route.ts:65` scopes that index to
`organizerEdited == true` only. These are `web_research` rows, so nothing caught them.

**Do not simply widen that check to name+city+state for all listings.** Several
legitimate listings share a name within one city and differ only by day — the
Rocky Hill Senior Center, Livingston Senior Center and Seattle Mahjong Club rows
are real examples. A safe key needs the schedule in it, e.g.
name + city + state + dayOfWeek + startTime, or eventDate for a one-off.

### b) Same-batch duplicates — 9 groups

These were created in the same write batch (gap of 0 seconds), so the source JSON
itself contained the row twice under two IDs. A pre-import check inside the payload
would catch these; the API never sees them as a collision.

## Full inventory

`audit/duplicate-groups.json` lists every group with its IDs, name, city, state,
creation gap and engagement total, so you can work through them or script it.

## What I did not do

- No record was deleted, deactivated, merged or edited.
- No change to import dedupe behaviour. Getting the key wrong would start rejecting
  legitimate listings, and that trade-off is yours to make — see the warning above.
- No change to the `isRecurring` / `eventDate` contradiction on any existing record.
  The form now writes the two shapes exclusively, and the admin detail panel flags
  records holding both, but nothing was rewritten in bulk: a date on a record whose
  recurrence is simply mis-recorded would be destroyed by a blind migration.
