# Meetup discovery, rounds 20–21 — 40 affluent suburbs and resort towns

2026-08-31. Jupiter, Winter Park, Longboat Key, Punta Gorda, Mount Pleasant,
Huntersville, Matthews, Roswell, Brentwood, Flower Mound, Cedar Park,
Fountain Hills, Coronado, Laguna Niguel, Mercer Island, Northbrook, Westfield;
then Bethesda, Vienna, Wellesley, Lexington, Chappaqua, Summit, Lake Forest,
Wayzata, Ladue, Cherry Hills Village, Draper, Sammamish, Piedmont, Manhattan
Beach.

**2 listings**, both in Charlotte.

Round 21 — twenty of the wealthiest suburbs in the country — returned three
mahjong groups and no candidates. All three were already known. That is the
fourth consecutive sweep where the suburb tier comes back empty.

## A rotating venue, mistaken for nine sessions

Charlotte's 50 Shades of Menopause run **one** weekly Thursday lunchtime game
that moves around the city, titling each week's event after that week's spot:

    MahJongg THE CLUBHOUSE          MahJongg LOCAL DRAFT
    MahJongg AMELIE'S               MahJongg CROSSRIDGE CAFE
    MahJongg HAWTHORNES             MahJongg THE CRAIC
    MahJongg RUSTY ONION            MahJongg McALISTERS BLAKENEY

Every one is Thursday 12:00–15:00, and Meetup records "Every week on
Thursday". Keyed on a three-word title stem they came through as **nine
candidates**.

This is the third variant of the same mistake, and the fix is narrower than
the last two. Round 5 added a title stem so two sessions at the same hour would
not merge. Rounds 8–10 taught it that a month in a title labels an instance.
Now: a title that *opens* with the game name is labelling the instance in
everything after it, so the stem collapses to that leading word.

That only applies when the game word comes first, which is what keeps the
distinctions that matter:

    Advanced American Mah Jongg   vs  Beginners American Mah Jongg   → apart
    Saturday Chinese MahJongg     vs  Learn American MahJongg        → apart
    Sunday Morning Riichi         vs  Wednesday Evening Riichi       → apart
    MahJongg THE CLUBHOUSE        +   MahJongg AMELIE'S              → merged

And the start time stays in the key, so two genuinely different sessions that
both open with the game name still only merge if they also share an hour.
Twelve accumulated cases from rounds 1–21 were checked against the rule: six
that must merge, six that must stay apart. All twelve correct.

The listing records no venue, because there is not one — the venues from the
titles are in the description, and `howToJoin` says to check the calendar
before setting off.

## Files

    research/mahjong-listings-meetup-discovery-r20-r21-2026-08-31.json  2 listings
    research/meetup-discovery-2026-08-31-r20.json                       raw run output
    research/meetup-discovery-2026-08-31-r21.json

136 listings across fourteen batches, all passing
`scripts/validate-research-listings.ts`.
