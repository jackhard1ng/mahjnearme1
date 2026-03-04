export function formatTime(time24: string): string {
  if (!time24 || !time24.includes(":")) return time24 || "";
  const [hours, minutes] = time24.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return time24;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function slugify(text: string): string {
  if (!text) return "";
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
    case "open_play": return "bg-openplay-light text-[#C4107A] border-openplay-border";
    case "lesson": return "bg-lesson-light text-[#0284C7] border-lesson-border";
    case "league": return "bg-league-light text-[#7C3AED] border-league-border";
    case "event": return "bg-event-light text-[#D97706] border-event-border";
    default: return "bg-openplay-light text-[#C4107A] border-openplay-border";
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
    case "lesson": return "#0EA5E9";
    case "league": return "#8B5CF6";
    case "event": return "#F59E0B";
    default: return "#94a3b8";
  }
}

export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getStateName(abbr: string): string {
  if (!abbr) return "";
  const { US_STATES } = require("@/lib/constants");
  return US_STATES[abbr.toUpperCase()] || abbr;
}

export function getDayLabel(day: string): string {
  return capitalize(day) + "s";
}

export function formatSchedule(game: { isRecurring: boolean; recurringSchedule: { dayOfWeek: string; startTime: string; endTime: string; frequency: string } | null; eventDate: string | null; eventStartTime: string | null; eventEndTime: string | null }): string {
  if (game.isRecurring && game.recurringSchedule) {
    const { dayOfWeek, startTime, endTime, frequency } = game.recurringSchedule;
    const freqLabel = frequency === "weekly" ? "Every" : frequency === "biweekly" ? "Every other" : frequency === "monthly" ? "Monthly," : "";
    const dayStr = dayOfWeek ? capitalize(dayOfWeek) : "";
    const timeStr = startTime && endTime
      ? `, ${formatTime(startTime)} - ${formatTime(endTime)}`
      : startTime
        ? `, ${formatTime(startTime)}`
        : "";
    return `${freqLabel} ${dayStr}${timeStr}`.trim();
  }
  if (game.eventDate) {
    // Parse as local date (not UTC) to avoid timezone offset showing wrong day
    const [year, month, day] = game.eventDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const dateStr = date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const timeStr = game.eventStartTime && game.eventEndTime
      ? `, ${formatTime(game.eventStartTime)} - ${formatTime(game.eventEndTime)}`
      : game.eventStartTime
        ? `, ${formatTime(game.eventStartTime)}`
        : "";
    return dateStr + timeStr;
  }
  return "Schedule TBD";
}

/**
 * Returns true if a one-time event's date is in the past.
 * Recurring events never expire via this check.
 */
export function isEventExpired(game: { isRecurring: boolean; eventDate: string | null }): boolean {
  if (game.isRecurring) return false;
  if (!game.eventDate) return false;
  const [year, month, day] = game.eventDate.split("-").map(Number);
  const eventDay = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDay < today;
}

/**
 * Build a Google Calendar "Add Event" URL for a game.
 */
export function buildGoogleCalendarUrl(game: {
  name: string;
  isRecurring: boolean;
  recurringSchedule: { dayOfWeek: string; startTime: string; endTime: string; frequency: string } | null;
  eventDate: string | null;
  eventStartTime: string | null;
  eventEndTime: string | null;
  venueName: string;
  address: string;
  description: string;
}): string {
  const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";
  const title = encodeURIComponent(game.name);
  const location = encodeURIComponent(game.venueName ? `${game.venueName}, ${game.address}` : game.address);
  const details = encodeURIComponent(game.description || "");

  // For one-time events with a date
  if (!game.isRecurring && game.eventDate) {
    const dateClean = game.eventDate.replace(/-/g, "");
    const startTime = game.eventStartTime ? game.eventStartTime.replace(":", "") + "00" : "";
    const endTime = game.eventEndTime ? game.eventEndTime.replace(":", "") + "00" : "";

    if (startTime && endTime) {
      return `${base}&text=${title}&dates=${dateClean}T${startTime}/${dateClean}T${endTime}&location=${location}&details=${details}`;
    }
    // All-day event
    const nextDay = new Date(Number(game.eventDate.slice(0, 4)), Number(game.eventDate.slice(5, 7)) - 1, Number(game.eventDate.slice(8, 10)) + 1);
    const nextDayStr = nextDay.toISOString().slice(0, 10).replace(/-/g, "");
    return `${base}&text=${title}&dates=${dateClean}/${nextDayStr}&location=${location}&details=${details}`;
  }

  // For recurring events — create next occurrence
  if (game.isRecurring && game.recurringSchedule) {
    const { dayOfWeek, startTime, endTime } = game.recurringSchedule;
    const dayMap: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
    const targetDay = dayMap[dayOfWeek.toLowerCase().split("|")[0].split(" ")[0]];
    if (targetDay !== undefined) {
      const now = new Date();
      const currentDay = now.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil <= 0) daysUntil += 7;
      const nextDate = new Date(now);
      nextDate.setDate(now.getDate() + daysUntil);
      const dateStr = nextDate.toISOString().slice(0, 10).replace(/-/g, "");

      if (startTime && endTime && startTime.includes(":") && endTime.includes(":")) {
        const st = startTime.replace(":", "") + "00";
        const et = endTime.replace(":", "") + "00";
        return `${base}&text=${title}&dates=${dateStr}T${st}/${dateStr}T${et}&location=${location}&details=${details}`;
      }
      // All-day
      const nextDayDate = new Date(nextDate);
      nextDayDate.setDate(nextDayDate.getDate() + 1);
      const nextDayStr = nextDayDate.toISOString().slice(0, 10).replace(/-/g, "");
      return `${base}&text=${title}&dates=${dateStr}/${nextDayStr}&location=${location}&details=${details}`;
    }
  }

  // Fallback — just open with title and location
  return `${base}&text=${title}&location=${location}&details=${details}`;
}
