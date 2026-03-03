export function formatTime(time24: string): string {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getVerificationStatus(verified: boolean): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (verified) {
    return { label: "Verified", color: "text-mint-600", bgColor: "bg-mint-100 border-mint-300" };
  }
  return { label: "Unverified", color: "text-slate-500", bgColor: "bg-lavender-100 border-lavender-200" };
}

export function getGameTypeColor(type: string): string {
  switch (type) {
    case "open_play": return "bg-mint-200 text-mint-600 border-mint-300";
    case "lesson": return "bg-skyblue-200 text-skyblue-600 border-skyblue-300";
    case "league": return "bg-gold-100 text-gold-600 border-gold-200";
    case "event": return "bg-lavender-200 text-lavender-600 border-lavender-300";
    default: return "bg-softpink-200 text-hotpink-500 border-softpink-300";
  }
}

export function getGameTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    open_play: "Open Play",
    lesson: "Lessons",
    league: "League",
    event: "Event",
    private: "Private",
  };
  return labels[type] || type;
}

export function getMapPinColor(type: string): string {
  switch (type) {
    case "open_play": return "#5ECDB0";
    case "lesson": return "#F97316";
    case "league": return "#EAB308";
    case "event": return "#A855F7";
    default: return "#6B7280";
  }
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getStateName(abbr: string): string {
  const { US_STATES } = require("@/lib/constants");
  return US_STATES[abbr.toUpperCase()] || abbr;
}

export function getDayLabel(day: string): string {
  return capitalize(day) + "s";
}

export function formatSchedule(game: { isRecurring: boolean; recurringSchedule: { dayOfWeek: string; startTime: string; endTime: string; frequency: string } | null; eventDate: string | null; eventStartTime: string | null; eventEndTime: string | null }): string {
  if (game.isRecurring && game.recurringSchedule) {
    const { dayOfWeek, startTime, endTime, frequency } = game.recurringSchedule;
    const freqLabel = frequency === "weekly" ? "Every" : frequency === "biweekly" ? "Every other" : "";
    return `${freqLabel} ${capitalize(dayOfWeek)}, ${formatTime(startTime)} - ${formatTime(endTime)}`;
  }
  if (game.eventDate) {
    const date = new Date(game.eventDate);
    const dateStr = date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const timeStr = game.eventStartTime && game.eventEndTime
      ? `, ${formatTime(game.eventStartTime)} - ${formatTime(game.eventEndTime)}`
      : "";
    return dateStr + timeStr;
  }
  return "Schedule TBD";
}
