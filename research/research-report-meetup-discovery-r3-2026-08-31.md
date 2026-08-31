# Meetup discovery, round 3 — 20 metros

2026-08-31. Third pass: Sacramento, San Jose, Tampa, Jacksonville, Naples,
San Antonio, Fort Worth, Tucson, Scottsdale, Reno, Raleigh, Charleston,
Richmond, Virginia Beach, Hartford, Newark, Buffalo, Pittsburgh, Oklahoma
City, Little Rock.

    cities searched            : 20/20
    new groups examined        : 169
    groups with mahjong events : 16
    venue candidates           : 7
    city-level candidates      : 11

**17 listings.** One candidate was rejected outright and one duplicate was
caught by a fix made during this round.

Arkansas gains its first riichi listing; Charleston gains a riichi club with
two venues.

## Four fixes the round-3 candidates forced

**A private home was about to be published.** The Naples group Bams Cracks &
Dots runs weekly mahjong, and Meetup gives its venue as `"My home"` at a named
street address with an apartment number. Meetup shows that only to people who
have joined the group. Republishing a host's home address on a public
directory is not something they agreed to, and the venue filter had no opinion
about it — the candidate came through with the address attached. The script
now recognises venue names meaning "a private residence", drops the address,
and reports the group city-level instead. The group is still listed; the
address is not.

**Round 3 rediscovered a round 2 find.** Grapevine Masonic Lodge, Sunday 1pm,
group `mahjong-classes` — identical to a listing round 2 had written hours
earlier. Dedupe only ran against the live site, and these batches are review
files that Firestore has never seen. The script now folds every earlier
`research/mahjong-listings-*.json` into the known-venue and known-group sets,
so batches no longer collide. This is what makes running the pipeline
repeatedly actually work.

**A stated schedule beat an inferred one.** The Fun Bunch's American Mah Jongg
has three upcoming dates: two Tuesdays and a Monday. Read from dates alone the
candidate said `tuesday|monday`. Meetup's series record says "Every 3rd Tuesday
of the month until December 15, 2026" — and the third Tuesday of November is
the 17th, so the 23rd is a one-off move, not a pattern. Where Meetup names one
weekday and the dates suggest more, the stated day now wins and the extras are
recorded as one-off moves.

**A cruise was excluded.** `northtexastravelandevents` posted "Mahjong Cruise
on MSC from Galveston", 7:00 AM to 9:00 PM, under the group's home city of
Denton. It is not a session anyone can attend in Denton and it has no fixed
venue, so listing it under either city would be wrong. It is recorded in the
batch file's `excluded` block with the reason.

## Where the titles were wrong and the dates were right

The Ultimate Girlfriends Group in San Antonio has ten upcoming sessions. One
is titled "Mahjong Night!!!  Wednesday" and falls on **Monday** 31 August —
every one of the ten is a Monday at 7pm. The day in this listing comes from
the dates, not the titles, which is the only reason it is right.

## What the descriptions changed

- **Gamelandia, Palo Alto.** *"We don't accept RSVPs on MeetUp because all
  reservations must be done through our own website."* The registration link
  points at gamelandia.fun, not Meetup — sending someone to RSVP on Meetup
  would not get them a seat.
- **Mahjong Café Naples.** $30, pre-purchased, and *"intended for players who
  already know the basics"* — so `skillLevels` is intermediate/advanced, not
  beginner. The same organiser has run events at Marco Island Brewery, but
  none are currently scheduled, so no listing was created for that venue.
- **Cary Mah Jongg.** Alternates "Play only" (no teaching) with "Learn and
  play"; the organiser lends American Mah Jongg cards and the group has its
  own. One session in two modes, so one listing.
- **Sixty Plus and Smiling, Pittsburgh.** Suzie Hauptman, a mahjong instructor
  of thirty years, runs "assisted play" classes at $20 — typed as a lesson,
  not open play.
- **Charleston Riichi.** *"Our club plays Riichi, a variant from Japan"* —
  style stated outright, for both its venues.

## One thing to confirm

Final Round Game Shop, Summerville. Meetup's structured venue record says
**4552** Ladson Rd; the event description text says **4530** Ladson Rd,
Summerville, SC 29485. The listing uses the structured value and flags the
discrepancy in its notes. Worth a phone call before anyone drives there.

## Ten listings with no street address

Ten of the seventeen have no address because the organiser publishes none:
the events carry `"venue": null` with `eventType: "PHYSICAL"`, and the address
goes out to members after they RSVP. Each says so in its notes and in its
`howToJoin`, and each has `dropInFriendly: false` — you cannot turn up at
these without RSVPing, so a missing address costs nothing that was ever
available.

Five listings state no game style anywhere and are recorded as `american` on
the base rate, each saying so in its notes. There is no "unknown" in the
schema, and `other` would be a positive claim that it is not American.

## Validation

`scripts/validate-research-listings.ts` now checks every batch at once —
71 listings across six files. It catches what a single batch cannot: an id
reused between batches, the same venue/day/time written up twice by two runs,
a one-off carrying a frequency, a recurring listing with no day, a locality
baked into a street address.

It found two real defects on its first run. `san-diego-pacific-highlands-
ranch-library-1` had its address stored as "12911 Pacific Point Pl, San Diego,
CA 92130", which puts the city, state and ZIP inside the `streetAddress` of
the emitted PostalAddress, next to the `addressLocality` and `addressRegion`
that already carry them; it is now the street alone. And four one-off events
across rounds 2 and 3 carried `frequency: "weekly"`, asserting a cadence they
do not have — those are now empty, matching how the earlier Chicago batch
already wrote them.

Its locality check anchors on a comma, because the first version flagged
"1199 Wilmette Ave" in Wilmette and "39352 Fremont Blvd" in Fremont — streets
named after their town, not addresses with the town appended.

## Files

    research/mahjong-listings-meetup-discovery-r3-2026-08-31.json   17 listings
    research/meetup-discovery-2026-08-31-r3.json                    raw run output

Nothing is applied. Run `npx tsx scripts/validate-research-listings.ts`
before importing any of it.
