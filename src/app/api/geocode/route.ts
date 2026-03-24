import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side geocoding endpoint using OpenStreetMap Nominatim.
 * Avoids client-side CORS issues and allows server-side caching.
 *
 * GET /api/geocode?q=Dallas,+TX
 * Returns: { lat, lng, displayName } or { error }
 */

const geocodeCache = new Map<string, { lat: number; lng: number; displayName: string; cachedAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");

  if (!q || !q.trim()) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  const cacheKey = q.trim().toLowerCase();
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      lat: cached.lat,
      lng: cached.lng,
      displayName: cached.displayName,
    });
  }

  try {
    const encoded = encodeURIComponent(q.trim());
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encoded}`,
      {
        headers: { "User-Agent": "MahjNearMe/1.0" },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Geocoding service unavailable" }, { status: 502 });
    }

    const data = await res.json();
    if (data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name || q,
      };

      geocodeCache.set(cacheKey, { ...result, cachedAt: Date.now() });

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
  }
}
