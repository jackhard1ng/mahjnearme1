"use client";

import { useEffect, useState } from "react";
import { Game } from "@/types";

interface OrganizerOverride {
  displayName: string;
  contactEmail?: string;
  website?: string;
  instagram?: string;
  facebookGroup?: string;
  featured?: boolean;
  verified?: boolean;
  photoURL?: string;
  locations?: { venueName: string; address: string; city: string; state: string; lat: number; lng: number }[];
}

let _cache: Record<string, OrganizerOverride> | null = null;
let _fetching = false;
let _listeners: (() => void)[] = [];

function fetchOverrides() {
  if (_cache || _fetching) return;
  _fetching = true;
  fetch("/api/organizers/overrides")
    .then((r) => r.json())
    .then((data) => {
      _cache = data;
      _fetching = false;
      _listeners.forEach((cb) => cb());
      _listeners = [];
    })
    .catch(() => {
      _fetching = false;
    });
}

/**
 * Apply organizer overrides to a game.
 * Matches by organizerName or listing name prefix.
 */
function applyOverride(game: Game, overrides: Record<string, OrganizerOverride>): Game {
  const orgName = (game.organizerName || "").toLowerCase().trim();
  const listingName = game.name || "";

  let prefix = "";
  if (listingName.includes(" - ")) {
    prefix = listingName.split(" - ")[0].trim().toLowerCase();
  } else if (listingName.includes(" — ")) {
    prefix = listingName.split(" — ")[0].trim().toLowerCase();
  }

  const override = overrides[orgName] || overrides[prefix] || null;
  if (!override) return game;

  return {
    ...game,
    organizerName: override.displayName || game.organizerName,
    contactName: override.displayName || game.contactName,
    contactEmail: override.contactEmail || game.contactEmail,
    website: override.website || game.website,
    instagram: override.instagram || game.instagram,
    facebookGroup: override.facebookGroup || game.facebookGroup,
    promoted: override.featured || game.promoted,
    verified: override.verified || game.verified,
    imageUrl: override.photoURL || game.imageUrl,
  };
}

/**
 * Hook that returns games with organizer overrides applied.
 * Fetches overrides once, caches them, applies to all games.
 */
export function useEnrichedGames(games: Game[]): Game[] {
  const [enriched, setEnriched] = useState(games);

  useEffect(() => {
    if (_cache) {
      setEnriched(games.map((g) => applyOverride(g, _cache!)));
      return;
    }

    fetchOverrides();
    const listener = () => {
      if (_cache) {
        setEnriched(games.map((g) => applyOverride(g, _cache!)));
      }
    };
    _listeners.push(listener);

    return () => {
      _listeners = _listeners.filter((l) => l !== listener);
    };
  }, [games]);

  return enriched;
}
