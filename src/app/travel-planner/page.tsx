"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { mockGames } from "@/lib/mock-data";
import GameCard from "@/components/GameCard";
import Link from "next/link";
import { Plane, MapPin, Calendar, Lock, Search } from "lucide-react";

export default function TravelPlannerPage() {
  const { user, hasAccess } = useAuth();
  const [city, setCity] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searched, setSearched] = useState(false);

  const results = useMemo(() => {
    if (!city || !searched) return [];
    let games = mockGames.filter(
      (g) => g.status === "active" && g.city.toLowerCase().includes(city.toLowerCase())
    );

    // Filter by days of the week in the date range
    if (dateFrom && dateTo) {
      const start = new Date(dateFrom);
      const end = new Date(dateTo);
      const daysInRange = new Set<string>();
      const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        daysInRange.add(dayNames[d.getDay()]);
      }
      games = games.filter(
        (g) => g.isRecurring && g.recurringSchedule && daysInRange.has(g.recurringSchedule.dayOfWeek)
      );
    }

    return games;
  }, [city, dateFrom, dateTo, searched]);

  if (!user || !hasAccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-charcoal mb-3">
          Travel Planner
        </h1>
        <p className="text-slate-500 mb-6">
          Search for mahjong games by city and travel dates. Available for subscribers.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-hotpink-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors"
        >
          Start Your 14-Day Free Trial
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-2">
        <Plane className="w-7 h-7 text-hotpink-500" />
        <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-charcoal">
          Travel Planner
        </h1>
      </div>
      <p className="text-slate-500 mb-8">
        Traveling? Find games happening during your trip dates.
      </p>

      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8">
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-hotpink-500" /> Destination City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Tulsa"
              className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-hotpink-500" /> Arriving
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-hotpink-500" /> Departing
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm"
            />
          </div>
        </div>
        <button
          onClick={() => setSearched(true)}
          className="flex items-center gap-2 bg-hotpink-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors"
        >
          <Search className="w-4 h-4" /> Find Games During My Trip
        </button>
      </div>

      {searched && (
        <div>
          <h2 className="font-semibold text-lg text-charcoal mb-4">
            {results.length > 0 ? (
              <>{results.length} game{results.length !== 1 ? "s" : ""} found in {city}{dateFrom && dateTo ? ` (${dateFrom} to ${dateTo})` : ""}</>
            ) : (
              <>No games found in {city} for those dates</>
            )}
          </h2>
          <div className="space-y-4">
            {results.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
