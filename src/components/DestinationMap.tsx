"use client";

import { useEffect, useRef } from "react";
import { Game } from "@/types";
import { slugify } from "@/lib/utils";
import type L from "leaflet";

const CATEGORY_COLORS: Record<string, string> = {
  retreat: "#8B5CF6",   // purple
  cruise: "#3B82F6",    // blue
  camp: "#10B981",      // green
  tournament: "#F59E0B", // amber
  other: "#FF1493",     // hotpink
};

function getEventCategory(name: string, description: string): string {
  const text = (name + " " + description).toLowerCase();
  if (text.includes("cruise")) return "cruise";
  if (text.includes("retreat") || text.includes("getaway") || text.includes("staycation")) return "retreat";
  if (text.includes("tournament") || text.includes("championship") || text.includes("classic") || text.includes("derby")) return "tournament";
  if (/\bcamp\b(?!bell|us|aign)/i.test(text) || text.includes("resort")) return "camp";
  return "other";
}

function getCategoryLabel(cat: string): string {
  const labels: Record<string, string> = { retreat: "Retreat", cruise: "Cruise", camp: "Camp / Resort", tournament: "Tournament", other: "Event" };
  return labels[cat] || "Event";
}

interface DestinationMapProps {
  games: Game[];
  hasAccess: boolean;
}

const US_CENTER: [number, number] = [39.8283, -98.5795];

export default function DestinationMap({ games, hasAccess }: DestinationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || mapRef.current) return;

    const L = require("leaflet") as typeof import("leaflet");

    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView(US_CENTER, 4);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Wait for container to be fully laid out
    setTimeout(() => {
      map.invalidateSize();
      addMarkers(L, map);
    }, 300);

    function addMarkers(L: typeof import("leaflet"), map: L.Map) {
      const bounds = L.latLngBounds([]);

      games.forEach((game) => {
        if (!game.geopoint || game.geopoint.lat === 0 && game.geopoint.lng === 0) return;

        const category = getEventCategory(game.name, game.description || "");
        const color = hasAccess ? CATEGORY_COLORS[category] : "#9CA3AF";
        const w = 14;
        const h = 20;

        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width: ${w}px; height: ${h}px;
            background: ${color};
            border: 2px solid #fff;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: pointer;
          "></div>`,
          iconSize: [w, h],
          iconAnchor: [w / 2, h],
          popupAnchor: [0, -h],
        });

        const marker = L.marker([game.geopoint.lat, game.geopoint.lng], { icon });

        if (hasAccess) {
          const gameUrl = `/games/${slugify(game.city + "-" + game.state)}/${slugify(game.name)}`;
          const catLabel = getCategoryLabel(category);
          marker.bindPopup(
            `<div style="font-family: system-ui, sans-serif; min-width: 200px;">
              <span style="display:inline-block; background:${color}; color:#fff; font-size:10px; font-weight:700; padding:1px 6px; border-radius:8px; margin-bottom:4px;">${catLabel}</span><br/>
              <strong style="font-size: 14px; color: #1a1a2e;">${game.name}</strong><br/>
              <span style="color: #64748b; font-size: 12px;">${game.city}, ${game.state}</span><br/>
              ${game.eventDate ? `<span style="color: #D97706; font-size: 11px; font-weight: 600;">${new Date(game.eventDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span><br/>` : ""}
              ${game.cost && game.cost !== "Contact for price" ? `<span style="color: #64748b; font-size: 11px;">${game.cost}</span><br/>` : ""}
              <a href="${gameUrl}" style="color: #FF1493; font-size: 12px; font-weight: 600; text-decoration: none; margin-top: 4px; display: inline-block;">View Details &rarr;</a>
            </div>`,
            { closeButton: true }
          );
        } else {
          marker.bindPopup(
            `<div style="font-family: system-ui, sans-serif; min-width: 180px;">
              <strong style="font-size: 14px; color: #1a1a2e;">Destination Event in ${game.city}</strong><br/>
              <span style="color: #64748b; font-size: 12px;">${game.city}, ${game.state}</span><br/>
              <a href="/pricing" style="color: #FF1493; font-size: 12px; font-weight: 600; text-decoration: none; margin-top: 4px; display: inline-block;">Subscribe to see details &rarr;</a>
            </div>`,
            { closeButton: true }
          );
        }

        marker.addTo(map);
        bounds.extend([game.geopoint.lat, game.geopoint.lng]);
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      }
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [games, hasAccess]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      <div style={{
        position: "absolute", top: 10, right: 10, zIndex: 1000,
        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)",
        borderRadius: 8, padding: "8px 10px", fontSize: 11,
        pointerEvents: "none",
      }}>
        {Object.entries(CATEGORY_COLORS).map(([key, color]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
            <span style={{ color: "#334155" }}>{getCategoryLabel(key)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
