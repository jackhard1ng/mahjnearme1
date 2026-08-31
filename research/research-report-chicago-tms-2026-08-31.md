# Research Report — The Mahjong Society (Chicago)

**Date:** 2026-08-31
**Listings added:** 5
**Source:** https://themahjongsociety.com/event-calendar (loaded and read in full)

## Why this organiser

The Mahjong Society already accounts for 36 listings in the directory, more
than any other organiser, and publishes a static event calendar that can
actually be read — most organiser sites turned out to be JavaScript-only
calendars that render nothing to a fetch.

Their calendar carried 43 events. 23 are dated after today.

## Added — 5

| Event | Date | City | Venue | Cost |
|---|---|---|---|---|
| Mahjong 101 at One Lake Brewing | 2026-09-09 | Oak Park, IL | One Lake Brewing | not shown |
| Open Play at BuckleDown Brewing | 2026-09-14 | Lyons, IL | BuckleDown Brewing | $30 |
| The Lucky Tile Classic | 2026-09-27 | Chicago, IL | Hotel 55 | $125 |
| Mahjong 101 at Miru Restaurant | 2026-09-28 | Chicago, IL | Miru Restaurant | $90 |
| Mahjong 101 at Sushi-San Lincoln Park | 2026-12-15 | Chicago, IL | Sushi-San Lincoln Park | $100 |

Oak Park and Lyons are both new cities for the directory.

Venue street addresses are not published on the calendar, so `address` is
empty rather than guessed. The venue names are specific enough to find.

## Deliberately NOT added — 18

This is the important half. Most of the upcoming calendar maps onto recurring
listings the directory already carries, at Dovetail Brewery, Midwest Coast
Brewing, BottlesUp!, Koval Distillery, Half Acre, Three Cities Social, Shore
Club and Burning Bush. Adding a dated copy of each occurrence would put two
entries for the same game on the same city page.

That is worth stating plainly, because the raw count looks better if you add
all 23: it would have read "23 events added" instead of 5. It would also have
seeded ~18 near-duplicates into a directory that has just had 69 duplicates
merged out of it.

The recurring listings for those venues now show a real next date anyway,
following the schedule recovery, so the occurrences are already surfaced.

Also skipped:
- **Fall Lucky League** (2026-09-10) — the directory already carries
  "The Mahjong Society — The Lucky League 2026" as a recurring listing.
- **Mahjong 101 at ERIS Brewery** (2026-08-31) — real, but it starts at
  6:30 PM today, so it would expire before or immediately after import.

## Could not verify

Several organiser sites render their calendar in JavaScript and return no
event content to a fetch. Nothing from these was added:

- **centralfloridamahjong.com** (rebranded from bpmahjong.com) — calendar is
  an interactive widget. Did confirm their Instagram is **@cflmahjong** and
  contact **info@centralfloridamahjong.com**, which is worth correcting on
  their listing.
- **missymahjong.com** (rebranded from chicitymahjong.com) — events live
  behind a sub-page that returns no listings. Instagram **@missymahjong**,
  contact **missymahjong@gmail.com**.
- **troopmahjong.com** — now 301s to stylinbrunette.com, which IS the same
  organiser (carries Troop Mahjong's San Antonio and Boerne leagues plus Camp
  Troop Mahjong). Their league pages show prices ($285) but no dates.

## Leads for next time

- **Troop Mahjong San Antonio Fall League** ($285) and **Boerne Summer
  League** — real and current, but no dates published. Worth an email.
- Instagram is where the current schedules actually are, and it cannot be
  fetched from a server. See `audit/instagram-watchlist.json` for the 292
  handles ranked by how many live listings depend on them.
