# Research Report — Meetup events pass

**Date:** 2026-08-31
**Listings added:** 13
**URL corrections:** 6
**Source:** the `/events/` page of all 31 live Meetup groups referenced by listings

## Method

The earlier pass established that 26 of 57 Meetup groups are dead. This one works
the 31 that survived. Meetup group landing pages show almost nothing, but
`<group>/events/` embeds the full event objects — title, dateTime, endTime,
status, and a venue reference resolving to name, street address, city and state.
Parsing those gives verified structured data rather than prose.

**216 upcoming events** across the 31 groups. **172 of them mention mahjong in
the title.**

The 44 discarded matter as much as the 172 kept. Several groups are general
social clubs that run mahjong among many other things — the Fort Lauderdale
group's upcoming calendar includes Top Golf, Hunters Nightclubs, Lion Country
Safari and the Stonewall National Museum. Taking every event from a group that
sometimes plays mahjong would have put a nightclub night in a mahjong directory.

## Added — 13

Filtered to venues with a real name and street address that the directory does
not already carry. Schedules are derived from the actual dates of the upcoming
events, not from prose.

| City | Venue | Day | Time |
|---|---|---|---|
| Colorado Springs, CO | Library 21c | Monday | 9:15 AM–12:15 PM |
| Colorado Springs, CO | Treehouse Cafe | Thursday | 12:00–3:00 PM |
| Colorado Springs, CO | Library 21c | Saturday | 1:00–4:00 PM |
| Troy, NY | Leslie's | Wednesday | 1:00–4:00 PM |
| Mill Valley, CA | Throckmorton Theatre | Monday | 6:00–9:00 PM |
| Novato, CA | Margaret Todd Senior Center | Tuesday | 9:15–11:30 AM |
| Mill Valley, CA | Mill Valley Recreation | Thursday | 12:00–2:00 PM |
| Corte Madera, CA | Corte Madera Community Center | Thursday | 1:30–4:00 PM |
| Fremont, CA | 39352 Fremont Blvd | Sat/Sun/Mon | 1:00–6:00 PM |
| Nashville, TN | L&L Market | Thursday | 6:00–8:00 PM |
| Nolensville, TN | Mill Creek Brewing | Saturday (biweekly) | 1:00–4:00 PM |
| Larkspur, CA | Marin Country Mart | Sunday | 12:00–3:00 PM |
| Bloomington, MN | IndiGO at BCS Apartments | Sunday | 1:00–6:00 PM |

Colorado Springs, Corte Madera, Larkspur, Nolensville and Bloomington are new
cities for the directory. Game style is taken from the group and title —
riichi for the Fremont and Tennessee sessions, Chinese for the Bloomington
class, American for the rest.

**One flagged:** the Mill Valley Monday session. Meetup's structured venue field
says Throckmorton Theatre, 142 Throckmorton Ave; the event *title* says "Mondays
at Mamahuhu". The two disagree. I used the structured field, since that is the
location Meetup actually maps, and recorded the conflict in the listing's notes
rather than quietly picking one.

## URL corrections — 6

Groups that moved rather than folded, matched by venue and city between a dead
group's listings and a live group's events:

- `american-mah-jongg-south-bay` (dead) → `american-mah-jongg-at-south-bay`
  — the directory holds both URLs; only one works. Covers El Camino College and
  Panera Bread, Torrance.
- `sunday-mah-jongg-burlington` (dead) → `sunday-mahj-and-more`
  — same Wegmans, Burlington MA game.

Worth noting on the Burlington one: the directory has **three** records for that
single game — "Wegmans Burlington" twice pointing at the dead group, and
"Wegmans – Second Floor Cafe" already pointing at the live one. The earlier
dedupe keyed on name+city+state+day+time and the three names differ enough to
survive it. Repointing the URLs is the safe fix; merging the three is a
judgement call left alone.

## Skipped

- **Palo Alto** — a real weekly Tuesday game, but the venue is literally
  "Somewhere in Palo Alto, TBD". No venue, no address.
- **Sacramento** — venue field reads "Midtown, Sacramento, CA", not a place.
- **Portland Pioneer Place** — a one-off relocation of the Encorepreneur Cafe
  session the directory already carries.
- **Carnival Cruise Port Long Beach** — a cruise departure, not a venue.
- **14 venues already covered**, confirmed against all 3,801 live listings.

## Data note

Meetup's own venue records are not clean either: one event places Lake Calhoun,
Minneapolis in "MI" rather than MN. Anything imported from here should keep the
state from the city rather than trusting the field.
