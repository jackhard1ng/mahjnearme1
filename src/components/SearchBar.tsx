"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Loader2 } from "lucide-react";

interface SearchBarProps {
  size?: "large" | "default";
  defaultValue?: string;
  className?: string;
}

export default function SearchBar({ size = "default", defaultValue = "", className = "" }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const [locating, setLocating] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        router.push(`/search?lat=${latitude}&lng=${longitude}`);
        setLocating(false);
      },
      () => {
        setLocating(false);
      }
    );
  };

  const isLarge = size === "large";

  return (
    <form onSubmit={handleSubmit} className={`flex items-center gap-2 ${className}`}>
      <div className={`relative flex-1 ${isLarge ? "text-lg" : "text-sm"}`}>
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 ${isLarge ? "w-5 h-5" : "w-4 h-4"}`} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by city, state, or zip code..."
          className={`w-full bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
            isLarge
              ? "pl-12 pr-4 py-4 text-lg shadow-lg"
              : "pl-10 pr-4 py-3 text-sm"
          }`}
        />
      </div>
      <button
        type="button"
        onClick={handleUseLocation}
        disabled={locating}
        className={`flex items-center gap-2 bg-white border border-slate-200 rounded-xl hover:border-teal-300 hover:text-teal-600 transition-all text-slate-600 ${
          isLarge ? "px-5 py-4 shadow-lg" : "px-4 py-3"
        }`}
        title="Use my location"
      >
        {locating ? (
          <Loader2 className={`animate-spin ${isLarge ? "w-5 h-5" : "w-4 h-4"}`} />
        ) : (
          <MapPin className={isLarge ? "w-5 h-5" : "w-4 h-4"} />
        )}
        <span className="hidden sm:inline text-sm font-medium">
          {locating ? "Locating..." : "Use My Location"}
        </span>
      </button>
      <button
        type="submit"
        className={`bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors ${
          isLarge ? "px-8 py-4 text-lg shadow-lg" : "px-6 py-3 text-sm"
        }`}
      >
        Search
      </button>
    </form>
  );
}
