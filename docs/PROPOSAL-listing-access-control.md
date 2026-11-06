# Proposal: server-side access control for listings

Status: **proposal. Not implemented, not deployed, nothing enabled.**
Stacked on `claude/security-public-data-and-authz` (PR #109), which carries the
redaction primitive this builds on.

Every entitlement below is taken from copy already published on the site, cited
by file and line. Where the published copy and the shipped behaviour disagree,
or where the copy is silent, the question is **flagged as a decision for Jack**
rather than resolved here. There are ten such decisions, listed in section 6.
Four of them block implementation.

Nothing in this proposal changes a subscriber benefit. Several options would,
and those are marked.

---

## 1. The problem

`GET /api/listings` has no authentication and returns every field of every
listing. The paywall is applied in the browser:

- `src/components/GameCard.tsx:177` — `const canSeeContactInfo = hasAccess;`
- `src/app/games/[...slug]/page.tsx:381` — `const canSeeDetails = user && hasAccess;`
- `src/components/LeafletMap.tsx:176` — `const canSeeDetails = hasAccess || ...`

The server sends the complete record and trusts the client not to render the
restricted parts. Anyone who opens the network tab, or requests the endpoint
directly, receives exactly what a paying subscriber receives.

See `audit/SECURITY-api-listings-access-control.md` for the measured scope.

---

## 2. What is published today

### Pricing page, `src/app/pricing/page.tsx:11-18` (free)

```
Search all 2,000+ listings across 50 states          included
See the map with all game pins                       included
View full details on the top result per search       included
See game type, day, distance & skill level
  on all results                                     included
Full details on locked listings (name, venue,
  contact)                                           NOT included
Automatic monthly giveaway entry                     NOT included
```

### Pricing page, `src/app/pricing/page.tsx:20-26` (subscriber)

```
Everything in Free, plus:
Full details on every listing - names, venues, contact info
Addresses and directions for every game
Schedules, descriptions, and how-to-join info
Instagram handles, websites, and registration links
Automatic monthly giveaway entry (annual gets 2x)
```

### Pricing FAQ, `src/app/pricing/page.tsx:31-34`

> You can search the full directory, see the map with all game pins, and view
> complete details for the top result in each search. Other listings show game
> type, day, distance, and skill level, but names and contact info are locked.

### Site FAQ, `src/app/faq/page.tsx:25-26`

> To unlock details on all other listings (names, venues, contact info,
> schedules) you need a subscription.

> Locked listings show the game type, day, distance, and skill level, which is
> enough to know a game exists near you.

### So the published contract is

| Promised free | Promised paid only |
|---|---|
| Search the full directory | Name |
| Every map pin | Venue name |
| Game type | Street address and directions |
| Day of week | Contact name, email, phone |
| Distance | Website, Instagram, Facebook group |
| Skill level | Registration link |
| Full details on **the top result per search** | Description, how-to-join |
| | Schedules beyond the day of week |

---

## 3. What the code actually does

### Search, `src/app/search/page.tsx:470-535`

Three tiers for a non-subscriber, not two:

| Result index | Tier | Rendered |
|---|---|---|
| 0-1 | **full** | everything |
| 2-4 | **teaser** | type, style, drop-in, frequency, skill levels. Name and venue are grey blurred bars, not real values. |
| 5+ | **locked** | type, style, drop-in, schedule, skill, distance. `GameCard.tsx:216`: "Locked cards: type + day + distance + skill only. NO name, venue, or identifying info." |

Neither teaser nor locked puts the real name or venue in the DOM, so the
client-side gate is at least not leaking through the rendered markup. The data
to do so is present in the response, though.

### Map, `src/components/LeafletMap.tsx:161,176`

```js
const isLocked = !hasAccess && !isHomeMetroPin && index >= previewCount;
const canSeeDetails = hasAccess || (isHomeMetroPin && index < previewCount) || index === 0;
```

A **different rule** from search: the map reveals index 0 plus home-metro pins
up to `previewCount`. Locked popups show city, state, type and distance only.
Every pin is plotted regardless, which matches the published promise.

### City pages, `src/app/cities/[state]/[city]/page.tsx`

Render only `city`, `state`, `status`, `type`, `dropInFriendly`,
`skillLevels`. **No name, venue, address or contact.** Statically generated
from the bundled dataset, so they never call the API and are unaffected by any
redaction. Nothing to do here.

### Game detail page, `src/app/games/[...slug]/page.tsx:89-200,405`

`<GameJsonLd game={game} />` is rendered **unconditionally** and emits, into
the server-rendered HTML of every game page:

```json
"location": { "name": "<venueName>",
              "address": { "streetAddress": "<address>", ... },
              "geo": { "latitude": ..., "longitude": ... } },
"performer": { "name": "<contactName>" }
```

This is the most important finding in this document. **Redacting
`/api/listings` would not close the exposure.** The venue, street address and
contact name are in the page source of every detail page, ungated, for search
engines. See decision D5.

### Ranking, `src/app/search/page.tsx:286-310`

Results are sorted **in the browser**, by `haversineDistance` and
`getEventTiming`. `/api/listings` returns the whole collection, unordered and
unpaginated; it has no ranking or `limit` at all.

So "complete details for the top result in each search" cannot be enforced
server-side as written. The server does not know what the top result is. See
decision D1, which blocks implementation.

---

## 4. Proposed field matrix

Four tiers. `paid` means an active subscription, a contributor, or a trial, per
the existing `hasAccess` definition in `src/contexts/AuthContext.tsx:203`.

| Field | anonymous | free | paid | admin |
|---|---|---|---|---|
| `id` | yes | yes | yes | yes |
| `city`, `state` | yes | yes | yes | yes |
| `generalArea` | yes | yes | yes | yes |
| `type`, `gameStyle` | yes | yes | yes | yes |
| `isRecurring`, `recurringSchedule` | yes | yes | yes | yes |
| `eventDate`, `eventEndDate` | yes | yes | yes | yes |
| `skillLevels`, `dropInFriendly`, `setsProvided` | yes | yes | yes | yes |
| `maxPlayers`, `typicalGroupSize` | yes | yes | yes | yes |
| `cost`, `costAmount` | yes | yes | yes | yes |
| `geopoint` | yes | yes | yes | yes |
| `metroRegion` | yes | yes | yes | yes |
| `goingCount`, `beenHereCount`, `headsUpCount` | yes | yes | yes | yes |
| `verified`, `promoted`, `lastVerified` | yes | yes | yes | yes |
| `imageUrl` | yes | yes | yes | yes |
| **`name`** | **no** | **no** | yes | yes |
| **`venueName`** | **no** | **no** | yes | yes |
| **`address`** | **no** | **no** | yes | yes |
| **`contactName`** | **no** | **no** | yes | yes |
| **`contactEmail`** | **no** | **no** | yes | yes |
| **`contactPhone`** | **no** | **no** | yes | yes |
| **`website`** | **no** | **no** | yes | yes |
| **`instagram`** | **no** | **no** | yes | yes |
| **`facebookGroup`** | **no** | **no** | yes | yes |
| **`registrationLink`** | **no** | **no** | yes | yes |
| **`description`** | **no** | **no** | yes | yes |
| **`howToJoin`**, **`whatToBring`** | **no** | **no** | yes | yes |
| `organizerName` | see D6 | see D6 | yes | yes |
| `organizerId`, `claimedBy` | no | no | no | yes |
| `source`, `organizerEdited` | no | no | no | yes |
| `status` | active only | active only | active only | any |
| `createdAt`, `updatedAt` | no | no | yes | yes |

Reasoning for the retained set: it is exactly what the published copy promises
free users, plus the fields the map, search, filtering and the city pages need
in order to keep working. `geopoint` is retained because "see the map with all
game pins" is an advertised free benefit; coordinates approximate an address,
which is an accepted consequence of that promise rather than an oversight.

`name` and `venueName` are withheld because the published copy says so twice
and `GameCard.tsx:216` already implements it. This is the most disruptive part
of the matrix. See decisions D2 and D3.

**`anonymous` and `free` are identical in this matrix.** No published copy
distinguishes them. See decision D4.

---

## 5. Per-surface behaviour

### Search

The free tier promises full details for the top result. Since the server cannot
identify it (section 3), this needs decision D1. The three sub-options are in
that decision; two of them change the free tier and are marked as such.

Whatever is chosen, the server must be the one that decides. A client-supplied
"reveal index 0" parameter is trivially spoofable and would be security
theatre.

### Map

Already compatible. The matrix retains `geopoint`, `city`, `state` and `type`,
which is everything a locked popup renders. Full popups need `name` and
`venueName`, so they follow whatever D1 decides.

### City pages

No change needed. They render none of the restricted fields and are statically
generated from the bundled dataset.

### Game detail page

Blocked on D5. Redacting the API without addressing the JSON-LD leaves the
address in the page source, so the work would not achieve its purpose.

### Fallback responses

Three paths return listings, and all three must redact identically. A redaction
applied to only the happy path is worse than none, because the gap then appears
only during an incident, when nobody is looking:

1. **Firestore success** — `src/app/api/listings/route.ts`, the main path.
2. **Seed failure** — the same route returns `source: "json"` from
   `loadListings()`.
3. **Read error** — the catch block returns `source: "json-fallback"`.

Also:

- **`?count=1`** returns a single integer. No redaction needed, and it should
  stay unauthenticated so the homepage counter keeps working.
- **`?id=<id>`** returns one listing. Must redact on the same rules. This is
  the endpoint a scraper would iterate.
- **`?search=<slug>`** returns one listing. Same.
- **`?status=all`** must require admin regardless of the redaction decision.
  It is an admin view and returns inactive rows.
- **Caching.** A redacted and an unredacted response must never share a cache
  key. Today the route sets `public, s-maxage=60` on the listings body. If the
  response varies by caller, that header becomes a cross-tier cache poisoning
  bug: the first anonymous request would be served to a subscriber, or worse,
  the reverse. Either set `Cache-Control: private` on any tier-dependent
  response, or split the routes so the public one is a distinct, cacheable URL.
  **This is the single easiest way to turn this fix into a worse bug.**

---

## 6. Decisions needed

Four of these block implementation.

### D1. "Top result per search" cannot be enforced server-side — BLOCKING

Published copy promises full details for the top result. Ranking is client-side
and the API is unordered and unpaginated, so the server cannot identify it.

| Option | Consequence |
|---|---|
| (a) Move ranking server-side: the route accepts the search parameters, ranks, and reveals index 0 | Largest change. Duplicates `event-timing` and distance logic server-side, or moves it. Honours the copy exactly. |
| (b) Reveal by explicit request: a separate authenticated-or-not endpoint returns one full listing per call, rate-limited per IP or session | Honours the spirit. Needs a counter, so a new storage concern. |
| (c) Change the free tier to something position-independent, e.g. N full listings per day | **Changes the published benefit.** Needs copy changes in the same release. |
| (d) Reveal nothing to free users | **Removes a published benefit.** Simplest and most defensible technically; a real reduction in the free offer. |

No recommendation. This is a pricing decision.

### D2. The shipped free tier is more generous than the published one — BLOCKING

Published: full details for **1** result. Shipped (`search/page.tsx:487`): full
details for **2**, plus three teaser cards.

Implementing to the published copy silently removes a benefit free users have
today. Implementing to the shipped behaviour contradicts the pricing page.

Which is authoritative? If the shipped behaviour is, the pricing page and both
FAQ answers need updating in the same release.

### D3. Does the teaser tier survive? — BLOCKING

Indexes 2-4 currently get a middle tier (type, style, drop-in, frequency,
skill, with blurred name and venue bars) that appears in no published copy. The
matrix in section 4 has no teaser row, because nothing published describes one.

Keeping it means a third server-side tier. Dropping it reduces what those three
positions show today.

### D4. Is a free account worth anything? — BLOCKING

No published copy distinguishes an anonymous visitor from a signed-in free
user, and section 4 treats them identically. But `search/page.tsx` already
passes `onCalendarToggle={user ? ... : undefined}`, so signing in does unlock
something small today.

If a free account is meant to carry a listing benefit, it needs stating, and
the matrix needs a column change. If not, the signup page should probably stop
implying it does.

### D5. JSON-LD versus the paywall

Every game detail page emits `streetAddress`, `venueName` and `contactName`
into its server-rendered HTML for search engines, ungated. Options:

| Option | Consequence |
|---|---|
| (a) Leave it | The paywall stays bypassable by viewing source. Redacting the API becomes largely cosmetic. |
| (b) Drop `streetAddress` and `performer`, keep name, city, type, dates | Likely weakens local-search rich results. Needs an SEO judgement. |
| (c) Keep full JSON-LD only for listings whose organizer opted into public contact | Most defensible; needs an organizer-facing setting that does not exist. |

Not a decision I should make: it trades search traffic against the paywall, and
search traffic is how the directory grows.

### D6. Is `organizerName` identifying?

It is often a person's or a business's name and frequently matches the listing
name. The published copy does not mention it. The matrix leaves it unresolved.

### D7. Does `description` carry restricted content?

The pricing page lists "descriptions" as a paid benefit and `GameCard` gates
it, so the matrix withholds it. Worth noting that descriptions frequently
contain an address, a URL or a booking link inline, so withholding it is also
necessary to make withholding `address` meaningful.

Note: the redaction primitive shipped in PR #109 does **not** currently include
`description`. If this proposal is accepted, that list needs amending.

### D8. Does withholding `name` break anything load-bearing?

Detail-page URLs are `/games/<city-state>/<slugified-name>`
(`GameCard.tsx:172`). If the server withholds `name`, a free client cannot
construct the link, and the `?search=<slug>` lookup resolves a slug derived
from the name. Either the server supplies a slug alongside the redacted record,
or locked cards stop linking anywhere.

### D9. What does a redacted field look like on the wire?

PR #109's primitive blanks the value and sets `locked: true`, keeping the key
so the shape is stable and key presence leaks nothing. Confirm that is wanted
rather than omitting keys, which would let a caller infer which listings have an
address.

### D10. Rate limiting

Even a correct redaction leaves the full dataset enumerable by a subscriber, or
by anyone once D1 option (a) or (b) reveals one listing at a time. Out of scope
here, worth a separate decision.

---

## 7. Proposed implementation shape

Deliberately small, and only after D1 through D4 are settled.

1. `src/lib/listing-access.ts` — pure, no I/O: a tier type
   (`anonymous | free | paid | admin`), the field matrix as data, and
   `applyAccess(listing, tier)`. Extends PR #109's
   `src/lib/listing-redaction.ts` rather than replacing it.
2. `resolveTier(request)` in the route — verifies the Firebase ID token with
   the existing `requireUser`, reads `subscriptionStatus` and `accountType`
   from the user document, exactly as `/api/giveaway` already does. Anonymous
   when there is no token.
3. One call site per response path in `src/app/api/listings/route.ts`, covering
   all three fallbacks, plus `?id=` and `?search=`.
4. `?status=all` gains `requireAdmin`.
5. Cache headers become `private` on any tier-dependent response.
6. The client keeps its current gating. It becomes belt-and-braces rather than
   the only control, and removing it is a separate cleanup.

Estimated size: roughly 150 lines of new code and one route touched, once the
decisions are made. The decisions are the work; the code is not.

---

## 8. Testing plan

Two categories, deliberately separated, because they carry very different
weight. The distinction matters: a source-inspecting test can pass while the
endpoint is wide open.

### 8a. Tests that EXECUTE authorization behaviour

These call real code and assert on real output. They are the ones that would
catch a regression.

**Already executing, in PR #109** — `tests/listings-access-control.test.ts`
calls `redactListing` and `redactListings` on a fixture and asserts that no
restricted value survives, that keys are retained, that the input is not
mutated, and that the retained set keeps search, filtering and map pins
working. 20 of its assertions are of this kind.

**To add with this proposal**, all pure and runnable with no credentials:

- `applyAccess(listing, tier)` for all four tiers against a fixture with every
  field populated, asserting the exact field set per tier.
- The matrix is total: every key of `Game` appears in it, so a new field cannot
  default to visible.
- `resolveTier` as a pure function over a decoded-token-plus-user-document
  input, covering: no token, invalid token, valid token with no user document,
  free, trial, contributor, active subscriber, past-due subscriber, admin by
  email, admin by `accountType`.
- Response-shape equivalence across the three fallback paths: the same fixture
  through each returns the same redacted shape.
- No restricted sentinel value appears in `JSON.stringify` of any
  non-paid response.

**To add, requiring credentials and therefore NOT runnable here** — these are
the ones that actually prove the endpoint is closed, and they need a preview
deployment plus four test accounts:

- `GET /api/listings` anonymous: restricted fields absent.
- Same with a free account's token: restricted fields absent.
- Same with a subscriber's token: restricted fields present.
- Same with an admin token: present, and `?status=all` permitted.
- `?id=` and `?search=` obey the same rules.
- A subscriber token that has since lapsed is refused.
- Two tiers requesting the same URL in succession do not receive each other's
  cached body.

That last one is the cache-poisoning check from section 5. It cannot be
simulated locally and is the highest-risk item in the change.

### 8b. Tests that only INSPECT SOURCE

These read files and assert on their text. They catch a guard being deleted or
a call site being missed, and they are **not** evidence that authorization
works.

**Already in PR #109**: that the gap is still open (asserting `GET` has no
guard), that the write verbs are guarded before any database access, that the
primitive is not yet wired in, that the audit document exists, and that it
reproduces no contact data. **Also** every assertion in
`tests/authorization.test.ts` for the three gaps that PR closes: each checks
that a guard appears before any database access, by string position. None of
them executes a request.

**To add with this proposal**: that every response path in the route calls
`applyAccess`, that no tier-dependent response sets a `public` cache header,
and that `?status=all` is guarded.

PR #109's test file headers already state which category they fall into. That
labelling should be kept, because the two are easy to confuse when reading a
green test run, and a green run of 8b proves considerably less than it appears
to.

---

## 9. What must not change

- No subscriber benefit may be reduced without an explicit decision. D1 options
  (c) and (d) and decisions D2 and D3 all reduce one, and are marked.
- The free tier's map pins, search and filtering must keep working. The matrix
  is built to that constraint.
- City pages must keep rendering, which they will: they do not use the API.
- `?count=1` stays unauthenticated.
- Historical sweepstakes rules, giveaway status, schedule work and the queued
  data corrections are all out of scope here and stay in their own PRs.
