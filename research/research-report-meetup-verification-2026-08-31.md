# Research Report — Meetup verification pass

**Date:** 2026-08-31
**Sources checked:** 57 Meetup group pages (every one referenced by a live listing)
**Listings deactivated:** 13
**Listings flagged for review:** 37

## Why Meetup

After two directory passes returned ~60% overlap with data already held (NY 17/29,
TX 19/31), mining aggregator directories was clearly hitting diminishing returns.
Meetup was the largest untapped source — 57 distinct group URLs across live
listings — and unlike most organiser sites it renders real content to a fetch.

It turned out to be worth far more as a *verification* source than a discovery one.

## Finding 1 — 26 of 57 Meetup groups no longer exist (46%)

Every one returns a page reading *"Sorry, the group you're looking for doesn't
exist."* Meetup serves that with **HTTP 200**, which is why a plain status check
never caught it — my own source-verification pass classified these as
`no_mention`, correctly flagging them for review without knowing why.

50 live listings point at those dead groups. **Every single one has Meetup as its
only contact route** — no email, no phone, no other website. So clearing the URL
is not the fix: it would leave a listing with nothing to click at all.

A dead Meetup group frequently means the organiser stopped paying Meetup's fees,
not that the game ended. These need a person, and are listed with document ids in
`audit/dead-meetup-review.json`.

## Finding 2 — 13 listings are a Go club, not mahjong

Chasing where one dead group went turned up something worse.

**Gotham Go Group** (8 listings across Brooklyn, Manhattan, Long Island City and
Jersey City) moved to `meetup.com/mostlygo`, which is alive and describes itself
as *"A casual meeting of Go players throughout NYC! Players of any experience
welcome, beginners highly encouraged!"* Its September events are all Go — and
they are at exactly the venues in our listings: pinkFROG Café, the Hungarian
Pastry Shop, Whole Foods Jersey City, Barnes & Noble Union Square.

Go is not mahjong. These were miscategorised at import, almost certainly because
the venue-and-schedule pattern looked right.

**Houston Go Club — "Mahjong Practice"** is the same error. The club plays
Go/baduk/weiqi; the mahjong workshops in Houston are run separately by the
Chinese Community Center.

That is a subscriber travelling to a café expecting a mahjong game and finding a
Go club. Deactivated — not deleted, so it is reversible if any of them turns out
to run mahjong too.

Checked for the same pattern across the whole dataset: no chess, bridge or
backgammon clubs are miscategorised. The 14 listings whose names mention canasta
are genuine — JCCs that run mahjong and canasta in the same session.

## Now caught automatically

The weekly monitor gained a `meetup_group_gone` check. Meetup's 200-with-a-
friendly-page behaviour defeats status-code monitoring, so it now matches the
"Group not found" text directly. The next organiser to leave Meetup shows up in
the Monday run rather than in four months.

## Nothing added

No new listings this pass. The 31 surviving groups showed no upcoming dated
events extractable from their group pages, and I will not add an event I could
not read on the page.
