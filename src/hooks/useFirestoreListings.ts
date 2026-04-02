"use client";

import { useState, useEffect } from "react";
import { Game } from "@/types";
import { mockGames } from "@/lib/mock-data";

// Module-level cache shared across all hook instances (single fetch per session)
let _cache: Game[] | null = null;
let _fetching = false;
let _listeners: ((games: Game[]) => void)[] = [];

function fetchListings() {
  if (_cache !== null || _fetching) return;
  _fetching = true;
  fetch("/api/listings")
    .then((r) => r.json())
    .then((data) => {
      if (data.listings && data.listings.length > 0) {
        _cache = data.listings as Game[];
      } else {
        _cache = mockGames;
      }
      _fetching = false;
      _listeners.forEach((cb) => cb(_cache!));
      _listeners = [];
    })
    .catch(() => {
      _cache = mockGames;
      _fetching = false;
      _listeners.forEach((cb) => cb(_cache!));
      _listeners = [];
    });
}

/**
 * Hook that returns all listings from Firestore via /api/listings.
 * Starts with mockGames for immediate render (no loading flash),
 * then updates with live Firestore data once loaded.
 * Includes new organizer-submitted events that don't exist in the static JSON.
 */
export function useFirestoreListings(): Game[] {
  const [games, setGames] = useState<Game[]>(mockGames);

  useEffect(() => {
    if (_cache !== null) {
      setGames(_cache);
      return;
    }

    fetchListings();
    const listener = (games: Game[]) => setGames(games);
    _listeners.push(listener);

    return () => {
      _listeners = _listeners.filter((l) => l !== listener);
    };
  }, []);

  return games;
}
