"use client";

import { useEffect, useRef, useState } from "react";
import { Game } from "@/types";
import { getMapPinColor, getGameTypeLabel, slugify } from "@/lib/utils";
import { haversineDistance, formatDistance } from "@/lib/distance";
import { getEventTiming, getUrgencyPinColor } from "@/lib/event-timing";

// We import Leaflet types only. Actual library loaded dynamically.
import type L from "leaflet";

interface LeafletMapProps {
  games: Game[];
  selectedGameId?: string | null;
  onPinClick?: (gameId: string) => void;
  hasAccess?: boolean;
  previewCount?: number;
  userHomeMetro?: string | null;
  searchCenter?: { lat: number; lng: number } | null;
}

// US center as default view
const US_CENTER: [number, number] = [39.8283, -98.5795];
const DEFAULT_ZOOM = 4;

function createPinIcon(color: string, isSelected: boolean, isLocked: boolean): L.DivIcon | null {
  if (typeof window === "undefined") return null;
  const L = require("leaflet") as typeof import("leaflet");

  const size = isSelected ? 32 : isLocked ? 20 : 24;
  const border = isSelected ? "3px solid #fff" : "2px solid #fff";
  const opacity = isLocked ? 0.5 : 1;
  const pinColor = isLocked ? "#9CA3AF" : color; // gray-400 for locked
  const shadow = isSelected
    ? "0 0 0 3px rgba(255,20,147,0.5), 0 2px 8px rgba(0,0,0,0.3)"
    : "0 2px 6px rgba(0,0,0,0.3)";

  return L.divIcon({
    className: "custom-map-pin",
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${pinColor};
      border: ${border};
      border-radius: 50%;
      box-shadow: ${shadow};
      opacity: ${opacity};
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
      cursor: pointer;
    ">
      <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export default function LeafletMap({ games, selectedGameId, onPinClick, hasAccess = true, previewCount = 1, userHomeMetro, searchCenter = null }: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // Filter to games that have real coordinates
  const geoGames = games.filter((g) => g.geopoint.lat !== 0 || g.geopoint.lng !== 0);
  const hasGeoGames = geoGames.length > 0;

  // Initialize map
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const L = require("leaflet") as typeof import("leaflet");

    // Fix default marker icon paths
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    if (mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView(US_CENTER, DEFAULT_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
      setReady(false);
    };
  }, []);

  // Update markers when games or selection changes
  useEffect(() => {
    if (!ready || !mapRef.current || !markersRef.current) return;

    const L = require("leaflet") as typeof import("leaflet");
    const markers = markersRef.current;
    markers.clearLayers();

    if (!hasGeoGames) return;

    const bounds = L.latLngBounds([]);

    const now = new Date();

    geoGames.forEach((game, index) => {
      const isSelected = selectedGameId === game.id;
      // Use urgency color for today/happening-now events, else default type color
      const timing = getEventTiming(game, now);
      const urgencyColor = getUrgencyPinColor(timing.tier);
      const color = urgencyColor || getMapPinColor(game.type);

      // Determine if this pin is in the user's home metro (for free users)
      const isHomeMetroPin = !userHomeMetro || isGameInMetro(game, userHomeMetro);
      const isLocked = !hasAccess && !isHomeMetroPin && index >= previewCount;

      const icon = createPinIcon(color, isSelected, isLocked);
      if (!icon) return;

      const marker = L.marker([game.geopoint.lat, game.geopoint.lng], { icon })
        .on("click", () => {
          marker.openPopup();
          if (!isLocked) {
            onPinClick?.(game.id);
          }
        });

      // Popup content differs based on access
      const typeLabel = getGameTypeLabel(game.type);
      const canSeeDetails = hasAccess || (isHomeMetroPin && index < previewCount) || index === 0;

      const gameUrl = `/games/${slugify(game.city + "-" + game.state)}/${slugify(game.name)}`;

      let popupContent: string;

      // Distance and timing lines for popup
      const distLine = searchCenter && game.geopoint.lat !== 0
        ? `<span style="color: #FF1493; font-size: 11px; font-weight: 600;">${formatDistance(haversineDistance(searchCenter.lat, searchCenter.lng, game.geopoint.lat, game.geopoint.lng))}</span><br/>`
        : "";
      const timingLine = timing.label && timing.label !== "Schedule TBD"
        ? `<span style="color: #D97706; font-size: 11px; font-weight: 600;">${timing.badge ? timing.badge + " — " : ""}${timing.label}</span><br/>`
        : "";

      if (canSeeDetails) {
        popupContent = `<div style="font-family: system-ui, sans-serif; min-width: 180px;">
            <strong style="font-size: 14px; color: #1a1a2e;">${game.name}</strong><br/>
            <span style="color: #64748b; font-size: 12px;">${typeLabel}</span><br/>
            <span style="color: #64748b; font-size: 12px;">${game.venueName || game.address}</span><br/>
            ${timingLine}${distLine}
            <a href="${gameUrl}" style="color: #FF1493; font-size: 12px; font-weight: 600; text-decoration: none; margin-top: 4px; display: inline-block;">View Details &rarr;</a>
          </div>`;
      } else if (isLocked) {
        popupContent = `<div style="font-family: system-ui, sans-serif; min-width: 180px;">
            <strong style="font-size: 14px; color: #1a1a2e;">Upgrade to see games in ${game.city}</strong><br/>
            <span style="color: #64748b; font-size: 12px;">${typeLabel} in ${game.city}, ${game.state}</span><br/>
            <a href="/pricing" style="color: #FF1493; font-size: 12px; font-weight: 600; text-decoration: none; margin-top: 4px; display: inline-block;">View Plans &rarr;</a>
          </div>`;
      } else {
        popupContent = `<div style="font-family: system-ui, sans-serif; min-width: 180px;">
            <strong style="font-size: 14px; color: #1a1a2e;">${typeLabel}</strong><br/>
            <span style="color: #64748b; font-size: 12px;">${game.city}, ${game.state}</span><br/>
            ${distLine}
            <a href="/pricing" style="color: #FF1493; font-size: 12px; font-weight: 600; text-decoration: none;">Subscribe to see details &rarr;</a>
          </div>`;
      }

      marker.bindPopup(popupContent, { closeButton: false, className: "mahj-popup" });

      if (isSelected) {
        marker.openPopup();
      }

      marker.addTo(markers);
      bounds.extend([game.geopoint.lat, game.geopoint.lng]);
    });

    // Add a "You are here" marker at the search center
    if (searchCenter && searchCenter.lat !== 0 && searchCenter.lng !== 0) {
      const searchIcon = L.divIcon({
        className: "search-center-pin",
        html: `<div style="
          width: 18px; height: 18px;
          background: #3B82F6;
          border: 3px solid #fff;
          border-radius: 50%;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.4), 0 2px 6px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      L.marker([searchCenter.lat, searchCenter.lng], { icon: searchIcon, interactive: false })
        .bindPopup('<div style="font-family: system-ui; font-size: 13px; font-weight: 600; color: #3B82F6;">Your search location</div>', { closeButton: false })
        .addTo(markers);
      bounds.extend([searchCenter.lat, searchCenter.lng]);
    }

    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [geoGames.length, selectedGameId, ready, hasGeoGames, hasAccess, userHomeMetro, searchCenter]);

  return (
    <div className="rounded-xl border-2 border-softpink-300 h-full min-h-[300px] relative overflow-hidden bg-skyblue-50">
      {/* Map container */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* No-coordinates fallback message */}
      {ready && !hasGeoGames && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-skyblue-100/80">
          <div className="text-center px-6">
            <svg className="w-12 h-12 text-hotpink-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="10" r="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-charcoal font-medium text-sm">Map pins will appear once locations are geocoded</p>
            <p className="text-slate-500 text-xs mt-1">{games.length} games available. Browse the list to explore.</p>
          </div>
        </div>
      )}

      {/* Address disclaimer */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000]">
        <p className="bg-white/90 backdrop-blur-sm text-xs text-slate-500 rounded-lg px-3 py-2 text-center">
          Map pins are approximate. Always confirm the exact location with the host before attending.
        </p>
      </div>

      {/* Legend */}
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 space-y-1 z-[1000]">
        {[
          { type: "open_play", label: "Open Play" },
          { type: "lesson", label: "Lessons" },
          { type: "league", label: "League" },
          { type: "event", label: "Events" },
        ].map(({ type, label }) => (
          <div key={type} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getMapPinColor(type) }} />
            <span className="text-charcoal">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 text-xs border-t border-slate-200 pt-1 mt-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#EF4444" }} />
          <span className="text-charcoal">Today / Now</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#F59E0B" }} />
          <span className="text-charcoal">Tomorrow</span>
        </div>
        {!hasAccess && (
          <div className="flex items-center gap-2 text-xs border-t border-slate-200 pt-1 mt-1">
            <div className="w-3 h-3 rounded-full bg-gray-400 opacity-50" />
            <span className="text-slate-400">Locked</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper: check if a game is in a given metro (by abbreviation)
function isGameInMetro(game: Game, metroAbbreviation: string): boolean {
  // Import metro regions to check
  const { findMetroForCity } = require("@/lib/metro-regions");
  const metro = findMetroForCity(game.city);
  return metro?.abbreviation === metroAbbreviation;
}
