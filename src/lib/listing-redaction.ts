/**
 * Field-level redaction for listings served to callers without a subscription.
 *
 * NOT WIRED IN. This module is provided, tested and unused, so that closing
 * the /api/listings access-control gap is a small, reviewable change rather
 * than a design exercise done under time pressure. See
 * audit/SECURITY-api-listings-access-control.md for the analysis.
 *
 * ## The gap
 *
 * `GET /api/listings` requires no authentication and returns every field of
 * every listing. The paywall is applied in the browser: GameCard reads
 * `hasAccess` from AuthContext and decides `canSeeContactInfo` from it, and
 * the game detail page does the same with `canSeeDetails`. The server sends
 * the venue, the street address and the organizer's contact details to
 * everyone and trusts the client not to draw them.
 *
 * ## Why this is not switched on here
 *
 * Deciding what a free visitor may see is a product decision, not a security
 * one. The pricing page currently promises that free users can "search the
 * full directory, see the map with all game pins, and view complete details
 * for the top result in each search", and that locked listings still show
 * "game type, day, distance, and skill level". A redaction that contradicts
 * that copy would break the advertised free tier. The split below encodes
 * exactly that published promise, but it needs confirming against intent, and
 * verifying it does not break the map, search ranking or the city pages
 * requires a real subscriber session to test both sides of.
 */

/**
 * Fields a caller without a subscription must not receive.
 *
 * Chosen to match the published free-tier description: type, day, distance and
 * skill level stay, so search, filtering, the map pins and the "games near
 * you" counts keep working. Identity and contact details go.
 */
export const PAYWALLED_FIELDS = [
  "venueName",
  "address",
  "contactName",
  "contactEmail",
  "contactPhone",
  "website",
  "instagram",
  "facebookGroup",
  "registrationLink",
  "howToJoin",
] as const;

export type PaywalledField = (typeof PAYWALLED_FIELDS)[number];

/** What a redacted listing reports in place of a hidden value. */
export const REDACTED = "" as const;

/**
 * Remove paywalled fields from one listing.
 *
 * Keys are kept and blanked rather than deleted, so the response shape does
 * not change and a client cannot distinguish "absent because redacted" from
 * "absent because never recorded" by key presence alone. `locked` is added so
 * the UI can say why a field is empty instead of rendering a blank.
 *
 * `geopoint` is deliberately retained: the map pins are part of the free tier.
 * Coordinates do approximate an address, which is a known and accepted
 * trade-off of that promise, not an oversight.
 */
export function redactListing<T extends Record<string, unknown>>(
  listing: T
): T & { locked: true } {
  const out = { ...listing } as Record<string, unknown>;
  for (const field of PAYWALLED_FIELDS) {
    if (field in out) out[field] = REDACTED;
  }
  out.locked = true;
  return out as T & { locked: true };
}

/**
 * Redact a list, optionally leaving the first `revealCount` untouched.
 *
 * The free tier promises complete details for the top result of a search, so a
 * caller can pass `revealCount: 1` to honour that. Ordering is the caller's
 * responsibility: this function reveals a prefix, it does not rank.
 */
export function redactListings<T extends Record<string, unknown>>(
  listings: T[],
  revealCount = 0
): (T | (T & { locked: true }))[] {
  return listings.map((l, i) => (i < revealCount ? l : redactListing(l)));
}

/** True when a listing object has had its paywalled fields removed. */
export function isRedacted(listing: Record<string, unknown>): boolean {
  return listing.locked === true;
}
