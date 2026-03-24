"use client";

import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import SearchFiltersBar from "@/components/SearchFilters";
import GameCard from "@/components/GameCard";
import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="bg-skyblue-100 rounded-xl border-2 border-softpink-300 h-full min-h-[300px] flex items-center justify-center">
      <p className="text-slate-400 text-sm">Loading map...</p>
    </div>
  ),
});
import SkeletonCard from "@/components/SkeletonCard";
import { mockGames } from "@/lib/mock-data";
import { useAuth } from "@/contexts/AuthContext";
import { SearchFilters, Game } from "@/types";
import { isEventExpired } from "@/lib/utils";
import { haversineDistance, formatDistance } from "@/lib/distance";
import { geocodeSearchQuery } from "@/lib/geocode";
import { ShieldCheck, SlidersHorizontal, MapPin, Navigation } from "lucide-react";
import { getCityTile } from "@/lib/city-tiles";
import Link from "next/link";

const DEFAULT_RADIUS_MILES = 50;
const EXPANDED_RADIUS_MILES = 150;

/** A game with a computed distance from the search center. */
interface GameWithDistance extends Game {
  distance: number | null; // null = no proximity search active
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const { user, hasAccess, userProfile, updateUserProfile } = useAuth();
  const prefsApplied = useRef(false);

  // Proximity search state
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [geocodedLabel, setGeocodedLabel] = useState<string>("");
  const [geocoding, setGeocoding] = useState(false);
  const [searchRadius, setSearchRadius] = useState(DEFAULT_RADIUS_MILES);
  const lastGeocodedQuery = useRef<string>("");

  const [filters, setFilters] = useState<SearchFilters>({
    daysOfWeek: [],
    gameStyle: "american",
    dropInFriendly: null,
    skillLevel: "all",
    type: "all",
    dateFrom: null,
    dateTo: null,
  });

  // Auto-set filters from user profile preferences (once on load)
  useEffect(() => {
    if (prefsApplied.current || !userProfile) return;
    const newFilters = { ...filters };
    let changed = false;
    if (userProfile.gameStylePreference && userProfile.gameStylePreference !== "any") {
      newFilters.gameStyle = userProfile.gameStylePreference;
      changed = true;
    }
    if (userProfile.skillLevel) {
      newFilters.skillLevel = userProfile.skillLevel;
      changed = true;
    }
    if (changed) {
      setFilters(newFilters);
    }
    prefsApplied.current = true;
  }, [userProfile]);

  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  // Scroll to the selected game card when a map pin is clicked
  useEffect(() => {
    if (!selectedGameId) return;
    const el = document.querySelector(`[data-game-id="${selectedGameId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedGameId]);

  function toggleCalendarEvent(gameId: string) {
    if (!userProfile || !user) return;
    const saved = userProfile.savedEvents || [];
    if (saved.includes(gameId)) {
      updateUserProfile({ savedEvents: saved.filter((id) => id !== gameId) });
    } else {
      updateUserProfile({ savedEvents: [...saved, gameId] });
    }
  }

  // Geocode the search query into lat/lng
  const geocodeQuery = useCallback(async (q: string, lat?: string | null, lng?: string | null) => {
    // If lat/lng are provided directly (from "Use My Location"), use them
    if (lat && lng) {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        setSearchCenter({ lat: parsedLat, lng: parsedLng });
        setGeocodedLabel(q || "Your Location");
        setSearchRadius(DEFAULT_RADIUS_MILES);
        return;
      }
    }

    // Skip if same query was already geocoded
    if (q === lastGeocodedQuery.current) return;
    lastGeocodedQuery.current = q;

    if (!q) {
      setSearchCenter(null);
      setGeocodedLabel("");
      return;
    }

    setGeocoding(true);
    const result = await geocodeSearchQuery(q);
    setGeocoding(false);

    if (result) {
      setSearchCenter({ lat: result.lat, lng: result.lng });
      setGeocodedLabel(q);
      setSearchRadius(DEFAULT_RADIUS_MILES);
    } else {
      // Geocoding failed — fall back to text-based search
      setSearchCenter(null);
      setGeocodedLabel("");
    }
  }, []);

  // Trigger geocoding when search params change
  useEffect(() => {
    geocodeQuery(query, latParam, lngParam);
  }, [query, latParam, lngParam, geocodeQuery]);

  // All active, non-expired games
  const activeGames = useMemo(() => {
    return mockGames.filter((g) => g.status === "active" && !isEventExpired(g));
  }, []);

  // Calculate distances and apply filters
  const filteredGames: GameWithDistance[] = useMemo(() => {
    let games: GameWithDistance[] = activeGames.map((g) => {
      let distance: number | null = null;
      if (searchCenter && g.geopoint.lat !== 0 && g.geopoint.lng !== 0) {
        distance = haversineDistance(
          searchCenter.lat,
          searchCenter.lng,
          g.geopoint.lat,
          g.geopoint.lng
        );
      }
      return { ...g, distance };
    });

    // Proximity filter: when we have a search center, filter by radius
    if (searchCenter) {
      games = games.filter((g) => {
        if (g.distance === null) {
          // No coordinates — include but they'll sort to end
          return true;
        }
        return g.distance <= searchRadius;
      });
    } else if (query) {
      // Fallback: text-based search if geocoding failed
      const q = query.toLowerCase();
      games = games.filter(
        (g) =>
          (g.city || "").toLowerCase().includes(q) ||
          (g.state || "").toLowerCase().includes(q) ||
          (g.name || "").toLowerCase().includes(q) ||
          (g.organizerName || "").toLowerCase().includes(q) ||
          (g.generalArea || "").toLowerCase().includes(q)
      );
    }

    // Apply existing filters
    if (filters.daysOfWeek.length > 0) {
      games = games.filter(
        (g) =>
          g.isRecurring &&
          g.recurringSchedule &&
          filters.daysOfWeek.includes(g.recurringSchedule.dayOfWeek)
      );
    }

    if (filters.gameStyle !== "all") {
      games = games.filter((g) => g.gameStyle === filters.gameStyle);
    }

    if (filters.dropInFriendly !== null) {
      games = games.filter((g) => g.dropInFriendly === filters.dropInFriendly);
    }

    if (filters.skillLevel !== "all") {
      games = games.filter((g) => g.skillLevels.includes(filters.skillLevel as "beginner" | "intermediate" | "advanced"));
    }

    if (filters.type !== "all") {
      games = games.filter((g) => g.type === filters.type);
    }

    // Sort: if proximity search is active, sort by distance (nearest first)
    // Promoted and verified items get a mild boost but distance is primary
    if (searchCenter) {
      games.sort((a, b) => {
        // Promoted games float to top of nearby results
        if (a.promoted !== b.promoted) return a.promoted ? -1 : 1;
        // Then sort by distance
        const distA = a.distance ?? 99999;
        const distB = b.distance ?? 99999;
        return distA - distB;
      });
    } else {
      // No proximity — original sort (promoted → verified)
      games.sort((a, b) => {
        if (a.promoted !== b.promoted) return a.promoted ? -1 : 1;
        if (a.verified !== b.verified) return a.verified ? -1 : 1;
        return 0;
      });
    }

    return games;
  }, [activeGames, searchCenter, searchRadius, query, filters]);

  // Find the closest game (for the "no results" message)
  const closestGame = useMemo(() => {
    if (!searchCenter || filteredGames.length > 0) return null;
    // Search across ALL active games (ignoring radius)
    let closest: GameWithDistance | null = null;
    let minDist = Infinity;
    for (const g of activeGames) {
      if (g.geopoint.lat === 0 && g.geopoint.lng === 0) continue;
      const dist = haversineDistance(
        searchCenter.lat,
        searchCenter.lng,
        g.geopoint.lat,
        g.geopoint.lng
      );
      if (dist < minDist) {
        minDist = dist;
        closest = { ...g, distance: dist };
      }
    }
    return closest;
  }, [searchCenter, filteredGames.length, activeGames]);

  const handleExpandRadius = () => {
    setSearchRadius(EXPANDED_RADIUS_MILES);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Search Bar */}
      <div className="mb-4 bg-skyblue-50 rounded-xl p-4 -mx-4 sm:mx-0">
        <SearchBar defaultValue={query} />
      </div>

      {/* Filters */}
      <div className="mb-4">
        <SearchFiltersBar filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Proximity info badge */}
      {searchCenter && (
        <div className="flex items-center gap-2 mb-3 text-sm text-slate-500">
          <Navigation className="w-3.5 h-3.5 text-blue-500" />
          <span>
            Showing games within <strong>{searchRadius} miles</strong> of{" "}
            <strong>{geocodedLabel || "your location"}</strong>
          </span>
          {searchRadius === DEFAULT_RADIUS_MILES && (
            <button
              onClick={handleExpandRadius}
              className="text-hotpink-500 hover:text-hotpink-700 font-medium ml-1"
            >
              Expand to {EXPANDED_RADIUS_MILES} mi
            </button>
          )}
        </div>
      )}

      {/* Results Header */}
      {(() => {
        const cities = new Set(filteredGames.map((g) => g.city));
        const matchedCity = cities.size === 1 ? [...cities][0] : null;
        const cityTile = matchedCity ? getCityTile(matchedCity) : null;

        return (
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-semibold text-lg text-charcoal flex items-center gap-2">
              {cityTile && (
                <img src={cityTile} alt={`${matchedCity} tile`} className="h-10 w-auto" />
              )}
              {geocoding ? (
                <span className="text-slate-400">Searching...</span>
              ) : query ? (
                <>
                  <span className="text-hotpink-500">{filteredGames.length}</span> mahjong game{filteredGames.length !== 1 ? "s" : ""}{" "}
                  {searchCenter ? (
                    <>near &ldquo;{geocodedLabel || query}&rdquo;</>
                  ) : (
                    <>found for &ldquo;{query}&rdquo;</>
                  )}
                </>
              ) : (
                <>
                  <span className="text-hotpink-500">{filteredGames.length}</span> mahjong games near you
                </>
              )}
            </h1>
          </div>
        );
      })()}

      {/* Map + List Split View */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Map */}
        <div className="order-1 lg:order-1 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
          <LeafletMap
            games={filteredGames}
            selectedGameId={selectedGameId}
            onPinClick={setSelectedGameId}
            hasAccess={hasAccess}
            previewCount={1}
            userHomeMetro={userProfile?.homeMetro || null}
            searchCenter={searchCenter}
          />
        </div>

        {/* Game Cards List */}
        <div className="order-2 lg:order-2 space-y-4">
          {filteredGames.length === 0 ? (
            <div className="card-white text-center py-16 px-6">
              <SlidersHorizontal className="w-12 h-12 text-hotpink-300 mx-auto mb-4" />
              <h3 className="font-semibold text-lg text-charcoal mb-2">
                No games found{geocodedLabel ? ` near ${geocodedLabel}` : ""}
              </h3>

              {/* Show closest game suggestion */}
              {closestGame ? (
                <div className="mb-4">
                  <p className="text-slate-500 text-sm mb-3">
                    The closest game is <strong>{formatDistance(closestGame.distance!)}</strong> in{" "}
                    <strong>{closestGame.city}, {closestGame.state}</strong>.
                  </p>
                  <button
                    onClick={handleExpandRadius}
                    className="inline-block bg-hotpink-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-hotpink-600 transition-all shadow-lg text-sm"
                  >
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Expand search to {EXPANDED_RADIUS_MILES} miles
                  </button>
                </div>
              ) : (
                <p className="text-slate-500 text-sm mb-4">
                  Try adjusting your search or filters to find more games.
                </p>
              )}

              <Link href="/" className="text-hotpink-500 hover:text-hotpink-700 font-medium text-sm">
                Back to Home
              </Link>
            </div>
          ) : (
            <>
              {filteredGames.map((game, index) => {
                const isSelected = selectedGameId === game.id;
                const selectedClass = isSelected ? "ring-2 ring-hotpink-500 rounded-2xl" : "";
                const distText = game.distance !== null ? formatDistance(game.distance) : null;

                // Show first card as a preview for users without access
                if (!hasAccess && index === 0) {
                  return (
                    <div key={game.id} data-game-id={game.id} className={`animate-fade-in-up stagger-${index + 1} ${selectedClass}`}>
                      <GameCard
                        game={game}
                        isTeaser={true}
                        userSkillLevel={userProfile?.skillLevel}
                        index={index}
                        distanceText={distText}
                      />
                    </div>
                  );
                }

                // Blur all other cards for users without access
                if (!hasAccess && index >= 1) {
                  return (
                    <div key={game.id} data-game-id={game.id} className={`animate-fade-in-up stagger-${Math.min(index + 1, 5)} ${selectedClass}`}>
                      <GameCard
                        game={game}
                        blurred={true}
                        userSkillLevel={userProfile?.skillLevel}
                        index={index}
                        distanceText={distText}
                      />
                    </div>
                  );
                }

                return (
                  <div key={game.id} data-game-id={game.id} className={`animate-fade-in-up stagger-${Math.min(index + 1, 5)} ${selectedClass}`}>
                    <GameCard
                      game={game}
                      userSkillLevel={userProfile?.skillLevel}
                      onCalendarToggle={user ? toggleCalendarEvent : undefined}
                      isOnCalendar={(userProfile?.savedEvents || []).includes(game.id)}
                      index={index}
                      distanceText={distText}
                    />
                  </div>
                );
              })}

              {/* Signup / Subscribe CTA */}
              {!hasAccess && filteredGames.length > 1 && (
                <div className="card-white p-8 text-center">
                  <ShieldCheck className="w-10 h-10 text-hotpink-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-xl text-charcoal mb-2">
                    Unlock all {filteredGames.length} games
                  </h3>
                  <p className="text-slate-500 mb-4 text-sm">
                    Subscribe to see full details, contact info, and directions for every game.
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-block bg-hotpink-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-all shadow-lg"
                  >
                    View Plans
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-[400px] rounded-xl animate-shimmer" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
