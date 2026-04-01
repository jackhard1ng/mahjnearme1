export type GameType = "open_play" | "lesson" | "league" | "event" | "private";
export type GameStyle = "american" | "chinese" | "riichi" | "other";
export type SkillLevel = "beginner" | "intermediate" | "advanced";
export type Frequency = "weekly" | "biweekly" | "monthly" | "first_tuesday" | "first_wednesday" | "first_thursday" | "last_friday";
export type AccountType = "free" | "trial" | "subscriber" | "contributor" | "organizer" | "admin";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "none";
export type ListingStatus = "active" | "pending" | "claimed" | "inactive";
export type ListingSource = "manual" | "csv_import" | "organizer_submitted";

export interface RecurringSchedule {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  frequency: Frequency;
}

export interface Game {
  id: string;
  name: string;
  organizerName: string;
  organizerId: string | null;
  type: GameType;
  gameStyle: GameStyle;

  // Location
  city: string;
  state: string;
  generalArea: string;
  venueName: string;
  address: string;
  geopoint: { lat: number; lng: number };
  metroRegion: string | null;

  // Schedule
  isRecurring: boolean;
  recurringSchedule: RecurringSchedule | null;
  eventDate: string | null;
  eventStartTime: string | null;
  eventEndTime: string | null;

  // Details
  cost: string;
  costAmount: number | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  instagram: string;
  facebookGroup: string;
  registrationLink: string;
  description: string;
  howToJoin: string;
  whatToBring: string;

  // Features
  skillLevels: SkillLevel[];
  dropInFriendly: boolean;
  setsProvided: boolean;
  maxPlayers: number | null;
  typicalGroupSize: string;
  imageUrl: string;

  // Reactions
  goingCount: number;
  beenHereCount: number;
  headsUpCount: number;

  // Admin
  status: ListingStatus;
  verified: boolean;
  claimedBy: string | null;
  source: ListingSource;
  promoted: boolean;
  organizerEdited: boolean;
  lastVerified: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  accountType: AccountType;

  // Subscription
  stripeCustomerId: string | null;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  plan: "monthly" | "annual" | null;
  subscribedPrice: number | null;
  subscribedDate: string | null;
  isGrandfathered: boolean;

  // Referral
  referralCode: string | null;
  referralLink: string | null;
  referredByCode: string | null;

  // Contributor
  isContributor: boolean;
  contributorCity: string | null;
  contributorMetro: string | null;
  contributorAppliedAt: string | null;
  contributorStatus: ContributorStatus | null;
  lastActivityDate: string | null;
  verificationsThisMonth: number;

  // Organizer
  isOrganizer: boolean;
  organizerProfileId: string | null;

  // Player Profile
  photoURL: string | null;
  avatarColor: string | null;
  bio: string | null;
  skillLevel: SkillLevel | null;
  gameStylePreference: GameStyle | "any" | null;

  // Contact (for giveaway winner notification)
  contactPhone: string | null;

  // Preferences
  homeCity: string;
  homeMetro: string | null;
  homeMetroSelectedAt: string | null;
  homeGeopoint: { lat: number; lng: number } | null;
  savedCities: string[];
  favoriteGames: string[];
  savedEvents: string[];

  // Email notifications
  emailNotifications?: {
    newEventsInArea?: boolean;
    weeklyDigest?: boolean;
  } | null;
  notifyStates?: string[]; // state abbreviations to get notifications for

  createdAt: string;
  lastLoginAt: string;
}

export interface Review {
  id: string;
  gameId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  visitDate: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  affiliateLink: string;
  price: string;
  description: string;
  featured: boolean;
}

export type ContributorStatus = "pending" | "approved" | "rejected";

export interface ContributorApplication {
  id: string;
  userId: string;
  name: string;
  email: string;
  city: string;
  metroRegion: string | null;
  connections: string[];
  story: string;
  status: ContributorStatus;
  appliedAt: string;
  reviewedAt: string | null;
}

export interface ForumReply {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  authorIsContributor: boolean;
  body: string;
  upvotes: number;
  upvotedBy: string[];
  flagCount: number;
  flaggedBy: string[];
  createdAt: string;
}

export interface ReferralRecord {
  id: string;
  referralCode: string;
  contributorId: string;
  subscriberId: string;
  subscriberSignupDate: string;
  plan: "monthly" | "annual";
  status: "active" | "canceled" | "paused";
  vestingDate: string;
  isVested: boolean;
  createdAt: string;
}

export interface CommissionPayout {
  id: string;
  contributorId: string;
  amount: number;
  referralCount: number;
  period: string;
  paidAt: string | null;
  status: "pending" | "paid";
  createdAt: string;
}

export interface GiveawayEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: "monthly" | "annual" | "free_entry";
  entries: number;
  month: string;
  createdAt: string;
}

export interface GiveawayDraw {
  id: string;
  month: string;
  winnerId: string;
  winnerName: string;
  winnerCity: string;
  winnerPhotoURL: string | null;
  drawnAt: string;
  notified: boolean;
  displayPermission: boolean;
}

export interface SearchFilters {
  daysOfWeek: string[];
  gameStyle: GameStyle | "all";
  dropInFriendly: boolean | null;
  skillLevel: SkillLevel | "all";
  type: GameType | "tournament" | "all";
  dateFrom: string | null;
  dateTo: string | null;
}

// Organizer Directory
export type TeachingStyle = "private" | "group" | "corporate" | "kids" | "online";

export interface InstructorDetails {
  teachingStyles: TeachingStyle[];
  certifications: string;
  serviceArea: string;
  gameStylesTaught: GameStyle[];
}

export interface OrganizerLocation {
  venueName: string;
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

export interface Organizer {
  id: string;
  nameKey: string;
  organizerName: string;
  personalName: string;
  slug: string;
  bio: string;
  contactEmail: string;
  website: string;
  instagram: string;
  facebookGroup: string;
  photoURL: string | null;
  photos: string[];
  locations: OrganizerLocation[];
  listingIds: string[];
  listingCount: number;
  cities: string[];
  states: string[];
  verified: boolean;
  featured: boolean;
  userId: string | null;
  isInstructor: boolean;
  instructorDetails: InstructorDetails | null;
  createdAt: string;
  updatedAt: string;
}

// Listing Claims
export type ClaimStatus = "pending" | "approved" | "rejected";

export interface ListingClaim {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  listingIds: string[];
  organizerProfileId: string | null;
  status: ClaimStatus;
  message: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

// Approval Queue
export type ApprovalType = "claim" | "listing_edit" | "new_listing";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  userId: string;
  userEmail: string;
  userName: string;
  organizerProfileId: string | null;
  listingId: string | null;
  claimId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  status: ApprovalStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

// Listing Reactions
export type ReactionType = "going" | "been_here" | "heads_up";

export interface ListingReaction {
  id: string;
  gameId: string;
  userId: string;
  reactionType: ReactionType;
  note: string | null;
  createdAt: string;
}

// Forum post types: "full" (title + body) or "quick_note" (body only, 280 char max)
export type ForumPostType = "full" | "quick_note";

export interface ForumPost {
  id: string;
  postType: ForumPostType;
  metroSlug: string | null;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  authorIsContributor: boolean;
  title: string;
  body: string;
  isSticky: boolean;
  isGeneralDiscussion?: boolean;
  linkedGameId: string | null;
  upvotes: number;
  upvotedBy: string[];
  flagCount: number;
  flaggedBy: string[];
  createdAt: string;
  updatedAt: string;
}
