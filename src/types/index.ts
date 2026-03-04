export type GameType = "open_play" | "lesson" | "league" | "event" | "private";
export type GameStyle = "american" | "chinese" | "riichi" | "other";
export type SkillLevel = "beginner" | "intermediate" | "advanced";
export type Frequency = "weekly" | "biweekly" | "monthly" | "first_tuesday" | "first_wednesday" | "first_thursday" | "last_friday";
export type AccountType = "free" | "trial" | "subscriber" | "admin";
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
  type: GameType;
  gameStyle: GameStyle;

  // Location
  city: string;
  state: string;
  generalArea: string;
  venueName: string;
  address: string;
  geopoint: { lat: number; lng: number };

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

  // Admin
  status: ListingStatus;
  verified: boolean;
  claimedBy: string | null;
  source: ListingSource;
  promoted: boolean;
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

  // Player Profile
  photoURL: string | null;
  avatarColor: string | null;
  skillLevel: SkillLevel | null;
  gameStylePreference: GameStyle | "any" | null;

  // Preferences
  homeCity: string;
  homeGeopoint: { lat: number; lng: number } | null;
  savedCities: string[];
  favoriteGames: string[];
  savedEvents: string[];

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

export interface SearchFilters {
  daysOfWeek: string[];
  gameStyle: GameStyle | "all";
  dropInFriendly: boolean | null;
  skillLevel: SkillLevel | "all";
  type: GameType | "all";
  dateFrom: string | null;
  dateTo: string | null;
}
