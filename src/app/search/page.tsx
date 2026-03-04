"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import SearchFiltersBar from "@/components/SearchFilters";
import GameCard from "@/components/GameCard";
import MapPlaceholder from "@/components/MapPlaceholder";
import SkeletonCard from "@/components/SkeletonCard";
import { mockGames } from "@/lib/mock-data";
import { useAuth } from "@/contexts/AuthContext";
import { SearchFilters, Game } from "@/types";
import { ShieldCheck, SlidersHorizontal } from "lucide-react";
import { getCityTile } from "@/lib/city-tiles";
import Link from "next/link";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const { user, hasAccess, userProfile, updateUserProfile } = useAuth();
  const prefsApplied = useRef(false);

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

  function toggleCalendarEvent(gameId: string) {
    if (!userProfile || !user) return;
    const saved = userProfile.savedEvents || [];
    if (saved.includes(gameId)) {
      updateUserProfile({ savedEvents: saved.filter((id) => id !== gameId) });
    } else {
      updateUserProfile({ savedEvents: [...saved, gameId] });
    }
  }

  const filteredGames = useMemo(() => {
    let games = mockGames.filter((g) => g.status === "active");

    if (query) {
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

    games.sort((a, b) => {
      if (a.promoted !== b.promoted) return a.promoted ? -1 : 1;
      if (a.verified !== b.verified) return a.verified ? -1 : 1;
      return 0;
    });

    return games;
  }, [query, filters]);

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

      {/* Results Header */}
      {(() => {
        // Detect city for tile: if all results share a city, or query matches a city name
        const cities = new Set(filteredGames.map((g) => g.city));
        const matchedCity = cities.size === 1 ? [...cities][0] : null;
        const cityTile = matchedCity ? getCityTile(matchedCity) : null;

        return (
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-semibold text-lg text-charcoal flex items-center gap-2">
              {cityTile && (
                <img src={cityTile} alt={`${matchedCity} tile`} className="h-10 w-auto" />
              )}
              {query ? (
                <>
                  <span className="text-hotpink-500">{filteredGames.length}</span> mahjong game{filteredGames.length !== 1 ? "s" : ""}{" "}
                  {query && <>found for &ldquo;{query}&rdquo;</>}
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
          <MapPlaceholder
            games={filteredGames}
            selectedGameId={selectedGameId}
            onPinClick={setSelectedGameId}
          />
        </div>

        {/* Game Cards List */}
        <div className="order-2 lg:order-2 space-y-4">
          {filteredGames.length === 0 ? (
            <div className="card-white text-center py-16 px-6">
              <SlidersHorizontal className="w-12 h-12 text-hotpink-300 mx-auto mb-4" />
              <h3 className="font-semibold text-lg text-charcoal mb-2">No games found</h3>
              <p className="text-slate-500 text-sm mb-4">
                Try adjusting your search or filters to find more games.
              </p>
              <Link href="/" className="text-hotpink-500 hover:text-hotpink-700 font-medium text-sm">
                Back to Home
              </Link>
            </div>
          ) : (
            <>
              {filteredGames.map((game, index) => {
                // Show first card as a preview for users without access
                if (!hasAccess && index === 0) {
                  return (
                    <div key={game.id} className={`animate-fade-in-up stagger-${index + 1}`}>
                      <GameCard
                        game={game}
                        isTeaser={true}
                        userSkillLevel={userProfile?.skillLevel}
                        index={index}
                      />
                    </div>
                  );
                }

                // Blur all other cards for users without access
                if (!hasAccess && index >= 1) {
                  return (
                    <div key={game.id} className={`animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}>
                      <GameCard
                        game={game}
                        blurred={true}
                        userSkillLevel={userProfile?.skillLevel}
                        index={index}
                      />
                    </div>
                  );
                }

                return (
                  <div key={game.id} className={`animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}>
                    <GameCard
                      game={game}
                      userSkillLevel={userProfile?.skillLevel}
                      onCalendarToggle={user ? toggleCalendarEvent : undefined}
                      isOnCalendar={(userProfile?.savedEvents || []).includes(game.id)}
                      index={index}
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
