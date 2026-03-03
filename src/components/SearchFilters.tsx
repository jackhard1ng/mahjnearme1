"use client";

import { useState } from "react";
import { SearchFilters } from "@/types";
import { DAYS_OF_WEEK, GAME_STYLE_LABELS, SKILL_LEVEL_LABELS, GAME_TYPE_LABELS } from "@/lib/constants";
import { Filter, X, ChevronDown } from "lucide-react";

interface SearchFiltersBarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

export default function SearchFiltersBar({ filters, onFiltersChange }: SearchFiltersBarProps) {
  const [expanded, setExpanded] = useState(false);

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleDay = (day: string) => {
    const current = filters.daysOfWeek;
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    updateFilter("daysOfWeek", updated);
  };

  const hasActiveFilters =
    filters.daysOfWeek.length > 0 ||
    filters.gameStyle !== "all" ||
    filters.dropInFriendly !== null ||
    filters.skillLevel !== "all" ||
    filters.type !== "all" ||
    filters.dateFrom !== null;

  const clearFilters = () => {
    onFiltersChange({
      daysOfWeek: [],
      gameStyle: "all",
      dropInFriendly: null,
      skillLevel: "all",
      type: "all",
      dateFrom: null,
      dateTo: null,
    });
  };

  return (
    <div className="mahj-tile">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-hotpink-400" />
          <span className="text-sm font-medium text-charcoal">Filters</span>
          {hasActiveFilters && (
            <span className="bg-hotpink-100 text-hotpink-600 text-xs font-semibold px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-lavender-200 pt-4">
          {/* Day of Week */}
          <div>
            <label className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-2 block">Day of Week</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.daysOfWeek.includes(day)
                      ? "bg-hotpink-500 text-white"
                      : "bg-skyblue-100 text-charcoal hover:bg-skyblue-200"
                  }`}
                >
                  {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Row of selects */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5 block">Type</label>
              <select
                value={filters.type}
                onChange={(e) => updateFilter("type", e.target.value as SearchFilters["type"])}
                className="w-full border border-lavender-200 rounded-lg px-3 py-2 text-sm bg-lavender-100"
              >
                <option value="all">All Types</option>
                {Object.entries(GAME_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5 block">Game Style</label>
              <select
                value={filters.gameStyle}
                onChange={(e) => updateFilter("gameStyle", e.target.value as SearchFilters["gameStyle"])}
                className="w-full border border-lavender-200 rounded-lg px-3 py-2 text-sm bg-lavender-100"
              >
                <option value="all">All Styles</option>
                {Object.entries(GAME_STYLE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5 block">Skill Level</label>
              <select
                value={filters.skillLevel}
                onChange={(e) => updateFilter("skillLevel", e.target.value as SearchFilters["skillLevel"])}
                className="w-full border border-lavender-200 rounded-lg px-3 py-2 text-sm bg-lavender-100"
              >
                <option value="all">All Levels</option>
                {Object.entries(SKILL_LEVEL_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5 block">Drop-in</label>
              <select
                value={filters.dropInFriendly === null ? "all" : filters.dropInFriendly ? "yes" : "no"}
                onChange={(e) => updateFilter("dropInFriendly", e.target.value === "all" ? null : e.target.value === "yes")}
                className="w-full border border-lavender-200 rounded-lg px-3 py-2 text-sm bg-lavender-100"
              >
                <option value="all">All</option>
                <option value="yes">Drop-in Friendly</option>
              </select>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-1.5 block">Travel Dates (optional)</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) => updateFilter("dateFrom", e.target.value || null)}
                className="border border-lavender-200 rounded-lg px-3 py-2 text-sm bg-lavender-100"
                placeholder="From"
              />
              <input
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) => updateFilter("dateTo", e.target.value || null)}
                className="border border-lavender-200 rounded-lg px-3 py-2 text-sm bg-lavender-100"
                placeholder="To"
              />
            </div>
          </div>

          {/* Clear */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-sm text-hotpink-500 hover:text-hotpink-700 font-medium"
            >
              <X className="w-3.5 h-3.5" /> Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
