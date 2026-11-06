# Security PR: deployment and rollback

Branch `claude/security-public-data-and-authz`, cut from `main`.
Nothing here has been deployed and no production data has been written.

## What this changes

Three publicly served data files removed, three authorization gaps closed.
Deliberately excluded: giveaway status, schedule and recurrence work, the
duplicate audit and all queued data corrections. Those stay in PR #108.

| Change | File |
|---|---|
| `public/listings.json` relocated to `data/` (git rename, content unchanged) | `data/listings.json` |
| Two `verification-audit-*.json` exports deleted | `public/` |
| Build-time require repointed | `src/lib/listings-data.ts` |
| Stop fetching the dataset over its own public URL | `src/app/api/organizers/populate/route.ts` |
| Geocoding script repointed | `scripts/batch-geocode.ts` |
| Email allowlist requires `email_verified` | `src/lib/api-auth.ts` |
| `PATCH /api/contributor-apply` requires admin | that route |
| `GET /api/organizers` requires admin | that route |
| Redaction primitive, unused | `src/lib/listing-redaction.ts` |
| Export files ignored so they cannot be committed again | `.gitignore` |

## Verified before deploying

| Check | Result |
|---|---|
| `npm run typecheck` | clean |
| `npm run typecheck:tests` | clean |
| `npm test` | 60 passed, 0 failed |
| `npx next lint` | 0 errors |
| `npm run build` | compiles |
| All three removed paths return 404 locally | confirmed |
| Home, search and add-your-group render listing content | confirmed, no failed requests |

Two pre-existing local failures were checked against a clean `main` worktree
and are **not** caused by this branch: `/api/organizers/instructors` returns
500 (no Firebase credentials in that environment) and `/search` logs a
hydration mismatch. Both reproduce identically on `main`.

## Not verified

- No admin screen was exercised in a browser. The admin UI is auth-gated and
  there are no credentials in the environment this was built in, so the three
  authorization changes are verified by code review, by structural tests and
  by the proxy allowlist analysis, not by a click-through.
- The `data/listings.json` fallback is verified by the build resolving and
  bundling the require, plus a path-resolution test. It was not executed,
  because it uses CommonJS `require`, which Next's bundler provides and Node's
  ESM test loader does not.

## Preview checks

1. `/listings.json`, `/verification-audit-complete.json` and
   `/verification-audit-2026-04-06.json` all return **404**.
2. Home page, `/search`, a city page and a game detail page all still show
   listings. This is the regression that matters: the dataset moved.
3. `/instructors` and `/add-your-group` still load. They read
   `/api/organizers/instructors` and `/api/organizers/overrides`, which are
   unchanged and still public.
4. Sign in as admin. The organizer list on `/admin` must still populate. It
   reads `GET /api/organizers?all=true`, now admin-only, through the proxy.
5. Signed out, request `/api/organizers?all=true` directly. Expect **401**.
6. Signed in as a non-admin subscriber, request it. Expect **401** or **403**.
7. Admin "Populate organizers" must still work. It no longer fetches the
   public URL.

Note on check 4: on `main` the organizer autofill on `/admin/games` and
`/admin/mobile` is **already broken**, because `adminFetch` on those two
screens sends no token and the proxy rejects it with 401. This PR does not
change that, and does not make it worse: those calls fail at the proxy, before
reaching the new guard. PR #108 fixes the token. `/admin` itself uses the
working `adminFetch` and will populate.

## Deploy

```sh
git fetch origin
git switch claude/security-public-data-and-authz
git rebase origin/main      # only if main moved; expect no conflicts
npm ci && npm run typecheck && npm test && npm run build
```

Then merge to `main` and let Vercel deploy. Confirm immediately after:

```sh
curl -sI https://www.mahjnearme.com/listings.json | head -1                     # expect 404
curl -sI https://www.mahjnearme.com/verification-audit-complete.json | head -1  # expect 404
curl -s -o /dev/null -w '%{http_code}\n' https://www.mahjnearme.com/api/organizers?all=true   # expect 401
curl -s -o /dev/null -w '%{http_code}\n' https://www.mahjnearme.com/api/listings              # still 200, see below
```

Vercel serves `public/` from the build output, so the files stop being
reachable as soon as the new deployment is promoted. They may survive in the
CDN edge cache briefly; if a 200 persists past a few minutes, purge the cache
from the Vercel dashboard.

No configuration migration. No environment variable changes. No schema change.
No data write.

## Rollback

Code only; nothing else to undo.

- **Preferred:** in the Vercel dashboard, promote the previous deployment.
  Instant, and restores the files along with everything else.
- **Via git:** `git revert -m 1 <merge-commit>` and push. The rename reverses
  cleanly and both deleted files come back from history.
- **Partial:** to keep the authorization fixes and restore only the files,
  `git checkout <merge-commit>~1 -- public/` then re-point
  `src/lib/listings-data.ts` and `src/app/api/organizers/populate/route.ts`.
  Not recommended: it reopens the exposure.

If rolling back because an admin screen broke, the likely cause is check 4
above. Reverting `src/app/api/organizers/route.ts` alone restores that
endpoint's old behaviour without restoring the files.

## What this does NOT fix

`GET /api/listings` still returns every field, including venue, address and
organizer contact details, to any unauthenticated caller. The paywall is
applied in the browser. Removing the static files reduces the exposure; it
does not end it.

That is documented in `audit/SECURITY-api-listings-access-control.md`, with a
tested but unwired redaction primitive in `src/lib/listing-redaction.ts`.
Closing it needs a product decision about the free tier and a real subscriber
session to test both sides of the gate, so it is deliberately out of scope
here. Do not read this PR as "the paywall is now enforced".
