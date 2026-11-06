# Research Report — National Tournaments

**Date:** 2026-08-30
**Scope:** Upcoming dated tournament events, nationwide
**Listings added:** 10
**Sources checked:** 4

## Why this scope

Jack asked for all cities, biggest first. Before researching I audited the live
data to find where the gap actually was, and the answer changed the plan:

- 2,253 recurring listings are live and healthy.
- **2** upcoming one-off dated events existed across the entire site.

Recurring coverage is not the problem — the dated-events calendar is. The April
NMJL-card surge (667 events) expired and nothing replaced it. So this first pass
targets dated tournament events nationally rather than working city by city,
because that is what fills an empty calendar fastest. City-by-city recurring
expansion is the right follow-up, not the right start.

This pass takes the site from **2 upcoming dated events to 12**.

## Added

All ten were verified on the organiser's own site, which lists venue, street
address and price publicly. Verified 2026-08-30.

| Event | Date | City | Venue |
|---|---|---|---|
| Piscataway, NJ September 2026 | 2026-09-25 | Piscataway, NJ | Embassy Suites Piscataway |
| Piscataway, NJ December 2026 | 2026-12-11 | Piscataway, NJ | Embassy Suites Piscataway |
| Las Vegas, NV 2027 | 2027-03-07 | Las Vegas, NV | The Orleans Hotel & Casino |
| Piscataway, NJ April 2027 | 2027-04-16 | Piscataway, NJ | Embassy Suites Piscataway |
| Atlanta, GA 2027 | 2027-05-16 | Atlanta, GA | Atlanta Marriott Perimeter Center |
| Lancaster, PA 2027 | 2027-07-11 | Lancaster, PA | DoubleTree Resort Lancaster |
| Foxwoods, CT 2027 | 2027-08-01 | Mashantucket, CT | Foxwoods Resort Casino |
| Piscataway, NJ September 2027 | 2027-09-10 | Piscataway, NJ | Embassy Suites Piscataway |
| Mah Jongg Tournament Cruise 2027 | 2027-11-14 | Miami, FL | Celebrity Beyond |
| Piscataway, NJ December 2027 | 2027-12-03 | Piscataway, NJ | Embassy Suites Piscataway |

Source for all ten: https://mahjonggfever.com/mah-jongg-tournaments/

**Two are sold out** and flagged in `notes` — Piscataway December 2026 and
Atlanta 2027. They are included because they are real, dated, and carry
waitlists, but confirm the waitlist before promoting either.

## Verified but skipped

- **Mah Jongg Tournament Cruise 2026** (2026-10-04, Celebrity Beyond, Miami FL).
  Already in the directory as "Mahjong Cruise 2026", same ship, same date,
  status active. Skipped as a duplicate.
- **Lancaster PA 2026** and **Mah Jongg Fever West Palm Beach** already exist as
  past-dated listings. The 2027 Lancaster event added here is the next edition,
  not a duplicate of it.

## Could not verify

- **destinationmahjongg.com** — bot protection. Returns a 183-byte HTTP 202 stub
  to curl and resets the connection in a headless browser. Several events are
  attributed to this organiser in aggregator listings (Dover DE 27-29 Sep 2026,
  Houston TX 6-8 Nov 2026, St Petersburg FL 16-18 Nov 2026, Phoenix AZ 11-13 Dec
  2026, Savannah GA and Palm Springs 2027). **Not added** — worth chasing
  manually from a normal browser, and likely the single highest-value follow-up
  here.
- **bamgoodtime.com event pages** — the aggregator's public listing confirms
  name, date, city and organiser, but venue address and registration link sit
  behind a free account. Confirmed on the Bronco BIG BAM BRAWL page
  (Mustang OK, 2026-09-19). Not added rather than shipping listings with no
  venue.
- **Mah Jongg World Championship 2026** (Las Vegas, 16-18 Oct 2026, The Paris)
  appeared in search results but I could not load a primary source. Not added.

## New leads for next time

Confirmed-real organisers worth pulling directly, each running multiple dated
events:

- **Destination Mah Jongg** — needs a real browser session (see above)
- **Dots & Dragons Mahjong** (Mobile, AL) — quarterly charity tournaments
- **Mustang Mahjong Society** (Mustang, OK)
- **Crescent & Tile Mahjong Co** (Slidell, LA)
- **Tile Nation Tournaments** (Lafayette Hill, PA)
- **Maj & Mingle / Racks & Rose** (Roswell, GA) — recurring class series
- **MahJ Squad 901** (Memphis, TN)
- **Crak Queen Mahjong** (Dallas, TX)
- **Mahjong KC** (Kansas City, MO)
- **Horseshoe Bay Foundation** (Horseshoe Bay, TX)

Aggregators worth re-checking periodically: `bamgoodtime.com/tournaments`,
`mahjongcompare.com/events`, `modernmahjong.com/pages/where-to-play`.

## Caveat on the aggregator data

`bamgoodtime.com/tournaments` returned roughly twenty separate events all dated
22 February 2027, across unrelated cities and organisers. That pattern is almost
certainly the page's "date TBA" rows being misread rather than twenty real
same-day events. Nothing from that cluster was used. Treat any bulk extraction
from that page with suspicion.
