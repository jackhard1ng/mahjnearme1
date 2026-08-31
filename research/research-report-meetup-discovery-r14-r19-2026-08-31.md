# Meetup discovery, rounds 14–19 — 120 cities

2026-08-31. California secondary cities; Texas and Southeast secondary cities;
the Mountain West plus Alaska and Hawaii; and the major-metro suburb rings
around New York, Chicago and the mid-Atlantic.

    round  region                         venue  city-level  listings
    r14    California secondary               1           1
    r15    TX / Southeast secondary           1           3
    r16    Mountain West, AK, HI              4           1
    r17    NY / mid-Atlantic suburb ring      0           0         0
    r18    Chicago / Midwest suburb ring      0           0         0
    r19    Bay Area / NW / SW suburb ring     3           3

**11 listings.**

## Rounds 17 and 18 found nothing, and that is the clearest signal yet

Forty cities — Forest Hills, Flushing, Staten Island, Yonkers, Hoboken,
Stamford, Silver Spring, Fairfax, Chicago, Oak Park, Skokie, Schaumburg,
Edina, Carmel, Leawood — returned zero new mahjong groups between them.

Not zero groups: every mahjong group they surfaced was already known, from the
live directory or from one of the eighteen rounds run before them. These are
the suburb rings of metros swept in rounds 1, 2, 4 and 7. **The metros are
done.** Nineteen rounds have now covered roughly 380 cities.

## Portland is the find of these rounds

Three venue-backed sessions in one city, all new:

- **Capes and Crepes Board Game Cafe**, 4990 SE Division — Mondays, weekly,
  drop-in. *"$10 and includes a beverage or $20 to learn how to play. Several
  sets are provided."*
- **Eastmoreland Golf Course Bar & Grill**, 2425 SE Bybee — Wednesdays,
  guided open play.
- **Cedar Mill Library**, 1080 NW Saltzman — first Fridays, **Chinese style**.

Plus Cantonese Social PDX, monthly Sundays, city-level. Oregon had 21 listings
before this round.

Cedar Mill's stored address is `1080 NW Saltzman, Upstairs> Elm Room (elevator
or stairs)`. The street part is the address; the room went into `generalArea`
and the description, because directions inside a building are not a street
address.

## Alaska

**The Side Quest**, 1300 E 68th Ave #102, Anchorage — a learn-to-play evening.
Alaska had two listings in the entire directory, joint-lowest of any state.

Meetup stored the address with the city, state and ZIP baked in; trimmed to
the street so the emitted PostalAddress does not repeat what
`addressLocality` and `addressRegion` already carry.

## An expired series that would have halved a listing

Cameron Park to Placerville Girlfriends post American Mahjong at 10am,
alternating **Mondays and Tuesdays**, seven sessions into September. Meetup's
series record says *"Every week on Monday until August 31, 2026"* — which ran
out the day this was read.

Round 5 added a rule that a stated series weekday beats one inferred from
dates, because an organiser's one-off move should not turn a Tuesday session
into "tuesday|monday". That rule had no notion that a series can expire, so it
narrowed this listing to Monday and dropped every Tuesday on the authority of
a record that had run out.

The rule now ignores a series whose end date has passed. The comparison is on
`YYYY-MM-DD` strings rather than `Date` objects: parsing "August 31, 2026" and
"2026-08-31" as dates puts one at local midnight and the other at UTC
midnight, which differ by the offset — and this series expired *today*, which
is exactly where that half-day gap decides the answer.

## Three listings that are honest about not having a schedule

- **Palm Coast** runs "Mahjongg Instructions- Group 1 / 2 / 3" on three
  different days at two different times. Those are separate learner cohorts,
  not one repeating class. One monthly lesson listing on the commonest slot,
  with the description saying plainly that cohorts vary — rather than three
  listings for three intakes, or one day the class does not reliably keep.
- **Space Coast Women 50+** run second Wednesdays per Meetup, and third
  Wednesdays besides. The description says second and often third rather than
  picking one.
- **Cantonese Social PDX** is recorded `chinese` on the group's own name, and
  the note says the event title itself says only "Mahjong Open Play".

## Files

    research/mahjong-listings-meetup-discovery-r14-r19-2026-08-31.json  11 listings
    research/meetup-discovery-2026-08-31-r14.json … -r19.json           raw run output

134 listings across thirteen batches, all passing
`scripts/validate-research-listings.ts`.
