# Meetup discovery, round 7 — 20 affluent suburbs and secondary cities

2026-08-31. St Petersburg, Boca Raton, West Palm Beach, Pasadena, Oakland,
Berkeley, Walnut Creek, Frisco, The Woodlands, Mesa, Chandler, Alpharetta,
Greensboro, Durham, Columbia, Franklin, Alexandria, Bethesda, White Plains,
Evanston.

    cities searched            : 20/20
    new groups examined        : ~170
    venue candidates           :  6
    city-level candidates      : 13

**15 listings** — the best round since the first, and a direct test of round
6's conclusion. Round 6 argued the thin small-market result was a market-size
effect rather than an exhausted channel. Choosing affluent suburbs instead of
small towns produced fifteen listings from a comparable number of groups. The
conclusion holds.

## One venue, three sessions

Mahjong Social Club at X-Golf Kildeer runs Tuesdays and Thursdays at 1pm,
Tuesdays and Thursdays at 6pm, and Wednesdays at 10:30am — three listings at
one address, because they are different times for different people. Meetup
confirms each: "Every week on Tuesday, Thursday" twice, "Every week on
Wednesday" once.

Several evening dates appear more than once on Meetup. Those are simultaneous
tables, not extra nights, so the counts in the notes are of postings rather
than of sessions.

## Cross-posting, three times

Social groups in the same region advertise each other's gatherings, which
looks exactly like three separate finds:

- **Oakland.** East Bay Adventures posts Tuesday mahjong at Belly Restaurant
  and Thursday at 13 Orphans, both with venues. Walnut Creek Active Fun
  Friends posts the same two dates and times with no venue. One gathering
  each, advertised twice.
- **San Francisco.** Two groups post "Mahjong Happy Hour" on 12 September at
  5pm, neither with a venue.
- 13 Orphans was already in the directory and skipped on its own.

The event ids differ in every case, so an id comparison does not settle it —
it was the identical dates, times and titles that did. One listing each; the
duplicates are recorded in the batch's `excluded` block with the reasoning, so
a later round does not re-surface them as new.

## Another private address, and a widened filter

Meetup gave one venue as **"Alison's House"**, with a full street address in
Glendora. The private-residence filter added in round 3 only caught the "My
home" form, so this came through with the address attached.

It now also catches `<Name>'s House`, anchored to the whole value so real
venues that merely contain a possessive are unaffected — "Annie O'Love's
Cookie Cafe" and "Seamus McDaniel's" both still pass, because neither *ends*
in home/house/place. Sixteen venue names from these batches were checked
against it.

Two more of this round's listings are hosted in members' homes and named as
such in their titles — "Mahjong PRACTICE at Piper's house", "Mahjong at
Megan's!" — and carry nothing beyond the city.

## Venues the organiser named only in the title

Two groups publish no venue record but say where they are in every event
title: Portillo's in Mundelein, and Central Market in Houston. Both listings
take the **venue name** from the title and leave the **street address empty**.
Houston has more than one Central Market, and guessing which is exactly the
mistake that put a wrong address on Element Eatery last round.

## One I did not list

MAHJONG NIGHTCLUB SF at PanameSF, 523 Broadway — a real weekly night at a real
venue. Meetup records the series as "Every week on Tuesday **until September
1, 2026**", and 1 September is the only date posted: it ends the day after
this run. Listing it as weekly would advertise a session that has stopped.

It is in the `excluded` block with the details, so if the organiser extends
the series it can be listed straight from there.

## Longest series found so far

Women Having Fun in Northern Westchester, Yorktown Heights NY — Mondays
5:30-7:30pm, **16 upcoming dates**, "Every week on Monday until December 19,
2026".

## Files

    research/mahjong-listings-meetup-discovery-r7-2026-08-31.json   15 listings
    research/meetup-discovery-2026-08-31-r7.json                    raw run output

109 listings across ten batches, all passing
`scripts/validate-research-listings.ts`.
