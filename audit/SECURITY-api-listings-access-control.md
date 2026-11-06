# /api/listings returns paywalled fields without authentication

Status: **documented, not fixed in this PR.** A redaction primitive is included
and deliberately not wired in. See "Why this PR does not fix it".

Assessed 2026-11-06 against production. No contact details, addresses or
personal data are reproduced in this document; counts and field names only.

## The finding

`GET /api/listings` has no authentication, no authorization and no
subscription check. It returns every field of every listing to any caller.

The paywall is applied **in the browser**. `src/components/GameCard.tsx` reads
`hasAccess` from `AuthContext` and derives `canSeeContactInfo` from it, and
`src/app/games/[...slug]/page.tsx` does the same with `canSeeDetails`. The
server sends the complete record and relies on the client not to render the
restricted parts.

So the subscription gate is a rendering decision, not an access-control
decision. Anyone who requests the endpoint directly, or opens the network tab,
receives the same payload a paying subscriber does.

## Scope, measured

A single unauthenticated request to `GET /api/listings` returned:

| | Count |
|---|---|
| Listing records | 3,801 |
| Carrying a venue name | 3,544 |
| Carrying a street address | 2,536 |
| Carrying a contact name | 953 |
| Carrying a contact phone number | 793 |
| Carrying a contact email | 553 |
| Response size | ~5.7 MB |

`?status=all` returns the same payload, including records whose status is not
active.

The restricted fields are: `venueName`, `address`, `contactName`,
`contactEmail`, `contactPhone`, `website`, `instagram`, `facebookGroup`,
`registrationLink`, `howToJoin`.

Two things make this more than a billing leak. The contact details belong to
third-party organizers, who supplied them to be listed, not published in bulk.
And the whole dataset is retrievable in one request, so it is a bulk export,
not an incidental per-record disclosure.

## Related surfaces, checked

| Route | Auth | Verdict |
|---|---|---|
| `GET /api/listings` | none | **the finding above** |
| `GET /api/organizers?all=true` | none → **admin, this PR** | spread every stored field of 1,779 organizer documents, including internal ones. Fixed here. |
| `GET /api/organizers/overrides` | none, by design | explicit field projection, no internal fields. Carries organizer contact details and locations, so it shares the paywall question but not the internal-field leak. |
| `GET /api/organizers/instructors` | none, by design | explicit projection; `userId` reduced to a boolean `hasUser`. Contact details here are the point of a public instructor directory. |
| `GET /api/digest` | `CRON_SECRET` | guarded. |
| `/listings.json`, `/verification-audit-*.json` | none | static files. **Removed in this PR.** |

So after this PR, the remaining unauthenticated paths to the restricted fields
are `/api/listings` and `/api/organizers/overrides`.

## Why this PR does not fix it

Deciding what a visitor without a subscription may see is a product decision.
The published copy currently promises free users can

> search the full directory, see the map with all game pins, and view complete
> details for the top result in each search

and that a locked listing still shows "game type, day, distance, and skill
level". A redaction chosen here could contradict that and break the advertised
free tier.

Verifying a fix also needs both sides of the gate exercised: a real subscriber
session and an anonymous one, against the map, search ranking, the city pages,
the events pages and the organizer dashboard, all of which read this endpoint.
There are no credentials in the environment this was assessed from.

Shipping a guessed redaction inside a security PR would be the riskier move. It
would be a behavioural change to the main read path of the site, arriving
alongside the file removals, with the two unable to be rolled back
independently.

## What is included instead

`src/lib/listing-redaction.ts`, tested and unused:

- `PAYWALLED_FIELDS` — the field list above, chosen to match the published
  free-tier promise, so `type`, `dayOfWeek`, `geopoint` and `skillLevels`
  survive and search, filtering and the map keep working.
- `redactListing(listing)` — blanks those fields and sets `locked: true`. Keys
  are kept rather than deleted so the response shape is unchanged and a client
  cannot infer a value's existence from key presence.
- `redactListings(list, revealCount)` — redacts all but a leading prefix, so
  the "complete details for the top result" promise can be honoured.

Wiring it in is then roughly: resolve the caller's subscription in the route,
and pass the list through `redactListings` when they do not have access.

## Recommended fix, when it is scheduled

1. Confirm the intended free tier against the pricing and FAQ copy. If the copy
   is wrong, change the copy in the same PR.
2. Resolve the caller server-side. `requireUser` already verifies a Firebase ID
   token; the subscription state is on the user document
   (`subscriptionStatus`, `accountType`), which is how `/api/giveaway` already
   decides eligibility.
3. Redact in the route, not the client.
4. Keep `?count=1` and any aggregate unauthenticated: a count discloses
   nothing.
5. Decide `?status=all` separately. It is an admin view and should require
   admin regardless of the redaction decision.
6. Test anonymous, free-logged-in, subscriber and admin against the map,
   search, city pages, events and the organizer dashboard.

## Caveat on expectations

Removing the static files and closing the organizer endpoint reduces the
exposure; it does not end it. Until `/api/listings` is gated, the dataset is
still retrievable without paying. Anyone reading the PR that removes the files
should not conclude the paywall is enforced.
