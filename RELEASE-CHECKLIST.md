# Release checklist

Branch `claude/website-updates-research-xx0e6w`, PR #108 (draft).
Written 2026-11-05. Nothing in here has been deployed or applied.

## 1. Verified here

Run in this container, with the actual result:

| Check | Command | Result |
|---|---|---|
| App typecheck | `npm run typecheck` | clean |
| Test typecheck | `npm run typecheck:tests` | clean |
| Unit tests | `npm test` | 148 passed, 0 failed |
| Lint errors | `npx next lint` | 0 errors (42 files carry pre-existing warnings) |
| Production build | `npm run build` | compiles |
| 401 root cause | `POST /api/admin-proxy` with no auth header, against production | `401 {"error":"Missing auth token"}` |
| Giveaway notice render | headless Chromium against `next dev`, `/giveaways` | notice shown, no prize/value/winners/date, no page errors |
| Copy audit render | headless Chromium, `/`, `/pricing`, `/faq` | no contradictory phrases, no page errors |
| Correction runner, dry run | two real ids against production, reads only | 2 would apply, 0 blocked, no writes |
| Correction runner, block paths | tampered snapshot copy | both `updatedAt` drift and field drift blocked |
| Isolated release branch | path-filtered rebuild off `main` | `src/` byte-identical to the branch, typecheck clean, build succeeds |

## 2. NOT verified, and why

Read this section before deciding to deploy.

- **An authenticated listing edit surviving a reload.** There are no Firestore
  credentials in this container and the admin UI is auth-gated, so the
  end-to-end save is verified by code review, by the 401 probe and by unit
  tests, not by a click-through. MahjBot is testing this on the preview.
- **Anything that needs a real admin session.** The admin screens render
  nothing without one, so no admin UI was exercised in a browser: the schedule
  mode selector, the end-date field, the giveaway status selector, the
  verification toggle.
- **The giveaway running state on real data.** The notice state was rendered in
  a browser. `status: "running"` was only unit-tested, because switching it
  requires writing the live config.
- **The PUT create path.** Unreachable today: all 2,744 ids in
  `data/listings.json` are already Firestore documents. It is pinned by
  structural tests, not executed.
- **Multi-day display on a real record.** `formatSchedule` is unit-tested, but
  no stored record carries `eventEndDate` until a correction is applied.
- **Email rendering.** No email was sent. The welcome and winner templates were
  changed and read, not delivered.

## 3. Preview checks required before merge

1. Edit a listing in `/admin/games`, reload, confirm the value persisted.
   Frankie's Uptown (`XGMtSTWbOiDniiMCn8IS`) needs `City: NV -> Las Vegas`
   anyway.
2. Force a failure and confirm an error appears instead of success: open the
   admin page, sign out in another tab, then save. Expect "Not authorized...
   Sign out and back in", and the form stays open with the edit intact.
3. Toggle verification on a listing, reload, confirm it stuck. This never
   wrote to the database before.
4. `/giveaways`: notice shown, no prize, value, winner count or draw date.
5. Giveaway admin panel: pick a status and save once. This writes the new
   `status` field. Confirm the prize fields are hidden outside "running" and
   that the draw UI is replaced by an explanation.
6. Try to save `status: running` with an empty prize name. Expect a refusal.
7. Set a listing to one-time with a start and end date, save, reload. Confirm
   the weekly schedule is gone and the label reads as a span.
8. Sign in as a non-admin subscriber and confirm `/admin` and
   `/api/admin-proxy` both refuse.

Note: the preview reads and writes the **real production Firestore**, because
that is the only database configured. Checks 1, 3, 5 and 7 are genuine edits to
live records. Pick records you are content to change.

## 4. Configuration migration

One item, not blocking:

- **Write an explicit giveaway `status`.** The live `siteConfig/giveaway`
  document has no `status` field, so the page falls back to `"reviewing"` from
  `src/lib/giveaway-config.ts`. That is the correct state, so nothing is broken
  before the migration. Opening the giveaway admin panel and saving once writes
  the field and removes the ambiguity. Do this after deploy, not before.

No schema migration is needed for `eventEndDate`: it is optional and absent
means single-day.

## 5. Live data corrections

**None applied. All require explicit approval.**

- `audit/corrections.json` holds 2,437 queued entries.
- `audit/pre-apply-snapshot.json` is the precondition baseline (1,951 records,
  2,588 fields), taken 2026-11-05.
- `scripts/apply-corrections-safely.ts` applies them. Dry-run by default;
  needs `--allow`/`--allow-ids` and `--apply`, plus `ADMIN_KEY`.

Suggested order, smallest first:

1. Frankie's Uptown city fix alone, to prove the pipeline:
   `--allow-ids XGMtSTWbOiDniiMCn8IS` (dry run, then `--apply`).
2. The 15 whitespace trims.
3. The schedule corrections, which need `--include-schedule`, one at a time.
   These are the ones that can hide a listing.

The snapshot ages. Regenerate it if the corrections sit unapplied for long, or
the runner will block records that have legitimately moved on.

## 6. Rollback

- **Code**: revert the merge commit, or redeploy the previous Vercel
  deployment. No schema change needs undoing; `eventEndDate` is additive and
  ignored when absent.
- **Giveaway config**: the previous values are still in the Firestore document
  (the new fields were added alongside, not in place of, the prize fields).
  Setting `status` back to `"running"` restores the old behaviour.
- **Corrections**: every `--apply` run writes `audit/backup-<stamp>.json` and
  `audit/rollback-<stamp>.json` **before** the first write. Replay with
  `--from audit/rollback-<stamp>.json --apply` and the same `--allow`.
- **Duplicates**: nothing to roll back, nothing was deleted.

## 7. Post-deploy checks

1. `/giveaways` on production: notice intact, no prize or date.
2. Homepage, `/pricing`, `/faq`: no monthly-cadence claims.
3. Edit one listing through the admin UI, reload, confirm persistence.
4. `GET /verification-audit-complete.json` and `/listings.json` on production
   must now 404. See the blocker below.
5. Vercel runtime logs: no new 500s on `/api/listings` or `/api/giveaway`.
6. Spot-check a city page and a game detail page for schedule labels.

## 8. Open blocker, needs Jack

**The paywalled dataset is currently served as public static files.** Live on
production right now, no authentication:

| URL | Contents |
|---|---|
| `/listings.json` | 2,744 records, 2,516 venue names, 1,821 addresses, 765 contact names, 559 phone numbers, 374 emails |
| `/verification-audit-complete.json` | 2,863 records, 1,892 addresses, 781 contact names, 571 phone numbers, 391 emails |
| `/verification-audit-2026-04-06.json` | same shape |

All three return HTTP 200 to anyone. This is the data 88 people are paying for,
plus third-party organizer contact details. This branch deletes all three
(commit `e5c6ba7`, which also moves `public/listings.json` to `data/`), but the
fix does not take effect until something deploys.

It cannot be fixed without a deploy, which is outside what I was asked to do.
Three options, fastest first:

1. Delete the three files from `main` directly and let Vercel redeploy. Smallest
   possible change, independent of this PR.
2. Merge this PR, or the isolated release branch described in the handoff.
3. Add a Vercel rewrite returning 404 for those paths, as a stopgap.

Separately, `/api/listings` still returns full details without a subscription.
That is documented in `audit/SECURITY-paywall-bypass.md` and is **not** fixed in
this branch; closing it needs a real subscriber session to test against.
