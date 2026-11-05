"use client";

import { useState, useEffect } from "react";
import { Game } from "@/types";
import { mockGames } from "@/lib/mock-data";

// Module-level cache shared across all hook instances (single fetch per session)
let _cache: Game[] | null = null;
let _fetching = false;
let _listeners: ((games: Game[]) => void)[] = [];

// The same, for the admin variant that also wants inactive and pending
// listings. Kept as a separate cache rather than a flag on the one above:
// with a single cache, whichever surface mounted first would decide what
// every other surface saw for the rest of the session — an admin landing on
// a public page first would lose the inactive rows, and a visitor who passed
// through an admin route would be handed 922 listings the site never shows.
let _cacheAll: Game[] | null = null;
let _fetchingAll = false;
let _listenersAll: ((games: Game[]) => void)[] = [];

function fetchListings(includeInactive = false) {
  if (includeInactive) {
    if (_cacheAll !== null || _fetchingAll) return;
    _fetchingAll = true;
  } else {
    if (_cache !== null || _fetching) return;
    _fetching = true;
  }

  const settle = (games: Game[]) => {
    if (includeInactive) {
      _cacheAll = games;
      _fetchingAll = false;
      _listenersAll.forEach((cb) => cb(games));
      _listenersAll = [];
    } else {
      _cache = games;
      _fetching = false;
      _listeners.forEach((cb) => cb(games));
      _listeners = [];
    }
  };

  // The admin variant bypasses the HTTP cache: it is read right after a write
  // by the screen that made it, and the shared cache would otherwise hand back
  // the pre-save body. The public variant keeps its CDN caching.
  fetch(
    includeInactive ? "/api/listings?status=all" : "/api/listings",
    includeInactive ? { cache: "no-store" } : undefined
  )
    .then((r) => r.json())
    .then((data) => {
      settle(data.listings && data.listings.length > 0 ? (data.listings as Game[]) : mockGames);
    })
    .catch(() => settle(mockGames));
}

/**
 * Hook that returns all listings from Firestore via /api/listings.
 * Starts with mockGames for immediate render (no loading flash),
 * then updates with live Firestore data once loaded.
 * Includes new organizer-submitted events that don't exist in the static JSON.
 *
 * Returns active listings only. Admin screens that need to see inactive and
 * pending rows pass `true`; nothing public should.
 */
export function useFirestoreListings(includeInactive = false): Game[] {
  const [games, setGames] = useState<Game[]>(mockGames);

  useEffect(() => {
    const cached = includeInactive ? _cacheAll : _cache;
    if (cached !== null) {
      setGames(cached);
      return;
    }

    fetchListings(includeInactive);
    const listener = (games: Game[]) => setGames(games);
    if (includeInactive) _listenersAll.push(listener);
    else _listeners.push(listener);

    return () => {
      if (includeInactive) _listenersAll = _listenersAll.filter((l) => l !== listener);
      else _listeners = _listeners.filter((l) => l !== listener);
    };
  }, [includeInactive]);

  return games;
}

/**
 * Same as `useFirestoreListings` but also returns a `loading` flag that
 * stays true until the Firestore fetch has returned. Detail pages need
 * this so they can show a loading state instead of rendering `notFound()`
 * while the merged Firestore+JSON list is still arriving.
 */
export function useFirestoreListingsWithStatus(): { games: Game[]; loading: boolean } {
  const [games, setGames] = useState<Game[]>(() => _cache ?? mockGames);
  const [loading, setLoading] = useState<boolean>(_cache === null);

  useEffect(() => {
    if (_cache !== null) {
      setGames(_cache);
      setLoading(false);
      return;
    }

    fetchListings();
    const listener = (games: Game[]) => {
      setGames(games);
      setLoading(false);
    };
    _listeners.push(listener);

    return () => {
      _listeners = _listeners.filter((l) => l !== listener);
    };
  }, []);

  return { games, loading };
}
