# Meetup discovery, round 6 — 20 smaller markets, and where this channel runs out

2026-08-31. Albany, Syracuse, Toms River, Harrisburg, Scranton, Annapolis,
Charlottesville, Charleston WV, Lexington, Fort Wayne, Lansing, Green Bay,
Rochester MN, Cedar Rapids, Springfield MO, Fayetteville AR, Jackson,
Huntsville, Santa Fe, Bozeman.

    cities searched            : 20/20
    new groups examined        : 143
    groups with mahjong events : 1
    venue candidates           : 1

**One listing.** That result is the point of this round.

## The one find

Central PA Game Club runs **Riichi Mahjong** every Monday, 6:30–9:30pm, in the
community room at the Giant supermarket on Linglestown Road in Harrisburg.
Everything in the listing is quoted from the organiser: *"The RIICHI Mahjong
group meets on Mondays at 6:30 pm at: Giant Supermarket 2300 Linglestown Rd.
Harrisburg, PA 17110. Light refreshments. Beginners welcome. This is real Mah
with tiles."* Meetup records the series as "Every week on Monday".

Only the second riichi listing in Pennsylvania. Meetup's venue name is the
bare shout "GIANT"; the description's "Giant Supermarket" is used instead.

## Six rounds, side by side

    round  cities  groups seen  examined  venue  city-level  listings
    r1         20          171       122     22           —        19
    r2         20          174       145      2           5         7
    r3         20          180       153      7          11        17
    r4         20          182       134      4           5         8
    r5         20          196       160      2          11        14
    r6         20          178       142      1           0         1

    120 cities, 937 groups examined, 66 listings

(r1 predates the city-level tier, so its zero there is not a result.)

The number of groups Meetup returns per city barely moves — 171 to 196 across
every round. What collapses in round 6 is how many of them actually play
mahjong: **1 in 142**, against 10 to 36 in every other round.

## What that means, and what it does not

It is not that Meetup is exhausted. It is that **yield tracks metro size very
steeply**, and round 6 was deliberately the small-market tier — Bozeman, Cedar
Rapids, Green Bay, Charleston WV. Searching a small city returns just as many
groups; they are simply hiking clubs and book clubs rather than mahjong.

So the recommendation is not "stop using Meetup". It is:

- **Another small-market sweep is not worth running.** A seventh round of
  towns this size should be expected to produce about one listing for 140
  groups checked.
- **Mid-size metros are not exhausted.** Round 5 was mid-size and produced 14.
  Cities not yet swept at that tier include Pittsburgh's neighbours, Columbus
  suburbs, Tampa/St Pete, Austin's ring, Portland ME, Salt Lake's ring,
  Charlotte's ring, and most of NJ and Long Island.
- **The next real gain is a different channel, not more cities.** 1,000 active
  listings still carry no URL of any kind, and 449 of those carry an Instagram
  handle. That is where the unverified inventory actually is.

## Files

    research/mahjong-listings-meetup-discovery-r6-2026-08-31.json   1 listing
    research/meetup-discovery-2026-08-31-r6.json                    raw run output

94 listings across nine batches, all passing
`scripts/validate-research-listings.ts`.
