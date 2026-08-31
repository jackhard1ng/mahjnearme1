# Meetup discovery, rounds 11–13 — 60 cities

2026-08-31. Long Island and the NJ/PA suburbs; western secondary cities;
northern New England and the upper Midwest.

    round  groups examined  venue  city-level   (after re-run)
    r11                125      2           2
    r12                139      0           1
    r13                ~120     0           0 listable

**4 listings.**

## Rounds 11 and 12 were run against a stale picture

Both were launched while I was still writing up rounds 8–10, so the
cross-batch dedupe could not see that write-up yet. They dutifully
re-discovered Cherry Hill's Game Friendzy workshop, Lansdale, Kennesaw,
Atlanta and all five Palm Springs sessions — every one of which had just been
claimed.

Re-run afterwards, round 11 dropped from 11 candidates to 4 and round 12 from
7 to 1. Nothing was lost; the dedupe worked exactly as intended, it was simply
racing a file that did not exist yet. Worth remembering when running rounds in
parallel: the write-up has to land before the next round starts, or the next
round measures the world as it was.

## Two library venues — a change from rounds 8–10

Rounds 8 and 9 found fifteen mahjong groups across 40 affluent suburbs and
**not one published a venue**. Round 11 breaks that with two, and both are
public libraries:

- **Connetquot Library**, 760 Ocean Avenue, Bohemia NY — Thursdays 10am,
  weekly.
- **Haymarket-Gainesville Library**, 14870 Lightner Road, VA — first Thursday
  of the month, run by Prince William Public Libraries itself.

That is the pattern worth noticing. A private social club meeting in someone's
home will never yield an address; a library programme always will, because the
library is the host. If the goal is listings with real addresses, library
event calendars are a better channel than Meetup social groups.

## A rare style, and a venue that is not an address

Moorestown Women's Social posted "**Chinese** Mah Jongg at the Mall" — style
stated in the title, and Chinese accounts for only 116 of 2,744 listings. The
title also names the venue, but "the Mall" is not an address, so none is
recorded. Moorestown Mall is the obvious referent; the organiser did not
actually say so, and last round's Element Eatery mistake came from exactly
that kind of filling-in.

## A find the site cannot hold

The `us--vt--Burlington` search returned a Burlington group running **three
weekly Hong Kong style sessions** — Friday and Tuesday afternoons and
Wednesday evenings. Hong Kong style is rare in the directory and three weekly
sessions is a substantial find.

It is Burlington, **Ontario**.

`US_STATES` in `src/lib/constants.ts` holds the fifty states and DC and
nothing else. A listing with state `ON` would render its state as the bare
code, generate no state page, and fall out of the state navigation and the
sitemap. Supporting Canada touches state pages, SEO and the sitemap — a
product decision, not something to slip in through a listing.

It is recorded in the batch's `excluded` block in full, ready to import the
day provinces are supported.

## Round 13 confirms the round-6 finding again

Twenty northern New England and upper Midwest cities — Portland ME, Burlington
VT, Ithaca, Erie, Duluth, Fargo, Sioux Falls — produced nothing listable.
Together with round 6 and round 10, that is three separate sweeps showing the
same thing: outside metros and affluent suburbs, Meetup mahjong is thin.

## Files

    research/mahjong-listings-meetup-discovery-r11-r13-2026-08-31.json  4 listings
    research/meetup-discovery-2026-08-31-r11.json                       raw run output
    research/meetup-discovery-2026-08-31-r12.json
    research/meetup-discovery-2026-08-31-r13.json

123 listings across twelve batches, all passing
`scripts/validate-research-listings.ts`.
