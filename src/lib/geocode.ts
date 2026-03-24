/**
 * Geocode an address to lat/lng using OpenStreetMap Nominatim (free, no API key).
 * Falls back to { lat: 0, lng: 0 } on failure.
 */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number }> {
  if (!address.trim()) return { lat: 0, lng: 0 };

  try {
    const encoded = encodeURIComponent(address);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encoded}`,
      {
        headers: {
          "User-Agent": "MahjNearMe/1.0",
        },
      }
    );

    if (!res.ok) return { lat: 0, lng: 0 };

    const data = await res.json();
    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
  } catch {
    // Geocoding failed, non-critical
  }

  return { lat: 0, lng: 0 };
}

/**
 * Geocode a user's search query (city name, zip code, address, etc.)
 * into lat/lng coordinates. Scoped to the United States.
 *
 * Uses the internal /api/geocode endpoint first (server-side cached),
 * with a fallback to direct Nominatim if the API is unavailable.
 * Returns null if geocoding fails.
 */
export async function geocodeSearchQuery(
  query: string
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  if (!query.trim()) return null;

  // Try our own server-side endpoint first (cached, no CORS issues)
  try {
    const encoded = encodeURIComponent(query.trim());
    const res = await fetch(`/api/geocode?q=${encoded}`);
    if (res.ok) {
      const data = await res.json();
      if (data.lat && data.lng) {
        return { lat: data.lat, lng: data.lng, displayName: data.displayName || query };
      }
    }
  } catch {
    // API route unavailable, fall through to direct Nominatim
  }

  // Fallback: direct Nominatim call
  try {
    const encoded = encodeURIComponent(query.trim());
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encoded}`,
      {
        headers: {
          "User-Agent": "MahjNearMe/1.0",
        },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name || query,
      };
    }
  } catch {
    // Geocoding failed
  }

  return null;
}
