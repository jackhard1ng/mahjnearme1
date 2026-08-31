# What is waiting to be applied

Everything in `audit/` and `research/` was produced without Firestore
credentials, so **none of it has touched the live site**. This is the map.

Code changes are separate and already live on the branch — they take effect on
merge and need nothing from you.

---

## 1. Corrections — 3,812 operations across nine files

    ADMIN_KEY=… npx tsx scripts/apply-audit-corrections.ts audit/<file>.json --dry-run
    ADMIN_KEY=… npx tsx scripts/apply-audit-corrections.ts audit/<file>.json

**Always dry-run first.** Nothing is ever deleted: every "removal" is
`status: inactive`, which is reversible.

Apply in this order — cheapest and safest first, so a problem shows up before
the riskier files run.

| order | file | ops | what it does |
|---|---|---|---|
| 1 | `corrections.json` | 2,406 | Trim whitespace; clear stale one-off dates from recurring listings |
| 2 | `schedule-days.json` | 692 | Give 692 recurring listings the weekday they never had |
| 3 | `expired-one-off-events.json` | 558 | Deactivate events whose date passed over 90 days ago |
| 4 | `dedupe.json` | 75 | Merge duplicate listings (69 deactivations) |
| 5 | `redirect-corrections.json` | 36 | Follow moved source URLs |
| 6 | `linktree-owner-sites.json` | 18 | Set `website` to the organiser's real domain |
| 7 | `miscategorized-go-clubs.json` | 13 | Deactivate 13 listings that play **Go**, not mahjong |
| 8 | `burlington-and-dengeos.json` | 8 | Fix two clusters of duplicate/mis-stated records |
| 9 | `meetup-moved-groups.json` | 6 | Point dead Meetup URLs at the live groups |

**The two with the most visible effect are 2 and 3.** `schedule-days.json`
turns 692 cards from "Schedule TBD" into a real next date, which is what puts
them into search ordering and the "what's on this week" surfaces. And
`expired-one-off-events.json` takes ~600KB out of the payload every visitor
downloads.

**Read the reason on any op before you accept it.** Two are worth knowing
about up front:

- `burlington-and-dengeos.json` deactivates two listings filed in Burlington,
  **Vermont** with Vermont coordinates. They are Burlington, Massachusetts:
  Wegmans publishes 115 stores and none in Vermont.
- `miscategorized-go-clubs.json` removes Gotham Go Group and Houston Go Club.
  They play Go. Verified two independent ways.

---

## 2. Research listings — 134 candidates, not yet imported

    npx tsx scripts/validate-research-listings.ts     # run this before importing anything

Thirteen batch files in `research/`, each with a matching
`research-report-*.md` explaining what was found, what was rejected and why.

| | |
|---|---|
| total listings | **134** |
| with a street address | 72 |
| city-level, no address | 62 |

**The 62 without an address are correct as they are.** Those organisers
publish no venue — the events carry `"venue": null` — and give the address out
after RSVP. Several are members' homes. A handful were withheld deliberately:
Meetup gave a full street address for "My home" in Naples and "Alison's House"
in Glendora, and republishing someone's home on a public directory is not
something they agreed to.

Every listing's `notes` field records where each fact came from and flags
where a judgement was made — game style inferred from a base rate, a frequency
read off dates rather than stated, an address discrepancy worth a phone call.

Two things are recorded in `excluded` blocks rather than listed: a mahjong
cruise sailing from Galveston (no fixed venue, wrong city), and **three weekly
Hong Kong style sessions in Burlington, Ontario** — the site has no province
support, so a state of `ON` would render as a bare code with no state page.
That one is ready to import the day Canada is supported.

---

## 3. Two things that still need you

**The `/api/listings` paywall bypass is not fixed.** See
`audit/SECURITY-paywall-bypass.md`. Closing it needs a Firebase token check I
cannot test here — there is no test account in this environment — and shipping
an entitlement check I have never seen succeed risks silently stripping every
address and phone number from paying subscribers. That is worse than the leak
and harder to notice.

**Instagram profile reading works but not from here.** `scripts/check-instagram-profiles.ts`
reads a profile's bio, name and **link in bio** using a crawler User-Agent —
Instagram serves crawlers a rendered profile while giving browsers a login
shell. About ten requests from one address and everything after returns 429,
and this environment's IP is now durably blocked. Run it from somewhere else,
slowly. 449 listings with no URL carry an Instagram handle, and the link in
bio is the machine-readable route to a real website.

---

## Where the coverage now stands

Nineteen discovery rounds, roughly 380 cities. The yield tracks city type
sharply:

- **Big metros and affluent suburbs** produced 14–19 listings a round.
- **Small towns** (round 6) produced 1 from 143 groups.
- **Metro suburb rings** (rounds 17–18) produced **zero** — every group they
  returned was already known. The metros are done.

Two patterns worth acting on:

1. **Library calendars beat Meetup for addresses.** Rounds 8 and 9 found
   fifteen mahjong groups across 40 affluent suburbs and not one published a
   venue — they are private clubs meeting in members' homes. Every
   venue-backed find in the later rounds that had a clean public address was a
   library. A library programme always yields an address, because the library
   is the host.
2. **1,000 active listings still carry no URL of any kind.** That, not more
   cities, is where the unverified inventory is.
