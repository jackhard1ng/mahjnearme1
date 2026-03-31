"use client";

import { useEffect, useState, useMemo } from "react";
import { Game } from "@/types";

/**
 * Client-side listings cache.
 * Fetches from /api/listings once, caches in memory.
 * Falls back to the static JSON-loaded data if API fails.
 */

let _clientCache: Game[] | null = null;
let _fetching = false;
let _listeners: (() => void)[] = [];
let _fallbackLoaded = false;

function loadFallback(): Game[] {
  if (!_fallbackLoaded) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { loadListings } = require("@/lib/listings-data");
      _clientCache = loadListings();
      _fallbackLoaded = true;
    } catch {
      _clientCache = [];
    }
  }
  return _clientCache || [];
}

function fetchListings() {
  if (_fetching) return;
  _fetching = true;

  fetch("/api/listings")
    .then((r) => r.json())
    .then((data) => {
      if (data.listings && Array.isArray(data.listings) && data.listings.length > 0) {
        // Only replace fallback if Firestore actually has data
        _clientCache = data.listings as Game[];
        _fallbackLoaded = false;
      }
      _fetching = false;
      _listeners.forEach((cb) => cb());
      _listeners = [];
    })
    .catch(() => {
      _fetching = false;
      // Keep fallback data
      _listeners.forEach((cb) => cb());
      _listeners = [];
    });
}

/**
 * Hook that provides listings data on the client.
 * Returns the static JSON data immediately, then updates with Firestore data.
 */
export function useListings(): { games: Game[]; loading: boolean } {
  // Start with fallback data immediately (SSR-safe)
  const [games, setGames] = useState<Game[]>(() => loadFallback());
  const [loading, setLoading] = useState(!_clientCache);

  useEffect(() => {
    // If we already have fetched data, use it
    if (_clientCache && !_fallbackLoaded) {
      setGames(_clientCache);
      setLoading(false);
      return;
    }

    // Kick off fetch from API
    fetchListings();

    const listener = () => {
      if (_clientCache) {
        setGames(_clientCache);
        setLoading(false);
      }
    };
    _listeners.push(listener);

    return () => {
      _listeners = _listeners.filter((l) => l !== listener);
    };
  }, []);

  return { games, loading };
}

/**
 * Hook that returns games filtered by city and state.
 */
export function useGamesByCity(city: string, state: string): Game[] {
  const { games } = useListings();
  return useMemo(
    () =>
      games.filter(
        (g) =>
          g.city.toLowerCase() === city.toLowerCase() &&
          g.state.toUpperCase() === state.toUpperCase() &&
          g.status === "active"
      ),
    [games, city, state]
  );
}

/**
 * Hook that returns games filtered by state.
 */
export function useGamesByState(state: string): Game[] {
  const { games } = useListings();
  return useMemo(
    () =>
      games.filter(
        (g) => g.state.toUpperCase() === state.toUpperCase() && g.status === "active"
      ),
    [games, state]
  );
}

/** Clear client cache (force re-fetch on next use). */
export function clearClientListingsCache(): void {
  _clientCache = null;
  _fallbackLoaded = false;
}
