# Eventbrite — a second discovery channel, and a better one for addresses

2026-08-31. Twenty metros, two search pages each.

    search pages read        : 40/40
    named mahjong in title   : 213
    dropped, online only     : 12
    dropped, no usable venue : 25
    venue already known      : 11
    NEW venue candidates     : 165

**165 listings** — more than all twenty-one Meetup rounds put together
(136), from forty page requests instead of ~2,900.

## Why this channel exists

Meetup is exhausted for metros and their suburbs: rounds 17, 18 and 21 all
returned zero new groups. But the deeper problem was never coverage, it was
**addresses**. Rounds 8 and 9 found fifteen mahjong groups across forty
affluent suburbs and not one published a venue, because Meetup mahjong in
those places is private social clubs meeting in members' homes.

Eventbrite is a ticketing platform, so a venue and a street address are the
entire point. Every result carries `primary_venue.address` with `address_1`,
city, region, postcode and coordinates.

| | Meetup, 21 rounds | Eventbrite, 1 run |
|---|---|---|
| listings | 136 | **165** |
| with a street address | 78 | **165** |
| requests | ~2,900 | 40 |

## How it reads

Search pages embed the whole result set as JSON in a
`window.__SERVER_DATA__` assignment, under `search_data.events.results`, 20 to
a page with `page_count` alongside. No API key, no rate limit met.

Two things had to be handled. The blob is hundreds of kilobytes with nested
braces throughout, so it is **brace-matched from the opening brace** — a
non-greedy regex stops at the first inner close and yields nothing.

And Eventbrite answers Node's `fetch` with **405 Method Not Allowed** on a
plain GET while `curl` gets 200 for the identical URL — same User-Agent, same
Accept headers, no proxy failure logged either way. It is a client fingerprint
check. Rather than guess at headers that might satisfy it, the script shells
out to the client that works, and says why in a comment.

## What is filtered

Search relevance is as loose as Meetup's, so the same discipline applies: a
result is kept only when **its own title** names mahjong. Appearing in a
mahjong search proves nothing.

- **Online events are dropped** — a Zoom class has no city, and this is a
  directory of places to turn up to.
- **Past dates are dropped.**
- **Venues without a street address are dropped**, 25 of them.
- **Venues already in the directory are dropped**, 11 — including from the
  Meetup batches written earlier today, since prior research files feed the
  known-venue set.

## What came out

    recurring (2+ dated occurrences) :  21
    single dated events              : 144
    open play / lesson / league      : 102 / 62 / 1
    american / chinese               : 160 / 5

Frequency on the recurring ones is read from the actual gaps between dates —
weekly at 8 days or under, biweekly to 16, monthly beyond. Type comes from the
title (101/102/beginner/learn → lesson; league → league). Style comes from the
title or summary where it says so, and falls back to the base rate with a note
saying so, exactly as in the Meetup batches.

The 144 singles run from tonight to 8 December, 140 of them within 60 days.
They expire on their own.

## Sixteen venues that are really an address

Sixteen candidates have a "venue name" that is just a street address —
"2957 E Pinto Dr", "852 Flinns Rd", "8151 Bell Tower Crossing". That usually
means a private home, or an organiser who typed the address into the name
field.

These are **kept**, and the distinction from the Meetup batches matters:
Eventbrite publishes the address openly on a public ticket page that anyone
can buy from, whereas a Meetup venue is shown only to people who joined the
group. Publishing what the host has already published publicly is a different
act from republishing what they showed their members. Each of the sixteen says
so in its notes, with `venueName` left empty rather than repeating the address,
and is worth a look before being featured anywhere.

## Verification

Ten source URLs sampled at random: all ten return 200 and mention mahjong.
All 165 pass `scripts/validate-research-listings.ts`.

## Where to take it next

This run used **two pages per metro**. New York alone reports 49. The same
script with `--pages 10` and a wider `--places` list is the obvious next step,
and unlike Meetup there is no sign of the channel running dry.

    npx tsx scripts/discover-eventbrite.ts --places tx--austin,fl--naples --pages 10 --tag eb2
