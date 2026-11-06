# Meetup discovery, round 5 — 20 metros

2026-08-31. Long Beach, Irvine, Santa Rosa, Fresno, Bellevue, Spokane, Eugene,
El Paso, Plano, Sarasota, Fort Lauderdale, Gainesville, Savannah, Greenville,
Asheville, Wilmington, Colorado Springs, Boulder, Tulsa, Henderson.

    cities searched            : 20/20
    new groups examined        : 173
    groups with mahjong events : 13
    venue candidates           : 2
    city-level candidates      : 11

**14 listings** — the largest round so far, and the one where following the
evidence past the first answer paid best.

## Colorado Springs: one candidate, four sessions

The run produced a single candidate: "21C Library", Monday 9:15am, one date,
no series. Its group description said something else — *"Come play American
Mah Jongg on Wednesdays at 1pm at Library 21c"* — and a candidate that
contradicts its own description is worth a second look.

The candidate came from `ladies-of-the-front-range`, which only cross-posts.
The sessions are run by `american-mahjong-cos`, which that group's own
description credits: *"the American MahJong-COS Meetup group has generously
offered to teach us for free"*. Its calendar runs **four** weekly sessions:

    Monday    09:15–12:15   Library 21c        (teaching)
    Wednesday 13:00–16:00   Library 21c        (no teaching)
    Thursday  12:00–15:00   Treehouse Cafe     — already captured in an earlier batch
    Saturday  13:00–16:00   Library 21c        (teaching)

Three new listings instead of one, all pointing at the organising group rather
than the one that reposts it. The Wednesday session is recorded
intermediate/advanced because its title says "(No teaching)".

Meetup writes the library three ways — "21C Library", "Colorado Springs
Library 21 C", "Pikes Peak Library District - Library 21c" — all at 1175
Chapel Hills Dr.

## Two addresses the organisers published outside the venue field

Both of these came through as city-level candidates with no address, and both
had one in plain sight:

- **Wilmington NC** — the event title is *"Let's Play Mah Jongg!  PANERA 3506
  Oleander Drive"*.
- **Van Nuys CA** — the description gives *"OneGeneration 17400 Victory Blvd
  Van Nuys, CA 91406"*, plus $75 for a year's unlimited play, free parking,
  and an RSVP link to luma.com rather than Meetup.

Discovery now flags titles that look like they name a street address or a
place, so these surface for review rather than depending on someone reading
every description. It reports the hint; it never acts on it.

That flag also caught **Orange, CA**: a candidate filed under Sunset Beach,
where the group is registered, whose title reads "Beginners Mahjong Game in
Orange" — twenty miles inland. The city is corrected in the listing.

## Two sessions that were being merged into one

Collin County Sisters run "Advanced American Mah Jongg" and "Beginners
American Mah Jongg" on the same Tuesdays at the same hour. Keyed on start time
alone they became a single listing — which would have sent beginners to the
advanced table.

Candidates are now keyed on a stem of the event title as well as the time. The
host's name is stripped first, because the advanced session rotates between
homes: "at Jacquie's", "at Mary's", "at Barbara's" are one series, not three.
What is left is cut to three words, which still keeps Cary's "Mah Jongg Monday
- Play only" and "- Learn and play" together, correctly, as one session run in
two modes.

## The cruise came back

Round 3 excluded a mahjong cruise sailing from Galveston, posted under the
organising group's home city of Denton. Round 5 found it again — because only
*accepted* listings were being remembered between batches. A decision not to
list something is as much a result as a listing, so the batch files'
`excluded` blocks now feed the known-groups set too. Re-running the round, it
is gone.

## One duplicate I could not resolve, and did not guess at

Two Huntington Beach groups — "Huntington Beach Social and Games Group 50+"
and "Huntington Beach Game Group" — post an American Mahjong class at 4:30pm
on the same Tuesday, in the same city, both with no venue. They share no event
ids and have different capacities (4 and 5), and neither publishes a
description or a host name.

That is not enough to call it either way. Only one is listed — the one with a
Meetup series and three dates — and the other is recorded in the batch's
`excluded` block with the reason, so a later round does not surface it as a
new find. The listing says so in its notes rather than presenting a clean
answer I do not have.

## A skip message that cost me twenty minutes

The run reported "Treehouse Cafe — venue already in the directory". It is not
in the directory; nothing in production mentions it. I went looking for a bug
in the fuzzy venue matching added last round.

The match was correct. Treehouse Cafe is in `mahjong-listings-meetup-
2026-08-31.json`, an earlier research batch — Thursday 12:00–15:00, group
`american-mahjong-cos`, which this round's evidence independently confirms.
The message was wrong, not the logic: "already known" covers the live
directory *and* earlier batches, and it now says so.

## Savannah plays both styles

*"Whether you prefer Chinese or American style, you're a beginner or
experienced, join us."* First Friday of the month, free with donations
welcome. The schema takes one `gameStyle`, so it is recorded as american and
the description carries both — the field should not be read as a claim that
Chinese is not played there.

## Files

    research/mahjong-listings-meetup-discovery-r5-2026-08-31.json   14 listings
    research/meetup-discovery-2026-08-31-r5.json                    raw run output

93 listings now across eight batches, all passing
`scripts/validate-research-listings.ts`.
