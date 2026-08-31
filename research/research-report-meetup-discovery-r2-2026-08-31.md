# Meetup discovery, round 2 — 20 metros in weak-coverage states

2026-08-31. Second pass of the city-search pipeline, pointed at a fresh city
list: Detroit, Ann Arbor, Milwaukee, Madison, Indianapolis, Louisville,
Birmingham, Salt Lake City, Albuquerque, Omaha, Providence, Des Moines,
Honolulu, Minneapolis, St Louis, Kansas City, Nashville, Columbus, Cleveland,
Baltimore. Chosen because those states sit at the bottom of the directory's
coverage — Utah 20 listings, Iowa 7, Rhode Island 23.

    cities searched            : 20/20
    new groups examined        : 150
    groups with mahjong events : 5
    rejected                   : 145
    venue candidates           : 2
    city-level candidates      : 5

Seven listings, all seven new — nothing in these cities matched anything
already in the directory.

## The first run of this was wrong, and looked right

The initial round-2 run reported this:

    cities searched            : 20
    new groups examined        : 10
    groups with mahjong events : 0

Nineteen of the twenty cities returned zero groups. That is a believable
result — small metros, a niche game — and I would have written it up as
"the weak-coverage states are weak because there is genuinely nothing there"
if round 1 had not already set a baseline of 158 groups from 20 cities.

The cities had not been searched at all. The script used Meetup's path form,
`/find/<location>/mahjong/`, which resolves for Austin and Albuquerque and
**404s** for Detroit, Columbus and Nashville. A 404 body contains no group
links, so "no groups found" and "the request failed" produced identical
output. The query form, `/find/?keywords=mahjong&location=<location>`, works
for every city tried — but only with the city name capitalised:
`us--mi--Detroit` returns 11 groups, `us--mi--detroit` returns none.

Re-run properly: 150 groups instead of 10.

Three fixes went in so this cannot recur silently:

- The search uses the query form, and `DEFAULT_CITIES` is capitalised.
- Every city's HTTP status is recorded, and any city that did not return 200
  is listed under `citiesFailed` and printed at the end under "did NOT return
  a search page and were not really searched". A zero can no longer pass for
  an answer.
- The output filename no longer collides. The first round-2 run overwrote
  `research/meetup-discovery-2026-08-31.json` — round 1's already-committed
  output — because both stamped the filename with the date alone. Now a second
  run the same day writes `-2`, or takes an explicit `--tag`.

## Two more bugs the candidates exposed

**Sessions were being merged.** West County Singles runs "Mah Jongg and
Dinner" on Tuesdays at 4:00 PM and "Play Mah Jongg — Daytime" on alternate
Fridays at 12:30 PM. Keyed on venue alone, those collapsed into one candidate
reading `tuesday|friday, 4:00 PM` — the wrong time for every Friday session.
Candidates are now keyed on start time as well as place. This is the same
mistake the dedupe pass made earlier with the four Huntersville sessions, in
the other direction.

**Venue-private groups were being discarded.** Fifteen skips were logged as
"no city/state", which reads like bad data. They are not: the events carry
`"venue": null` with `eventType: "PHYSICAL"`, meaning the organiser publishes
no address and gives it to members after they RSVP. Mahjong With Friends
(Greenbrier TN) and West County Singles (Ballwin MO) both run regular mahjong
that way, and both were being dropped. The script now emits a city-level tier
for them, using the group's own registered city, with an explicit instruction
never to invent a street address. Five of the seven listings here come from
that tier and would otherwise not exist.

## Reading the schedule from Meetup rather than guessing it

Each surviving candidate now gets one extra request to an event page, to read
Meetup's own recurrence string. The group events page is no help — it reports
`"series": null` for every event, including ones that do have a series.

    Game Haven Herriman   Every week on Tuesday until March 30, 2027
    Bridge to Dogtown     Every 2nd Saturday of the month until February 14, 2027
    West County (Tue)     Every week on Tuesday until December 29, 2026
    West County (Fri)     Every 2 weeks on Friday
    Greenbrier, Green OH  (no series — each date posted by hand)

This paid for itself twice. The West County Friday event is *titled*
"1st, 3rd and 5th Friday", but Meetup records it as every two weeks, which is
what the dates show; the title is the organiser's approximation. And the
absence of a series on the two Tennessee listings and the Ohio one is what
established that those are hand-scheduled, not weekly — which changed how
they were written up.

The end dates matter too. Three of these series stop within the next six
months. Nothing in the posted dates says so, so a listing built from dates
alone would have gone on advertising West County's Tuesday session into 2027.

## What the descriptions changed

**Game Haven Herriman** would have been listed as Tuesday 11:00 AM–2:30 PM
open play. Its description says: *"learn how to play American mahjong … We
will be meeting at 12pm every Tuesday. To learn how to play, come at 11am and
for $10 get personal lessons."* So the 11am start is a paid beginner lesson
and open play begins at noon. The listing now says that, and carries the $10
in `cost`. It also settles the style — American, stated outright.

**Bridge to Dogtown** is a bridge club that also plays mahjong: *"plenty of
tables for bridge, but only one Mahjong set, so if you want to bring yours,
please do."* `setsProvided` is false, and the description carries the entrance
detail (east door, across from the Seamus McDaniel's parking lot).

## Where these are honest guesses

Five of the seven listings do not state a game style anywhere. There is no
"unknown" in the schema — `other` is a positive claim that it is not
American, Chinese or riichi, which would be worse than an estimate. They are
recorded as `american`, the base rate for US social play at 2,472 of 2,744,
and every one of them says so in `notes` in those words. The two Missouri
listings have the extra hint that "Mah Jongg" is the American spelling
convention, which is suggestive but not a statement.

The Greenbrier weekday listing records `monday|tuesday|friday` for a group
that has no fixed weekday. That is the set of days actually posted, the
description says the schedule varies, and nobody can turn up on a wrong day
regardless: there is no public address and attendance needs an RSVP against
an eight-seat cap.

The Ohio listing is a single dated event rather than a recurring session. The
group's calendar is otherwise trivia and board games, and it posted one
mahjong night with no series behind it. It expires by itself on 10 September.

## Files

    research/mahjong-listings-meetup-discovery-r2-2026-08-31.json   7 listings
    research/meetup-discovery-2026-08-31-r2.json                    raw run output

Nothing here is applied. The listings are candidates for import, and the five
without an address must stay without one.

Run the same pipeline against another city list with
`--cities "us--xx--City,..." --tag <name>`. Capitalise the city.
