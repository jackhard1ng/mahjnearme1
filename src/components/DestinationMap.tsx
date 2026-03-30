"use client";

import { useEffect, useRef } from "react";
import { Game } from "@/types";
import { slugify, getMapPinColor } from "@/lib/utils";
import type L from "leaflet";

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

        const color = hasAccess ? getMapPinColor(game.type) : "#9CA3AF";
        const size = 24;

        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width: ${size}px; height: ${size}px;
            background: ${color};
            border: 2px solid #fff;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            cursor: pointer;
          "></div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          popupAnchor: [0, -size / 2],
        });

        const marker = L.marker([game.geopoint.lat, game.geopoint.lng], { icon });

        if (hasAccess) {
          const gameUrl = `/games/${slugify(game.city + "-" + game.state)}/${slugify(game.name)}`;
          marker.bindPopup(
            `<div style="font-family: system-ui, sans-serif; min-width: 200px;">
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
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
