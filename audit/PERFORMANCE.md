# Payload note — /api/listings

Investigated 2026-08-31. **No change made.** This records what the numbers
are, the optimisation that looks obvious, and the specific reason it is not
safe to take yet.

## The situation

`useFirestoreListings` fetches the entire listings collection on the client,
and every page that shows games uses it. There is a module-level cache, so it
is one fetch per session rather than per page — but every new session pays it.

    uncompressed        5.47 MB   (3,801 listings)
    over the wire        650 KB   (brotli)
    time to first byte    ~1.9 s

The build also logs this on every run:

    Failed to set Next.js data cache for .../api/listings,
    items over 2MB can not be cached (7,645,182 bytes)

so the 777 statically generated pages each re-fetch it at build time rather
than sharing one cached copy.

## The obvious optimisation, and why it is unsafe

**26.6% of the payload — 1.49 MB — is empty and null fields.** The worst are
fields that are empty on effectively every record but still cost their key
name 3,801 times over:

    registrationDeadline   3,799 empty   104 KB
    leagueStartDate        3,799 empty    85 KB
    leagueEndDate          3,799 empty    78 KB
    commitmentNote         3,801 empty    74 KB
    sessionCount           3,799 empty    74 KB
    maxPlayers             3,801 empty    67 KB

Omitting empty values from the response drops the payload from 5.47 MB to
4.01 MB. It looks free.

It is not, because `docToGame` in `src/lib/listings-firestore.ts` normalises
every field to a default — `venueName: (data.venueName as string) || ""` and
so on — and code downstream relies on that guarantee. The organiser search in
`src/app/organizer/page.tsx:1436` does:

    g.organizerName.toLowerCase().includes(q) ||
    g.contactName.toLowerCase().includes(q)  ||
    g.venueName.toLowerCase().includes(q)    ||

with no optional chaining. Today those are `""` for the 75% of listings that
have no organiser name, and `"".toLowerCase()` is fine. Omit the key and they
become `undefined`, and the page throws on the first search.

A scan for unguarded access across `src/` found 34 such call sites on fields
that are sometimes empty. Most are genuinely guarded — `instructors/page.tsx`
checks `instructor.instagram &&` before calling `.replace()`, `calendar`
checks `if (game.eventStartTime)` — but the organiser search is not, and one
crash is enough.

## What to do instead, in order of value

1. **Fetch per city, not everything.** The API already supports
   `?state=…&city=…` and filters server-side, but the client hook always
   requests the whole collection. A city page needs the listings for one
   city. This is the real fix and it dwarfs field trimming.

2. **Then trim empty fields**, once the unguarded call sites are made
   null-safe. Worth 26% on whatever the payload has become by then.

3. **The 2MB build-cache ceiling** resolves itself once the payload is under
   it; until then every static page build re-fetches 7.6 MB.

None of these is a one-line change, which is why this is a note rather than a
commit. Doing (1) badly — for instance leaving the search page fetching
everything while city pages fetch a slice — would put two different listing
sets in front of the same user.
