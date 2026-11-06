/**
 * PROPOSAL, NOT WIRED IN. Tier-based field visibility for listings.
 *
 * See docs/PROPOSAL-listing-access-control.md. Four decisions (D1 to D4) must
 * be settled before this can be used, because they determine the free tier's
 * shape and this module encodes only the parts the published copy already
 * fixes. Nothing imports it; the route is unchanged.
 *
 * Every entry in VISIBILITY is justified by copy already on the site:
 *
 *   src/app/pricing/page.tsx:11-26   the free and subscriber feature lists
 *   src/app/pricing/page.tsx:31-34   "What can I see for free?"
 *   src/app/faq/page.tsx:25-26       what a locked listing shows
 *   src/components/GameCard.tsx:216  "Locked cards: type + day + distance +
 *                                     skill only. NO name, venue, or
 *                                     identifying info."
 *
 * The matrix is TOTAL over the Game interface: every key is listed. A new
 * field therefore cannot default to visible, which is the failure mode that
 * makes this kind of allowlist rot. A test asserts totality.
 */

import type { Game } from "@/types";

/**
 * Access tiers.
 *
 * "free" is a signed-in visitor without a subscription. It is currently
 * identical to "anonymous" for listing fields, because no published copy
 * distinguishes them — see decision D4. The tier is kept separate so that
 * resolving D4 is a data change here rather than a structural one.
 *
 * "paid" matches the existing `hasAccess` definition in AuthContext: an active
 * subscription, a contributor, or a trial.
 */
export type AccessTier = "anonymous" | "free" | "paid" | "admin";

export const ACCESS_TIERS: readonly AccessTier[] = ["anonymous", "free", "paid", "admin"] as const;

/** Which tiers may see a field. */
type Visibility = {
  readonly anonymous: boolean;
  readonly free: boolean;
  readonly paid: boolean;
  readonly admin: boolean;
};

const ALL: Visibility = { anonymous: true, free: true, paid: true, admin: true };
/** Withheld from everyone without a subscription. */
const PAID: Visibility = { anonymous: false, free: false, paid: true, admin: true };
/** Internal bookkeeping: operators only. */
const ADMIN: Visibility = { anonymous: false, free: false, paid: false, admin: true };

/**
 * Field visibility by tier. Total over `keyof Game`.
 *
 * `geopoint` is visible to everyone because "See the map with all game pins"
 * is an advertised free benefit (pricing/page.tsx:13). Coordinates approximate
 * a street address; that is a consequence of the published promise, noted
 * rather than hidden.
 */
export const VISIBILITY: Readonly<Record<keyof Game, Visibility>> = {
  // Identity and location, the paywalled core
  name: PAID,
  venueName: PAID,
  address: PAID,

  // Contact, listed as paid in pricing/page.tsx:22,25
  contactName: PAID,
  contactEmail: PAID,
  contactPhone: PAID,
  website: PAID,
  instagram: PAID,
  facebookGroup: PAID,
  registrationLink: PAID,

  // Prose. "Schedules, descriptions, and how-to-join info" (pricing:24).
  // Also necessary: descriptions routinely contain an address or booking URL
  // inline, so withholding `address` while serving `description` would be
  // ineffective. See decision D7.
  description: PAID,
  howToJoin: PAID,
  whatToBring: PAID,

  // Often a person's or business's name, and frequently equal to `name`.
  // No published copy mentions it. Treated as paid pending decision D6.
  organizerName: PAID,

  // Free: everything the published copy promises, plus what search, filtering,
  // the map and the city pages need to keep working.
  id: ALL,
  city: ALL,
  state: ALL,
  generalArea: ALL,
  type: ALL,
  gameStyle: ALL,
  geopoint: ALL,
  metroRegion: ALL,
  isRecurring: ALL,
  recurringSchedule: ALL,
  eventDate: ALL,
  eventStartTime: ALL,
  eventEndTime: ALL,
  cost: ALL,
  costAmount: ALL,
  skillLevels: ALL,
  dropInFriendly: ALL,
  setsProvided: ALL,
  maxPlayers: ALL,
  typicalGroupSize: ALL,
  imageUrl: ALL,
  leagueStartDate: ALL,
  leagueEndDate: ALL,
  sessionCount: ALL,
  registrationDeadline: ALL,
  commitmentNote: ALL,
  goingCount: ALL,
  beenHereCount: ALL,
  headsUpCount: ALL,
  status: ALL,
  verified: ALL,
  promoted: ALL,
  isDestinationEvent: ALL,
  lastVerified: ALL,

  // Internal bookkeeping. Never part of the product.
  organizerId: ADMIN,
  claimedBy: ADMIN,
  source: ADMIN,
  organizerEdited: ADMIN,

  // Record timestamps: useful to a subscriber judging freshness, not to an
  // anonymous caller fingerprinting the dataset.
  createdAt: PAID,
  updatedAt: PAID,
};

/** Fields a tier may NOT see. */
export function withheldFor(tier: AccessTier): (keyof Game)[] {
  return (Object.keys(VISIBILITY) as (keyof Game)[]).filter((k) => !VISIBILITY[k][tier]);
}

/** Fields a tier MAY see. */
export function visibleFor(tier: AccessTier): (keyof Game)[] {
  return (Object.keys(VISIBILITY) as (keyof Game)[]).filter((k) => VISIBILITY[k][tier]);
}

/**
 * Apply a tier's visibility to one listing.
 *
 * Withheld string fields are blanked and withheld non-strings are nulled,
 * rather than having their keys deleted. Deleting keys would let a caller
 * infer which listings HAVE an address from key presence alone, and would
 * change the response shape per tier. `locked` is set so the UI can explain a
 * blank instead of rendering nothing. See decision D9.
 *
 * The input is never mutated.
 */
export function applyAccess<T extends Partial<Game>>(
  listing: T,
  tier: AccessTier
): T & { locked?: true } {
  if (tier === "admin") return { ...listing };

  const out: Record<string, unknown> = { ...listing };
  let didWithhold = false;

  for (const field of withheldFor(tier)) {
    if (!(field in out)) continue;
    didWithhold = true;
    out[field] = typeof out[field] === "string" ? "" : null;
  }

  if (didWithhold) out.locked = true;
  return out as T & { locked?: true };
}

/** Apply to a list. */
export function applyAccessToAll<T extends Partial<Game>>(
  listings: T[],
  tier: AccessTier
): (T & { locked?: true })[] {
  return listings.map((l) => applyAccess(l, tier));
}

/**
 * The caller's tier, as a pure function of an already-verified token and the
 * caller's user document.
 *
 * Pure on purpose: the I/O (verifying the token, reading the document) stays
 * in the route, so the decision itself is testable without credentials. The
 * route would call `requireUser` and then pass the results here.
 *
 * `subscriptionStatus` and `accountType` are read the same way
 * /api/giveaway:68-76 already determines giveaway eligibility, so there is one
 * definition of "paying" rather than two.
 */
export function resolveTier(input: {
  /** Null when there is no token, or the token failed verification. */
  verified: { uid: string; email: string; emailVerified: boolean } | null;
  /** The caller's users/{uid} document, or null when it does not exist. */
  userDoc: {
    accountType?: string;
    subscriptionStatus?: string;
    accessUntil?: string;
  } | null;
  /** Mirror of ADMIN_EMAILS in api-auth.ts. */
  adminEmails: readonly string[];
  /** For evaluating accessUntil. */
  now?: Date;
}): AccessTier {
  const { verified, userDoc, adminEmails } = input;
  if (!verified) return "anonymous";

  // Admin by allowlisted AND VERIFIED email, matching the rule PR #109 added
  // to requireAdminUser: an unverified claim must not grant admin.
  if (verified.emailVerified && adminEmails.includes(verified.email.toLowerCase())) {
    return "admin";
  }
  if (userDoc?.accountType === "admin") return "admin";

  if (!userDoc) return "free";

  // Paid, matching AuthContext's hasAccess: an active subscription, a
  // contributor, or an unexpired trial.
  if (userDoc.subscriptionStatus === "active" || userDoc.subscriptionStatus === "trialing") {
    return "paid";
  }
  if (userDoc.accountType === "contributor" || userDoc.accountType === "subscriber") {
    return "paid";
  }
  if (userDoc.accessUntil) {
    const until = new Date(userDoc.accessUntil).getTime();
    if (!Number.isNaN(until) && until > (input.now ?? new Date()).getTime()) return "paid";
  }

  // Everything else, including "past_due" and "canceled", is free. A lapsed
  // subscriber is not a subscriber; see the test for that case.
  return "free";
}
