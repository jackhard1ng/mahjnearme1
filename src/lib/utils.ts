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
    return { label: "Verified", color: "text-green-700", bgColor: "bg-green-50 border-green-200" };
  }
  return { label: "Unverified", color: "text-gray-500", bgColor: "bg-gray-50 border-gray-200" };
}

export function getGameTypeColor(type: string): string {
  switch (type) {
    case "open_play": return "bg-jade-100 text-jade-800 border-jade-200";
    case "lesson": return "bg-orange-100 text-orange-800 border-orange-200";
    case "league": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "event": return "bg-purple-100 text-purple-800 border-purple-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
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
    case "open_play": return "#059669";
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
