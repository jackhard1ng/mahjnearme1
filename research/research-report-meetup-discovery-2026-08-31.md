# Research Report — Meetup discovery across 20 metros

**Date:** 2026-08-31
**Cities searched:** 20
**Listings added:** 19
**URL corrections:** 4
**Flagged for review:** 1 venue

## What "repeat the process" had to mean

Re-running the previous pass would have found nothing. It worked the 57 Meetup
groups already referenced by listings, and those are exhausted — the same input
produces the same output.

So the process was pointed at a new input instead: Meetup's own city search,
which surfaces groups nobody has filed yet. Twenty metros, one search each.

## Numbers

    cities searched               20
    groups found, not yet filed  158
    groups with a mahjong event   36
    groups rejected              122
    venue candidates              22
    genuinely new venues          19
    already in the directory       3

## Why the filters are so aggressive

Meetup's search relevance is loose. Searching "mahjong" in Austin returns a
polyamory group, two chess groups, a euchre group and a pinball group. Appearing
in a mahjong search proves nothing, so a group only counts once its own events
page carries an upcoming event whose **title** mentions mahjong. That alone
rejected 122 of 158.

The same filter runs per event. Several genuine mahjong groups are general
social clubs — one Fort Lauderdale group's calendar has Top Golf, a nightclub, a
safari park and a museum next to its mahjong nights.

Venues then need a real name and street address. Meetup lets organisers type
anything into the location field; the live data contains "Somewhere in Palo Alto,
TBD" and "Midtown, Sacramento, CA".

## Added — 19

Ten states. New for the directory: Grapevine TX, Wilmette IL, Mount Prospect IL,
Fayetteville GA, Hapeville GA, Smyrna GA, Marietta GA, King of Prussia PA,
Wynnewood PA, Maple Shade NJ, Lakewood CO, North Las Vegas NV, Woodbridge VA.

Game style comes from the event titles, not assumed: 6 Chinese/Hong Kong
("Learn and Play Chinese Mahjong", "Hong Kong Mahjong"), 1 riichi ("King of
Prussia Weekly Riichi Mahjong"), the rest American.

One judgement recorded in the listing: Smyrna GA reads "Midweek Mahjong:
American & Hong Kong". It plays both. Filed as American, since that is the style
listed first and the dominant one locally, with the ambiguity in its notes.

## Group relocations found — 4 corrections

The dedupe pass turned up three candidate venues the directory **already has**,
under a Meetup URL that is dead. Those are not new listings; they are the same
groups' new homes:

- **NorthShore Mahjongg** — `northshore-mahjongg` (dead) →
  `northshore-mahjongg-meetup-group` (live, same two venues: Dengeos Buffalo
  Grove and Dengeos Glenview). 4 listings corrected.

## Flagged, not resolved — Burlington MA

The directory holds **four** records for mahjong at the same Wegmans in
Burlington. Two point at the dead `sunday-mah-jongg-burlington`, one at the live
`sunday-mahj-and-more`, one at nothing.

Discovery then found a *second* live group — `american-mah-jongg-sun-wed` — also
running mahjong at that same Wegmans on Sundays.

So there are two live groups and four records for one venue, and no way to tell
from the outside which group succeeded the dead one, or whether both genuinely
run there. Guessing would attach a real listing to the wrong organiser. Left for
a person with a phone.

## Method note

The discovery pipeline is committed as `scripts/discover-meetup-groups.ts`, so
this is repeatable against any city list rather than being a one-off. Pass
`--cities` to point it somewhere new.
