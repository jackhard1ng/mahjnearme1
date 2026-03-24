/**
 * Haversine formula: calculate the distance (in miles) between two lat/lng points.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Format a distance in miles for display.
 * Under 0.1 miles → "< 0.1 miles"
 * Under 10 miles → one decimal ("3.2 miles")
 * 10+ miles → whole number ("47 miles")
 */
export function formatDistance(miles: number): string {
  if (miles < 0.1) return "< 0.1 miles away";
  if (miles < 10) return `${miles.toFixed(1)} miles away`;
  return `${Math.round(miles)} miles away`;
}
