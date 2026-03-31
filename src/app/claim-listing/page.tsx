"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useListings } from "@/hooks/useListings";
import { Game } from "@/types";
import Link from "next/link";
import {
  Search,
  CheckCircle,
  Loader2,
  MapPin,
  Clock,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

export default function ClaimListingPage() {
  const { user, userProfile, isOrganizer } = useAuth();
  const { games } = useListings();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const filteredGames = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return games
      .filter(
        (g) =>
          g.status === "active" &&
          !g.claimedBy &&
          (g.name.toLowerCase().includes(q) ||
            g.organizerName.toLowerCase().includes(q) ||
            g.contactName.toLowerCase().includes(q) ||
            g.venueName.toLowerCase().includes(q) ||
            g.city.toLowerCase().includes(q))
      )
      .slice(0, 50);
  }, [games, searchQuery]);

  const toggleListing = (id: string) => {
    setSelectedListings((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!user || !userProfile || selectedListings.length === 0) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: userProfile.email,
          userName: userProfile.displayName,
          listingIds: selectedListings,
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit claim");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ShieldCheck className="w-12 h-12 text-softpink-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-4">
          Claim Your Listings
        </h1>
        <p className="text-slate-600 mb-6">
          Sign in to claim your mahjong game listings and manage them through
          your organizer dashboard.
        </p>
        <Link
          href="/account"
          className="inline-block bg-softpink-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-softpink-600 transition"
        >
          Sign In to Continue
        </Link>
      </div>
    );
  }

  if (isOrganizer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-4">
          You&apos;re Already an Organizer
        </h1>
        <p className="text-slate-600 mb-6">
          You already have an organizer profile. Go to your dashboard to manage
          your listings.
        </p>
        <Link
          href="/organizer"
          className="inline-block bg-softpink-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-softpink-600 transition"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-4">
          Claim Submitted
        </h1>
        <p className="text-slate-600 mb-6">
          Your claim for {selectedListings.length} listing
          {selectedListings.length > 1 ? "s" : ""} has been submitted. We will
          review it and notify you by email once approved.
        </p>
        <Link
          href="/account"
          className="inline-block bg-softpink-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-softpink-600 transition"
        >
          Back to Account
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">
        Claim Your Listings
      </h1>
      <p className="text-slate-600 mb-8">
        Search for your mahjong games below and claim them as yours. Once
        approved, you&apos;ll get an organizer dashboard to edit your listings,
        add new events, and update your profile.
      </p>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by group name, venue, organizer, or city..."
          className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:border-softpink-400 focus:outline-none text-slate-800"
        />
      </div>

      {/* Results */}
      {searchQuery.length >= 2 && (
        <div className="mb-6">
          <p className="text-sm text-slate-500 mb-3">
            {filteredGames.length} result{filteredGames.length !== 1 ? "s" : ""}
            {filteredGames.length === 50 ? " (showing first 50)" : ""}
          </p>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredGames.map((game) => (
              <ListingRow
                key={game.id}
                game={game}
                selected={selectedListings.includes(game.id)}
                onToggle={() => toggleListing(game.id)}
              />
            ))}
            {filteredGames.length === 0 && (
              <p className="text-slate-400 text-center py-8">
                No unclaimed listings found for &quot;{searchQuery}&quot;
              </p>
            )}
          </div>
        </div>
      )}

      {/* Selected listings */}
      {selectedListings.length > 0 && (
        <div className="bg-skyblue-50 border-2 border-skyblue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-slate-800 mb-2">
            Selected ({selectedListings.length})
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedListings.map((id) => {
              const game = games.find((g) => g.id === id);
              return (
                <span
                  key={id}
                  className="bg-white px-3 py-1 rounded-full text-sm border border-skyblue-300 flex items-center gap-1"
                >
                  {game?.name || id}
                  <button
                    onClick={() => toggleListing(id)}
                    className="text-slate-400 hover:text-red-500 ml-1"
                  >
                    x
                  </button>
                </span>
              );
            })}
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional: Tell us how you're connected to these listings (organizer, host, etc.)"
            className="w-full p-3 border border-slate-200 rounded-lg text-sm resize-none h-20 mb-4"
          />

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm mb-4">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-softpink-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-softpink-600 transition disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" /> Submit Claim
              </>
            )}
          </button>
        </div>
      )}

      {/* Info box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <h4 className="font-semibold mb-1">How it works</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Search for your listings and select them</li>
          <li>Submit your claim for admin review</li>
          <li>
            Once approved, you get a free organizer dashboard to manage your
            events
          </li>
          <li>
            All organizers can edit listings, add events, and have a public
            profile
          </li>
          <li>
            Subscribers get instant edits (no approval wait) and a Featured
            badge
          </li>
        </ul>
      </div>
    </div>
  );
}

function ListingRow({
  game,
  selected,
  onToggle,
}: {
  game: Game;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full text-left p-3 rounded-lg border-2 transition ${
        selected
          ? "border-softpink-400 bg-softpink-50"
          : "border-slate-200 hover:border-slate-300 bg-white"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 truncate">{game.name}</p>
          <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {game.city}, {game.state}
            </span>
            {game.venueName && (
              <span className="truncate">{game.venueName}</span>
            )}
            {game.recurringSchedule?.dayOfWeek && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {game.recurringSchedule.dayOfWeek}
              </span>
            )}
          </div>
          {game.organizerName && (
            <p className="text-xs text-slate-400 mt-1">
              Contact: {game.organizerName}
            </p>
          )}
        </div>
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 mt-1 ${
            selected
              ? "border-softpink-500 bg-softpink-500"
              : "border-slate-300"
          }`}
        >
          {selected && <CheckCircle className="w-3 h-3 text-white" />}
        </div>
      </div>
    </button>
  );
}
