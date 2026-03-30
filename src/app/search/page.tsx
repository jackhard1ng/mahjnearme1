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
import { getEventTiming, computePriorityScore, EventTiming } from "@/lib/event-timing";
import { ShieldCheck, SlidersHorizontal, MapPin, Navigation } from "lucide-react";
import { getCityTile } from "@/lib/city-tiles";
import Link from "next/link";

const DEFAULT_RADIUS_MILES = 50;
const EXPANDED_RADIUS_MILES = 150;

/** A game enriched with distance and timing data for search results. */
interface RankedGame extends Game {
  distance: number | null;
  timing: EventTiming;
  priorityScore: number;
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
  const [visibleCount, setVisibleCount] = useState(20);

  // Scroll to the selected game card when a map pin is clicked
  useEffect(() => {
    if (!selectedGameId) return;

    // If the selected game isn't visible yet (pagination), expand to show it
    const selectedIndex = filteredGames.findIndex((g) => g.id === selectedGameId);
    if (selectedIndex >= 0 && selectedIndex >= visibleCount) {
      setVisibleCount(selectedIndex + 5); // show a few extra past the selected one
    }

    // Wait a tick for the DOM to update, then scroll
    setTimeout(() => {
      const el = document.querySelector(`[data-game-id="${selectedGameId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
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
      setSearchCenter(null);
      setGeocodedLabel("");
    }
  }, []);

  // Trigger geocoding when search params change
  useEffect(() => {
    geocodeQuery(query, latParam, lngParam);
    setVisibleCount(20);
  }, [query, latParam, lngParam, geocodeQuery]);

  // All active, non-expired games
  const activeGames = useMemo(() => {
    return mockGames.filter((g) => g.status === "active" && !isEventExpired(g));
  }, []);

  // Calculate distances, timing, and apply filters + ranking
  const filteredGames: RankedGame[] = useMemo(() => {
    const now = new Date();

    let games: RankedGame[] = activeGames.map((g) => {
      let distance: number | null = null;
      if (searchCenter && g.geopoint.lat !== 0 && g.geopoint.lng !== 0) {
        distance = haversineDistance(
          searchCenter.lat, searchCenter.lng,
          g.geopoint.lat, g.geopoint.lng
        );
      }
      const timing = getEventTiming(g, now);
      const priorityScore = computePriorityScore(timing, distance, g);
      return { ...g, distance, timing, priorityScore };
    });

    // Proximity filter
    if (searchCenter) {
      games = games.filter((g) => g.distance === null || g.distance <= searchRadius);
    } else if (query) {
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
    if (filters.type === "tournament") {
      const tournamentKw = ["tournament", "championship", "classic", "derby", "mania"];
      games = games.filter((g) => {
        if (g.type !== "event") return false;
        const text = (g.name + " " + (g.description || "")).toLowerCase();
        return tournamentKw.some((k) => text.includes(k));
      });
    } else if (filters.type !== "all") {
      games = games.filter((g) => g.type === filters.type);
    }

    // Date filter: show games happening within the selected date range
    if (filters.dateFrom || filters.dateTo) {
      const from = filters.dateFrom ? new Date(filters.dateFrom + "T00:00:00") : null;
      const to = filters.dateTo ? new Date(filters.dateTo + "T23:59:59") : null;

      games = games.filter((g) => {
        // One-time events: check if eventDate is in range
        if (!g.isRecurring && g.eventDate) {
          const eventDate = new Date(g.eventDate + "T00:00:00");
          if (from && eventDate < from) return false;
          if (to && eventDate > to) return false;
          return true;
        }

        // Recurring events: check if any occurrence falls in range
        if (g.isRecurring && g.recurringSchedule?.dayOfWeek) {
          const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
          const days = g.recurringSchedule.dayOfWeek.split("|").map(d => d.trim());
          const targetDayNums = days.map(d => dayNames.indexOf(d)).filter(n => n >= 0);
          if (targetDayNums.length === 0) return true; // no valid day, include it

          // Check if any matching day falls within the date range
          const start = from || new Date();
          const end = to || new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000); // default 30 days out
          const check = new Date(start);
          while (check <= end) {
            if (targetDayNums.includes(check.getDay())) return true;
            check.setDate(check.getDate() + 1);
          }
          return false;
        }

        // No date info — include by default
        return true;
      });
    }

    // City-match boost: games in the exact searched city rank above nearby cities
    if (query) {
      // Strip state abbreviations and common suffixes to extract the city name
      const qCleaned = query.toLowerCase().replace(/[,]/g, "").trim()
        .replace(/\b[a-z]{2}$/i, "").trim(); // remove trailing 2-letter state abbr
      if (qCleaned) {
        for (const g of games) {
          const cityLower = (g.city || "").toLowerCase();
          if (cityLower === qCleaned) {
            g.priorityScore -= 20; // significant boost (lower = higher priority)
          }
        }
      }
    }

    // Sort by combined priority score (promoted items get a bonus)
    games.sort((a, b) => {
      if (a.promoted !== b.promoted) return a.promoted ? -1 : 1;
      return a.priorityScore - b.priorityScore;
    });

    return games;
  }, [activeGames, searchCenter, searchRadius, query, filters]);

  // Count games happening this week (for the subscribe CTA)
  const gamesThisWeek = useMemo(() => {
    return filteredGames.filter((g) => g.timing.tier <= 4).length;
  }, [filteredGames]);

  // Find the closest game (for the "no results" message)
  const closestGame = useMemo(() => {
    if (!searchCenter || filteredGames.length > 0) return null;
    let closest: RankedGame | null = null;
    let minDist = Infinity;
    const now = new Date();
    for (const g of activeGames) {
      if (g.geopoint.lat === 0 && g.geopoint.lng === 0) continue;
      const dist = haversineDistance(searchCenter.lat, searchCenter.lng, g.geopoint.lat, g.geopoint.lng);
      if (dist < minDist) {
        minDist = dist;
        const timing = getEventTiming(g, now);
        closest = { ...g, distance: dist, timing, priorityScore: computePriorityScore(timing, dist) };
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
              <span className="mx-2 text-slate-300">|</span>
              <Link href="/contact" className="text-hotpink-500 hover:text-hotpink-700 font-medium text-sm">
                Contact Us
              </Link>
            </div>
          ) : (
            <>
              {filteredGames.slice(0, visibleCount).map((game, index) => {
                const isSelected = selectedGameId === game.id;
                const selectedClass = isSelected ? "ring-2 ring-hotpink-500 rounded-2xl" : "";
                const distText = game.distance !== null ? formatDistance(game.distance) : null;

                // Subscriber: full access to everything
                if (hasAccess) {
                  return (
                    <div key={game.id} data-game-id={game.id} className={`animate-fade-in-up stagger-${Math.min(index + 1, 5)} ${selectedClass}`}>
                      <GameCard
                        game={game}
                        userSkillLevel={userProfile?.skillLevel}
                        onCalendarToggle={user ? toggleCalendarEvent : undefined}
                        isOnCalendar={(userProfile?.savedEvents || []).includes(game.id)}
                        index={index}
                        distanceText={distText}
                        timingLabel={game.timing.label}
                        timingBadge={game.timing.badge}
                        timingBadgeColor={game.timing.badgeColor}
                      />
                    </div>
                  );
                }

                // Non-subscriber: 2 full cards, 3 teasers, then locked
                if (index < 2) {
                  // Full detail cards (first 2)
                  return (
                    <div key={game.id} data-game-id={game.id} className={`animate-fade-in-up stagger-${index + 1} ${selectedClass}`}>
                      <GameCard
                        game={game}
                        userSkillLevel={userProfile?.skillLevel}
                        index={index}
                        distanceText={distText}
                        timingLabel={game.timing.label}
                        timingBadge={game.timing.badge}
                        timingBadgeColor={game.timing.badgeColor}
                      />
                    </div>
                  );
                }

                if (index < 5) {
                  // Teaser cards (3-5): type/day/time/style visible, venue blurred
                  return (
                    <div key={game.id} data-game-id={game.id} className={`animate-fade-in-up stagger-${Math.min(index + 1, 5)} ${selectedClass}`}>
                      <GameCard
                        game={game}
                        isTeaser={true}
                        userSkillLevel={userProfile?.skillLevel}
                        index={index}
                        distanceText={distText}
                        timingLabel={game.timing.label}
                        timingBadge={game.timing.badge}
                        timingBadgeColor={game.timing.badgeColor}
                      />
                    </div>
                  );
                }

                // Locked cards (6+): minimal info only
                return (
                  <div key={game.id} data-game-id={game.id} className={`animate-fade-in-up stagger-5 ${selectedClass}`}>
                    <GameCard
                      game={game}
                      blurred={true}
                      userSkillLevel={userProfile?.skillLevel}
                      index={index}
                      distanceText={distText}
                      timingLabel={game.timing.label}
                      timingBadge={game.timing.badge}
                      timingBadgeColor={game.timing.badgeColor}
                    />
                  </div>
                );
              })}

              {/* Load More */}
              {visibleCount < filteredGames.length && (
                <button
                  onClick={() => setVisibleCount((prev) => prev + 20)}
                  className="w-full py-3 text-sm font-semibold text-hotpink-500 bg-white border-2 border-hotpink-200 rounded-xl hover:bg-hotpink-50 transition-colors"
                >
                  Load more ({filteredGames.length - visibleCount} remaining)
                </button>
              )}

              {/* Signup / Subscribe CTA */}
              {!hasAccess && filteredGames.length > 1 && (
                <div className="card-white p-8 text-center">
                  <ShieldCheck className="w-10 h-10 text-hotpink-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-xl text-charcoal mb-2">
                    Unlock all {filteredGames.length} games
                  </h3>
                  <p className="text-slate-500 mb-4 text-sm">
                    {gamesThisWeek > 0
                      ? `${gamesThisWeek} game${gamesThisWeek !== 1 ? "s" : ""} happening this week near you. Subscribe to see full details, contact info, and directions.`
                      : "Subscribe to see full details, contact info, and directions for every game."
                    }
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
