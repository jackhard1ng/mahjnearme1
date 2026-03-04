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
    // Geocoding failed — non-critical
  }

  return { lat: 0, lng: 0 };
}
