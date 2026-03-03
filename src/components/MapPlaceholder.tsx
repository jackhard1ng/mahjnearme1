"use client";

import { Game } from "@/types";
import { getMapPinColor, getGameTypeLabel } from "@/lib/utils";
import { MapPin } from "lucide-react";

interface MapPlaceholderProps {
  games: Game[];
  selectedGameId?: string | null;
  onPinClick?: (gameId: string) => void;
}

export default function MapPlaceholder({ games, selectedGameId, onPinClick }: MapPlaceholderProps) {
  return (
    <div className="bg-skyblue-100 rounded-xl border-2 border-softpink-300 h-full min-h-[300px] relative overflow-hidden">
      {/* Map background pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `
          linear-gradient(rgba(255,20,147,0.15) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,20,147,0.15) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }} />

      {/* Map pins */}
      <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-4 p-8">
        {games.map((game, i) => {
          const color = getMapPinColor(game.type);
          const isSelected = selectedGameId === game.id;
          return (
            <button
              key={game.id}
              onClick={() => onPinClick?.(game.id)}
              className={`relative animate-pin-drop group ${isSelected ? "z-10 scale-125" : ""}`}
              style={{ animationDelay: `${i * 0.1}s` }}
              title={game.name}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-transform ${
                  isSelected ? "ring-2 ring-hotpink-400 ring-offset-2" : "hover:scale-110"
                }`}
                style={{ backgroundColor: color }}
              >
                <MapPin className="w-4 h-4 text-white" />
              </div>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                <div className="bg-hotpink-700 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                  <p className="font-semibold">{game.name}</p>
                  <p className="text-softpink-200">{getGameTypeLabel(game.type)}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* API Key Notice */}
      <div className="absolute bottom-3 left-3 right-3 bg-skyblue-100/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-charcoal">
        <p className="font-medium text-charcoal mb-0.5">Interactive Map</p>
        <p>Add your Google Maps API key to enable the full interactive map with real locations.</p>
      </div>

      {/* Legend */}
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 space-y-1">
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
