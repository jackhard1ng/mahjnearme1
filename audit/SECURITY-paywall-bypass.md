# Paywall bypass — /api/listings

Found 2026-08-31. **Not fixed, deliberately.** See "Why this is a note" below.

## What it is

`GET /api/listings` requires no authentication and returns every field of
every listing, including the ones the site charges for:

    contactEmail       553 listings
    contactPhone       793 listings
    address          2,536 listings
    registrationLink   582 listings

The site gates exactly these behind a subscription. In
`src/app/games/[...slug]/page.tsx`:

    const canSeeDetails = user && hasAccess;

and the address, contact block and registration link each render only when
that is true. But the gate is entirely client-side. The data is already in
the browser, because `useFirestoreListings` fetches the whole collection with
no credentials:

    fetch("/api/listings")   // no Authorization header, no cookie

So a logged-out visitor is served the complete paid dataset and shown a
locked UI on top of it. Opening DevTools, or simply running

    curl https://www.mahjnearme.com/api/listings

hands over 793 organiser phone numbers and 553 emails in one request.

I fixed the static-file half of this separately — `/listings.json` and two
`/verification-audit-*.json` exports were also world-readable and are now out
of `public/`. This is the larger remaining half, and closing it needs a real
change rather than a file move.

## Why this is a note rather than a commit

Fixing it properly means:

1. The client sends a Firebase ID token with the listings request.
2. The route verifies that token and looks up the subscription.
3. Paywalled fields are stripped from the response when the caller is not
   entitled.

Step 3 is easy. Steps 1 and 2 are the whole risk, and **I cannot test them
here** — this environment has no Firebase credentials and no test account, so
I can exercise the logged-out path but not the logged-in one.

Shipping an entitlement check I have never seen succeed is the wrong trade.
The failure mode is not a leak, it is paying subscribers silently losing every
address and phone number on the site, which is worse than the problem and
harder to notice. A leak that has existed for months can survive another few
days; a broken paywall churns customers.

## How to close it

The route already distinguishes an admin caller via `requireAdmin`, so the
shape exists. Suggested order:

1. Add `PAYWALLED_FIELDS = ["contactEmail", "contactPhone", "contactName",
   "address", "registrationLink"]` and a `stripPaywalled(listing)` helper.
2. In the GET handler, resolve the caller: admin (existing), authenticated
   subscriber (new), or anonymous. Strip for anonymous only, at first.
3. Have `useFirestoreListings` attach the ID token when a user is signed in.
   Note it caches at module level — the cache key needs to include whether
   the fetch was authenticated, or a signed-in user who lands on a page
   before auth resolves will keep the stripped copy for the rest of the
   session.
4. Verify all three paths against a real account before enabling: anonymous
   sees the locked UI and no data in the payload; a free account sees the
   same; a subscriber sees everything.

Point 3 is the one most likely to bite. The current cache is a single
module-level `_cache` with no notion of who fetched it.

## Interim

Rotating the exposed contact details is not realistic — they belong to
organisers, not to the platform. The realistic interim position is to treat
the current data as already public and prioritise the fix, rather than assume
it has not been scraped.
