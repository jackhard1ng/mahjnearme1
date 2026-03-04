"use client";

import { useEffect, useRef, useState } from "react";
import { Game } from "@/types";
import { getMapPinColor, getGameTypeLabel } from "@/lib/utils";

// We import Leaflet types only — actual library loaded dynamically
import type L from "leaflet";

interface LeafletMapProps {
  games: Game[];
  selectedGameId?: string | null;
  onPinClick?: (gameId: string) => void;
}

// US center as default view
const US_CENTER: [number, number] = [39.8283, -98.5795];
const DEFAULT_ZOOM = 4;

function createPinIcon(color: string, isSelected: boolean): L.DivIcon | null {
  if (typeof window === "undefined") return null;
  const L = require("leaflet") as typeof import("leaflet");

  const size = isSelected ? 32 : 24;
  const border = isSelected ? "3px solid #fff" : "2px solid #fff";
  const shadow = isSelected
    ? "0 0 0 3px rgba(255,20,147,0.5), 0 2px 8px rgba(0,0,0,0.3)"
    : "0 2px 6px rgba(0,0,0,0.3)";

  return L.divIcon({
    className: "custom-map-pin",
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border: ${border};
      border-radius: 50%;
      box-shadow: ${shadow};
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

export default function LeafletMap({ games, selectedGameId, onPinClick }: LeafletMapProps) {
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

    geoGames.forEach((game) => {
      const isSelected = selectedGameId === game.id;
      const color = getMapPinColor(game.type);
      const icon = createPinIcon(color, isSelected);
      if (!icon) return;

      const marker = L.marker([game.geopoint.lat, game.geopoint.lng], { icon })
        .on("click", () => onPinClick?.(game.id));

      // Popup
      const typeLabel = getGameTypeLabel(game.type);
      marker.bindPopup(
        `<div style="font-family: system-ui, sans-serif; min-width: 180px;">
          <strong style="font-size: 14px; color: #1a1a2e;">${game.name}</strong><br/>
          <span style="color: #64748b; font-size: 12px;">${typeLabel}</span><br/>
          <span style="color: #64748b; font-size: 12px;">${game.venueName || game.address}</span>
        </div>`,
        { closeButton: false, className: "mahj-popup" }
      );

      if (isSelected) {
        marker.openPopup();
      }

      marker.addTo(markers);
      bounds.extend([game.geopoint.lat, game.geopoint.lng]);
    });

    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [geoGames.length, selectedGameId, ready, hasGeoGames]);

  // Pan to selected game
  useEffect(() => {
    if (!ready || !mapRef.current || !selectedGameId) return;
    const game = geoGames.find((g) => g.id === selectedGameId);
    if (game) {
      mapRef.current.setView([game.geopoint.lat, game.geopoint.lng], 13, { animate: true });
    }
  }, [selectedGameId, ready]);

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
            <p className="text-slate-500 text-xs mt-1">{games.length} games available — browse the list to explore</p>
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
      </div>
    </div>
  );
}
