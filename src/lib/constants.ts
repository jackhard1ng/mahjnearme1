export const SITE_NAME = "MahjNearMe";
export const SITE_URL = "https://www.mahjnearme.com";
export const SITE_DESCRIPTION =
  "Find mahjong games, open play sessions, lessons, and events anywhere in the United States. The only directory of pickup mahjong games across the US.";

export const MONTHLY_PRICE = 4.99;
export const ANNUAL_PRICE = 39.99;
// Referral discount: 15% off
export const REFERRAL_DISCOUNT_PERCENT = 15;
export const REFERRAL_MONTHLY_PRICE = 4.24;
export const REFERRAL_ANNUAL_PRICE = 33.99;

// Referral commissions
export const MONTHLY_REFERRAL_COMMISSION = 1.50;
export const ANNUAL_REFERRAL_COMMISSION = 8.00;
export const COMMISSION_VESTING_DAYS = 60;
export const CONTRIBUTOR_INACTIVITY_NUDGE_DAYS = 45;
export const CONTRIBUTOR_INACTIVITY_SUSPEND_DAYS = 60;
export const HOME_METRO_CHANGE_COOLDOWN_DAYS = 90;

export const GIVEAWAY_COPY = "One lucky member wins a premium mahjong set every month. That's worth more than 5 years of membership.";

export const COLORS = {
  primary: "#FF1493",
  secondary: "#87CEEB",
  background: "#FFFFFF",
  backgroundAlt: "#FFF0F5",
  text: "#333333",
  navy: "#1E2A3A",
};

export const GAME_TYPE_LABELS: Record<string, string> = {
  open_play: "Open Play",
  lesson: "Lessons",
  league: "League",
  event: "Event",
  private: "Private",
};

export const GAME_TYPE_COLORS: Record<string, string> = {
  open_play: "bg-openplay",
  lesson: "bg-lesson",
  league: "bg-league",
  event: "bg-event",
  private: "bg-slate-400",
};

export const GAME_STYLE_LABELS: Record<string, string> = {
  american: "American",
  chinese: "Chinese",
  riichi: "Riichi",
  other: "Other",
};

export const SKILL_LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner Friendly",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const SKILL_LEVEL_COLORS: Record<string, string> = {
  beginner: "bg-skyblue-100 text-skyblue-600",
  intermediate: "bg-hotpink-100 text-hotpink-600",
  advanced: "bg-slate-100 text-charcoal",
};

export const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const FEATURED_CITIES = [
  "Tulsa",
  "Oklahoma City",
];

export const US_STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia",
};
