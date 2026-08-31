# Meetup discovery, rounds 8–10 — 60 cities

2026-08-31. Three more sweeps: affluent suburbs (Great Neck, Scarsdale,
Greenwich, Newton, Potomac, McLean, Highland Park, Bloomfield Hills…), western
and sunbelt cities (Encino, Palm Desert, La Jolla, Sun City, Bend, Park City,
Overland Park…), and Florida/Southeast retirement and coastal towns (The
Villages, Hilton Head, Naples, Myrtle Beach, Vero Beach…).

    round  groups examined  with mahjong  venue  city-level
    r8                 137             8      0          8
    r9                 152             7      0         10
    r10                143             0      0          0

**10 listings.**

## Round 10 found nothing, and that is a result

Twenty Florida and Southeast towns — including the ones you would bet on, The
Villages and Hilton Head and Naples — returned 143 groups and not one new
mahjong group. Every mahjong group they surfaced was already known: in the
live directory, or written up in an earlier round this same day.

That is the cross-batch dedupe working rather than an absence of mahjong.
Naples was swept in round 3 and Cary in round 7. It does mean the sunbelt
retirement belt is now covered.

## Zero venue candidates across 60 cities

Rounds 8 and 9 found fifteen groups genuinely playing mahjong and **not one
published a venue**. Every listing from them is city-level.

That is the strongest signal so far about what kind of mahjong lives on
Meetup in wealthy suburbs: private social clubs — West Chester Girlfriends,
Sassy Ladies Up To Something, Atlanta Socializing Women 60+, Sisterhood
International Society, Ladies and Friends of Bend — that meet in members'
homes or in a room they do not advertise, and hand the address out on RSVP.
Those are real weekly games with real people; they are simply never going to
yield a street address.

## A regression my own round-5 fix caused

King of Prussia came back as **five** candidates from one group, all Monday at
6pm, titled "Mah Jongg- August", "Mah Jongg", "Mah Jongg- October",
"Mah Jongg- November", "Mah Jongg- December".

Round 5 added a title stem to the candidate key, so two sessions at the same
hour would not merge. It had no notion that a title can name the *instance*
rather than the series, so a month in the title split one weekly night into
five listings.

The stem now strips a month name and anything after it, plus a year and
instance notes like "Time changed to". Seven cases were checked against the
new rule — the four that must merge (month in title, instance note, rotating
host, one session in two modes) and three that must stay apart. King of
Prussia is now one listing with 16 dates.

## Venue and price hiding in a title, again

Cherry Hill's workshop is titled "Mahjong Workshop **at Game Friendzy. $12
pay**…" with no venue record. Venue name and cost are taken from the title;
the street address is not invented.

## A withheld address I am not certain about

Bend's Après Mahj gives its venue as **"Ponch's Place", 62889 SE Oxford Ct** —
a residential court address. The private-residence filter widened in round 7
treats `<Name>'s Place` as a home, so the address is withheld.

It may be a business. The trade is asymmetric: if it is, the cost is one
missing address on one listing; if it is someone's house, publishing it is
not something they agreed to. The listing says so plainly.

## One Chinese-style find

Palm Springs Sunshine Sisters run **Saturday Chinese MahJongg** — stated in
the title, and Chinese style accounts for only 116 of 2,744 listings. The same
group runs four more mahjong sessions on other days, each a single posted date
with no series; those are in the batch's `excluded` block rather than listed,
because one date with no series is not a schedule anyone can plan around. It
is worth re-checking: an unusually mahjong-active club, and a Chinese-style
one.

## Files

    research/mahjong-listings-meetup-discovery-r8-r10-2026-08-31.json  10 listings
    research/meetup-discovery-2026-08-31-r8.json                       raw run output
    research/meetup-discovery-2026-08-31-r9.json
    research/meetup-discovery-2026-08-31-r10.json

119 listings across eleven batches, all passing
`scripts/validate-research-listings.ts`.
