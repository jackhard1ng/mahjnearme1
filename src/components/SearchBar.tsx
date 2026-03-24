"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Loader2, AlertCircle } from "lucide-react";

interface SearchBarProps {
  size?: "large" | "default";
  defaultValue?: string;
  className?: string;
}

export default function SearchBar({ size = "default", defaultValue = "", className = "" }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Pass the text query — the search page will geocode it for proximity search
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Your browser does not support location services.");
      return;
    }

    setLocating(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Reverse geocode to get a display name
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            { headers: { "User-Agent": "MahjNearMe/1.0" } }
          );

          let displayCity = "";
          if (res.ok) {
            const data = await res.json();
            const address = data.address || {};
            displayCity = address.city || address.town || address.village || address.county || "";
          }

          // Always pass lat/lng for proximity search; include city name for display
          const params = new URLSearchParams();
          params.set("lat", latitude.toFixed(6));
          params.set("lng", longitude.toFixed(6));
          if (displayCity) {
            params.set("q", displayCity);
            setQuery(displayCity);
          } else {
            params.set("q", "My Location");
            setQuery("My Location");
          }
          router.push(`/search?${params.toString()}`);
        } catch {
          router.push(`/search?lat=${latitude.toFixed(6)}&lng=${longitude.toFixed(6)}&q=My+Location`);
        }

        setLocating(false);
      },
      (error) => {
        setLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location access was denied. Search for your city above.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location unavailable. Try searching for your city instead.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out. Try searching for your city instead.");
            break;
          default:
            setLocationError("Could not determine your location. Search for your city above.");
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  const isLarge = size === "large";

  return (
    <div>
      <form onSubmit={handleSubmit} className={`flex items-center gap-2 ${className}`}>
        <div className={`relative flex-1 ${isLarge ? "text-lg" : "text-sm"}`}>
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 text-hotpink-400 ${isLarge ? "w-5 h-5" : "w-4 h-4"}`} />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setLocationError(""); }}
            placeholder="Search by city, zip code, or address..."
            className={`w-full bg-white border border-skyblue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-hotpink-400 focus:border-hotpink-400 transition-all placeholder:text-slate-400 ${
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
          className={`flex items-center gap-2 bg-skyblue-100 border border-skyblue-300 rounded-xl hover:bg-skyblue-200 hover:text-hotpink-600 transition-all text-charcoal ${
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
            {locating ? "Locating..." : "Near Me"}
          </span>
        </button>
        <button
          type="submit"
          className={`bg-hotpink-500 text-white rounded-xl font-semibold hover:bg-hotpink-600 transition-colors shadow-lg ${
            isLarge ? "px-8 py-4 text-lg" : "px-6 py-3 text-sm"
          }`}
        >
          Search
        </button>
      </form>
      {locationError && (
        <div className="flex items-center gap-2 mt-2 text-sm text-red-500">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{locationError}</span>
        </div>
      )}
    </div>
  );
}
