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
    return { label: "Verified", color: "text-hotpink-600", bgColor: "bg-hotpink-100 border-hotpink-300" };
  }
  return { label: "Unverified", color: "text-slate-500", bgColor: "bg-slate-100 border-slate-200" };
}

export function getGameTypeColor(type: string): string {
  switch (type) {
    case "open_play": return "bg-hotpink-100 text-hotpink-600 border-hotpink-200";
    case "lesson": return "bg-skyblue-100 text-skyblue-600 border-skyblue-300";
    case "league": return "bg-hotpink-100 text-hotpink-600 border-hotpink-200";
    case "event": return "bg-skyblue-100 text-skyblue-600 border-skyblue-300";
    default: return "bg-hotpink-100 text-hotpink-600 border-hotpink-200";
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
    case "open_play": return "#FF1493";
    case "lesson": return "#87CEEB";
    case "league": return "#FF69B4";
    case "event": return "#5BB6D9";
    default: return "#94a3b8";
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
