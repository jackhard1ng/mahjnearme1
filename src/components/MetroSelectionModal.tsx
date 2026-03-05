"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import METRO_REGIONS, { findMetroForCity } from "@/lib/metro-regions";
import { MapPin, Search, Check } from "lucide-react";

export default function MetroSelectionModal() {
  const { userProfile, updateUserProfile, needsMetroSelection } = useAuth();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filteredMetros = useMemo(() => {
    if (!search.trim()) return METRO_REGIONS;
    const q = search.toLowerCase();
    return METRO_REGIONS.filter(
      (m) =>
        m.metro.toLowerCase().includes(q) ||
        m.state.toLowerCase().includes(q) ||
        m.cities.some((c) => c.toLowerCase().includes(q))
    );
  }, [search]);

  if (!needsMetroSelection) return null;

  function handleConfirm() {
    if (!selected) return;
    updateUserProfile({
      homeMetro: selected,
      homeMetroSelectedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-hotpink-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-hotpink-500" />
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-heading)] font-bold text-xl text-charcoal">
                Choose Your Home Metro
              </h2>
              <p className="text-sm text-slate-500">
                Free accounts get full access to one metro area
              </p>
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by city or metro area..."
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hotpink-200"
              autoFocus
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {filteredMetros.map((metro) => (
            <button
              key={metro.abbreviation}
              onClick={() => setSelected(metro.abbreviation)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors mb-0.5 ${
                selected === metro.abbreviation
                  ? "bg-hotpink-50 border border-hotpink-200"
                  : "hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-charcoal text-sm">
                    {metro.metro}
                  </span>
                  <span className="text-xs text-slate-400 ml-2">
                    {metro.state}
                  </span>
                </div>
                {selected === metro.abbreviation && (
                  <Check className="w-4 h-4 text-hotpink-500" />
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                {metro.cities.slice(0, 5).join(", ")}
                {metro.cities.length > 5 && " ..."}
              </p>
            </button>
          ))}
          {filteredMetros.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-8">
              No metros found matching &ldquo;{search}&rdquo;
            </p>
          )}
        </div>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleConfirm}
            disabled={!selected}
            className="w-full bg-hotpink-500 text-white py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selected ? "Confirm Selection" : "Select a metro to continue"}
          </button>
          <p className="text-xs text-slate-400 text-center mt-2">
            You can change this once every 90 days.
            Upgrade anytime for access to all 70+ metros.
          </p>
        </div>
      </div>
    </div>
  );
}
