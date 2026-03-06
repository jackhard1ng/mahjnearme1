"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { GIVEAWAY_COPY } from "@/lib/constants";
import { Gift, Trophy, Mail, ArrowRight, Check, Loader2 } from "lucide-react";

interface Winner {
  id: string;
  month: string;
  winnerName: string;
  winnerCity: string;
  winnerPhotoURL: string | null;
  drawnAt: string;
  displayPermission: boolean;
}

export default function GiveawayPage() {
  const { user, hasAccess } = useAuth();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [freeEmail, setFreeEmail] = useState("");
  const [freeName, setFreeName] = useState("");
  const [freeSubmitting, setFreeSubmitting] = useState(false);
  const [freeSuccess, setFreeSuccess] = useState(false);
  const [freeError, setFreeError] = useState("");

  useEffect(() => {
    fetchGiveaway();
  }, []);

  async function fetchGiveaway() {
    try {
      const res = await fetch("/api/giveaway");
      if (res.ok) {
        const data = await res.json();
        setWinners(data.winners || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleFreeEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!freeEmail.trim()) return;

    setFreeSubmitting(true);
    setFreeError("");
    try {
      const res = await fetch("/api/giveaway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "free_entry",
          email: freeEmail,
          name: freeName,
        }),
      });

      if (res.ok) {
        setFreeSuccess(true);
      } else {
        const data = await res.json();
        setFreeError(data.error || "Something went wrong");
      }
    } catch {
      setFreeError("Something went wrong. Please try again.");
    } finally {
      setFreeSubmitting(false);
    }
  }

  function formatMonth(monthStr: string): string {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/40a8a8ed77d5469f174ff66a88f95aa5.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF1493]/85 via-[#FF69B4]/75 to-[#87CEEB]/80" />
        </div>
        <div className="max-w-5xl mx-auto px-4 pt-16 pb-12 sm:pt-20 sm:pb-14 text-center relative">
          <Gift className="w-12 h-12 text-skyblue-200 mx-auto mb-4" />
          <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-4xl sm:text-5xl text-white mb-3 tracking-tight drop-shadow-lg">
            Monthly Mahjong Set{" "}
            <span className="text-skyblue-200">Giveaway</span>
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {GIVEAWAY_COPY}
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* How It Works */}
        <div className="mb-12">
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-6 text-center">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="mahj-tile p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-hotpink-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-hotpink-500">1</span>
              </div>
              <h3 className="font-semibold text-charcoal mb-2">Subscribe</h3>
              <p className="text-sm text-slate-500">
                All paid subscribers are automatically entered every month. No action required.
              </p>
            </div>
            <div className="mahj-tile p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-skyblue-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-skyblue-500">2</span>
              </div>
              <h3 className="font-semibold text-charcoal mb-2">Double Entries</h3>
              <p className="text-sm text-slate-500">
                Annual subscribers get 2x entries per month — double the chances to win.
              </p>
            </div>
            <div className="mahj-tile p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-hotpink-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-hotpink-500">3</span>
              </div>
              <h3 className="font-semibold text-charcoal mb-2">Win!</h3>
              <p className="text-sm text-slate-500">
                One winner drawn on the 1st of each month. Premium mahjong set delivered to your door.
              </p>
            </div>
          </div>
        </div>

        {/* Current Status */}
        {hasAccess ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mb-10">
            <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="font-semibold text-green-700 mb-1">
              You&apos;re automatically entered!
            </p>
            <p className="text-sm text-green-600">
              As an active subscriber, you&apos;re entered in this month&apos;s drawing. Good luck!
            </p>
          </div>
        ) : (
          <div className="bg-hotpink-50 border border-hotpink-200 rounded-xl p-6 text-center mb-10">
            <Gift className="w-8 h-8 text-hotpink-500 mx-auto mb-2" />
            <p className="font-semibold text-charcoal mb-1">
              Subscribe to be entered automatically
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Paid members are entered every month. Annual members get 2x entries.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-hotpink-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors"
            >
              View Plans <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Past Winners */}
        <div className="mb-12">
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-6 text-center">
            Past Winners
          </h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : winners.length === 0 ? (
            <div className="mahj-tile p-8 text-center">
              <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">
                No winners yet — the first drawing is coming soon!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {winners.map((winner) => (
                <div key={winner.id} className="mahj-tile p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-hotpink-100 flex items-center justify-center shrink-0">
                    {winner.winnerPhotoURL && winner.displayPermission ? (
                      <img src={winner.winnerPhotoURL} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <Trophy className="w-6 h-6 text-hotpink-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-charcoal">
                      {winner.displayPermission ? winner.winnerName : "Winner"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {winner.displayPermission ? winner.winnerCity : ""} — {formatMonth(winner.month)}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-hotpink-500 bg-hotpink-50 px-3 py-1 rounded-full">
                    {formatMonth(winner.month)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Free Entry (No Purchase Necessary) */}
        <div className="mahj-tile p-8 mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-skyblue-500" />
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-xl text-charcoal">
              Free Entry Method
            </h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            No purchase necessary. Enter once per month via email for a chance to win.
            See <Link href="/sweepstakes-rules" className="text-hotpink-500 hover:text-hotpink-600 underline">official rules</Link> for details.
          </p>

          {freeSuccess ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <Check className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-green-700 font-medium">Entry submitted! Good luck!</p>
            </div>
          ) : (
            <form onSubmit={handleFreeEntry} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={freeName}
                onChange={(e) => setFreeName(e.target.value)}
                placeholder="Your name"
                className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hotpink-200 sm:w-40"
              />
              <input
                type="email"
                value={freeEmail}
                onChange={(e) => setFreeEmail(e.target.value)}
                placeholder="Your email"
                className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-hotpink-200"
                required
              />
              <button
                type="submit"
                disabled={freeSubmitting}
                className="bg-skyblue-400 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-skyblue-500 transition-colors disabled:opacity-50"
              >
                {freeSubmitting ? "Submitting..." : "Enter Drawing"}
              </button>
            </form>
          )}
          {freeError && (
            <p className="text-sm text-red-500 mt-2">{freeError}</p>
          )}
        </div>

        {/* Sweepstakes Rules Link */}
        <div className="text-center text-sm text-slate-400">
          <Link href="/sweepstakes-rules" className="hover:text-hotpink-500 underline">
            Official Sweepstakes Rules
          </Link>
        </div>
      </div>
    </>
  );
}
