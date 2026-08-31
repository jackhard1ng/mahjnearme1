# Meetup discovery, round 4 — 20 metros

2026-08-31. Brooklyn, Rochester, Jersey City, Princeton, New Haven, Cambridge,
Worcester, Rockville, Arlington, Wilmington, Allentown, Cincinnati, Dayton,
Naperville, Grand Rapids, Wichita, New Orleans, Memphis, Knoxville, Boise.

    cities searched            : 20/20
    new groups examined        : 144
    groups with mahjong events : 10
    venue candidates           : 4
    city-level candidates      : 5

**8 listings**, plus 8 corrections to records the directory already has. The
corrections are the more valuable half of this round.

## Burlington, finally

Burlington has been unresolved since the start of this work — four directory
records, two Meetup groups, one Wegmans, and no way to tell what was real.
This round settles it.

There is **one** session: "Sunday Mah Jongg in Burlington", at Wegmans,
53 3rd Ave, Burlington **Massachusetts**, every Sunday 10:00–12:00, 17 dates
posted through 27 December.

- `meetup.com/sunday-mah-jongg-burlington`, cited by two directory records,
  returns **"Group not found"**.
- `meetup.com/american-mah-jongg-sun-wed` and `meetup.com/sunday-mahj-and-more`
  serve **the same 27 event ids** — one group under two slugs, not two groups.

And two of the four records are filed in Burlington, **Vermont**, with Vermont
coordinates (44.476, −73.213), while pointing at a group whose every event is
in Massachusetts. Wegmans publishes 115 stores across NY, PA, VA, MD, NJ, NC,
MA, CT, DE and DC — **none in Vermont**, and exactly one Burlington:
`wegmans.com/stores/burlington-ma`. Those two records put a Massachusetts
session on the map 200 miles away, in a state that has only eight listings
in total.

One record keeps the session and gains its schedule and the live group URL;
the other three are deactivated. Details in `audit/burlington-and-dengeos.json`.

## Dengeos, twice each

`northshore-mahjongg` — the URL on all four Dengeos records — returns "Group
not found". The live `northshore-mahjongg-meetup-group` gives the schedules
those records never had: Buffalo Grove Mondays 18:00–21:00 and Glenview
Thursdays 13:30–16:30, both "Every week" per Meetup's own series record. All
four records had an empty `dayOfWeek`, so all four rendered "Schedule TBD".

They are also duplicated: `buffalogrove-northshore-dengeos-1` and
`northshore-mahjongg-at-dengeos-buffalo-g-…` are byte-identical apart from the
id, as are the two Glenview records. Since the detail-page slug is built from
the name, each pair currently generates the same URL.

This supersedes `audit/meetup-moved-groups-2.json`, which only fixed the URL;
that file is removed.

## The dedupe that let them through

All three venues came back as brand-new candidates. Meetup writes them
"Dengeos - Buffalo Grove", "Dengeos Glenview" and "Wegmans"; the directory
writes "Dengeos", "Dengeos" and "Wegmans Burlington". Exact venue matching saw
six different places.

Within the same city, one name containing the other now counts as the same
place. Re-running the round confirms it: the three are reported as "venue
already in the directory" instead of as finds. The city still has to match
exactly, which is what stops this merging every Panera in the country.

## An address I got wrong

I wrote Element Eatery's address as "3729 Spring Grove Ave". Its Meetup venue
record says **5350 Medpace Way**. That was written from memory rather than
copied from the source, and nothing about it looks wrong on the page — which
is exactly what makes it worse than a missing address.

`validate-research-listings.ts` now cross-checks every listing address against
the address the discovery run recorded for that venue, comparing normalised
forms so the deliberate trims still pass: dropping a baked-in locality
("12911 Pacific Point Pl, San Diego, CA 92130" → the street alone), trailing
punctuation ("6327 Clayton Ave."), and case ("suite a"). Re-introducing the
wrong Cincinnati address makes it fail; the six intentional normalisations
across earlier batches do not.

## A time that could not be true

Star Branch Library produced two candidates for one session: Monday 22:15–00:15
and Monday 10:15–12:15, same title, same venue. A library running mahjong to
a quarter past midnight is not credible, and the event description settles it:
*"Mondays at 10:15 am - 12:15 pm For ages 18+"*. The evening record is the
organiser's AM/PM slip. One listing, at 10:15 AM.

## One listing that is deliberately not open play

Kennett Square is typed `private`, because the organiser writes: *"We'll play
at my house … I'll send my address privately. I must have met you at a
previous event to attend this event."* Listing that as open play would send
people to something they cannot join.

Its three dates are two Wednesdays and a Thursday with no Meetup series, so it
is recorded as Wednesday with the Thursday noted as a one-off. Recording
"wednesday|thursday" would claim it meets twice a week.

## What the descriptions settled

- **Element Eatery, Cincinnati** — *"Discover the exciting world of Japanese
  Mahjong … a unique twist on the original Chinese rules"*, hosted by Queen
  City Riichi. **riichi**, not the american default, and the website points at
  qcriichi.com rather than the general-interest Meetup group that hosts it.
- **St Charles Public Library** — provides *"tiles and league cards"*. The
  league card is the National Mah Jongg League card, so: american.
- **Woodbridge VA** — *"Welcome to the American Mahjongg NoVa Group!"*, and
  explicitly beginner-friendly: *"if you have no idea what a crak or bam is"*.

## Files

    research/mahjong-listings-meetup-discovery-r4-2026-08-31.json   8 listings
    research/meetup-discovery-2026-08-31-r4.json                    raw run output
    audit/burlington-and-dengeos.json                               8 corrections

The run record was regenerated with the round-4 listings held aside. Left in
place they dedupe against themselves, and the run correctly reports finding
nothing — accurate, but useless as a record of what the round found.
