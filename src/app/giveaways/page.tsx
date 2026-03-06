"use client";

// Sweepstakes laws vary by state. Legal review recommended before launch.

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Gift, Trophy, Mail, ArrowRight, Check, Loader2, Users, Target } from "lucide-react";

interface Winner {
  id: string;
  month: string;
  winnerName: string;
  winnerCity: string;
  winnerPhotoURL: string | null;
  prizeName?: string;
  prizeValue?: string;
  prizePhoto?: string;
  drawnAt: string;
  displayPermission: boolean;
  winnerSetPhoto?: string | null;
}

interface GiveawayInfo {
  currentMonth: string;
  winners: Winner[];
  prizeName?: string;
  prizeValue?: string;
  prizePhoto?: string;
  numberOfWinners?: number;
  drawDate?: string;
  entryCount?: number;
  userEntries?: number;
}

const MILESTONES = [
  { members: 1000, prize: "Premium American Mahjong Set ($250 value)", description: "A beautiful set delivered to one lucky winner every month." },
  { members: 5000, prize: "$500 Mahjong Prize Pack", description: "Set, accessories, card holder, and custom tiles. Two winners per month." },
  { members: 10000, prize: "$1,000+ Grand Prize Package", description: "Top-of-the-line set, travel case, custom tiles, plus a $500 gift card. Five winners per month." },
];

export default function GiveawaysPage() {
  const { user, hasAccess, userProfile } = useAuth();
  const [data, setData] = useState<GiveawayInfo | null>(null);
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
        const json = await res.json();
        setData(json);
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
        const json = await res.json();
        setFreeError(json.error || "Something went wrong");
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

  function getDrawDate(): string {
    if (data?.drawDate) return data.drawDate;
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  // Calculate user's accumulated entries (1 per 6 months subscribed, max 6)
  function getUserEntryInfo(): { entries: number; explanation: string } {
    if (!userProfile || !hasAccess) return { entries: 0, explanation: "" };
    if (data?.userEntries) return { entries: data.userEntries, explanation: "" };

    // Estimate based on subscription start
    const subscribedSince = userProfile.subscribedDate || userProfile.createdAt;
    if (!subscribedSince) return { entries: 1, explanation: "You have 1 entry this month." };

    const monthsSubscribed = Math.floor(
      (Date.now() - new Date(subscribedSince).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    const sixMonthBlocks = Math.floor(monthsSubscribed / 6);
    const baseEntries = userProfile.plan === "annual" ? 2 : 1;
    const bonusEntries = Math.min(sixMonthBlocks, 6);
    const totalEntries = baseEntries + bonusEntries;

    if (bonusEntries > 0) {
      return {
        entries: totalEntries,
        explanation: `${baseEntries} base ${baseEntries === 1 ? "entry" : "entries"} + ${bonusEntries} loyalty bonus (1 extra for every 6 months subscribed, max 6).`,
      };
    }
    return {
      entries: totalEntries,
      explanation: `${baseEntries === 2 ? "Annual subscribers get 2 entries per month." : "Monthly subscribers get 1 entry per month."} You earn 1 extra entry for every 6 months subscribed, up to 6 bonus entries.`,
    };
  }

  const entryInfo = getUserEntryInfo();

  // Fake subscriber count for milestone progress (replace with real data later)
  const currentSubscriberCount = 127;

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
            Every month, one lucky member wins a premium mahjong set. Paid subscribers are automatically entered.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Current Giveaway */}
        <div className="mb-12">
          <div className="mahj-tile p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-hotpink-100 flex items-center justify-center">
                <Gift className="w-5 h-5 text-hotpink-500" />
              </div>
              <div>
                <h2 className="font-[family-name:var(--font-heading)] font-bold text-xl text-charcoal">
                  {data?.prizeName || "Premium American Mahjong Set"}
                </h2>
                <p className="text-sm text-slate-500">
                  {data?.prizeValue || "$250+"} value
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Winners this month</p>
                <p className="text-lg font-bold text-charcoal">{data?.numberOfWinners || 1}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Draw date</p>
                <p className="text-lg font-bold text-charcoal">{getDrawDate()}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Members entered</p>
                <p className="text-lg font-bold text-charcoal">{data?.entryCount || "-"}</p>
              </div>
            </div>

            {/* User status */}
            {hasAccess ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-5 h-5 text-green-500" />
                  <p className="font-semibold text-green-700">You&apos;re entered!</p>
                </div>
                <p className="text-sm text-green-600">
                  You have {entryInfo.entries} {entryInfo.entries === 1 ? "entry" : "entries"} this month.{" "}
                  {entryInfo.explanation && <span className="text-green-500">{entryInfo.explanation}</span>}
                </p>
              </div>
            ) : (
              <div className="bg-hotpink-50 border border-hotpink-200 rounded-lg p-4">
                <p className="font-semibold text-charcoal mb-1">
                  Paid members are automatically entered every month.
                </p>
                <p className="text-sm text-slate-500 mb-3">
                  Upgrade to be included in this month&apos;s drawing.
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 bg-hotpink-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors"
                >
                  View Plans <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* How Entries Work */}
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
              <h3 className="font-semibold text-charcoal mb-2">Earn More Entries</h3>
              <p className="text-sm text-slate-500">
                Annual subscribers get 2x entries. Plus, you earn 1 bonus entry for every 6 months subscribed, up to 6 extra.
              </p>
            </div>
            <div className="mahj-tile p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-hotpink-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-hotpink-500">3</span>
              </div>
              <h3 className="font-semibold text-charcoal mb-2">Win!</h3>
              <p className="text-sm text-slate-500">
                Winner drawn at the end of the month. Premium mahjong set delivered to your door.
              </p>
            </div>
          </div>
        </div>

        {/* Past Winners */}
        <div className="mb-12">
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-6 text-center">
            Past Winners
          </h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : !data?.winners?.length ? (
            <div className="mahj-tile p-8 text-center">
              <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">
                No winners yet. The first drawing is coming soon!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.winners.map((winner) => (
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
                      {winner.displayPermission ? `${winner.winnerCity}, ` : ""}{formatMonth(winner.month)}
                    </p>
                  </div>
                  {winner.winnerSetPhoto && winner.displayPermission && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                      <img src={winner.winnerSetPhoto} alt="Winner's set" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <span className="text-xs font-medium text-hotpink-500 bg-hotpink-50 px-3 py-1 rounded-full shrink-0">
                    {winner.prizeName || "Mahjong Set"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Milestone Giveaways */}
        <div className="mb-12">
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-3 text-center">
            Community Milestones
          </h2>
          <p className="text-center text-slate-500 text-sm mb-6 max-w-xl mx-auto">
            As MahjNearMe grows, the giveaways get bigger. When we hit subscriber milestones, the prize pool goes up for everyone.
          </p>

          {/* Progress bar */}
          <div className="mahj-tile p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-charcoal">
                <Users className="w-4 h-4 inline mr-1 text-hotpink-500" />
                {currentSubscriberCount} members
              </span>
              <span className="text-sm text-slate-400">Next: {MILESTONES[0].members.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-hotpink-500 to-skyblue-400 h-3 rounded-full transition-all"
                style={{ width: `${Math.min((currentSubscriberCount / MILESTONES[0].members) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {MILESTONES[0].members - currentSubscriberCount} more members until the first milestone!
            </p>
          </div>

          <div className="space-y-4">
            {MILESTONES.map((milestone, i) => {
              const reached = currentSubscriberCount >= milestone.members;
              return (
                <div
                  key={milestone.members}
                  className={`mahj-tile p-5 flex items-start gap-4 ${reached ? "border-green-200 bg-green-50" : ""}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    reached ? "bg-green-100" : "bg-hotpink-100"
                  }`}>
                    <Target className={`w-5 h-5 ${reached ? "text-green-500" : "text-hotpink-500"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-charcoal">
                        {milestone.members.toLocaleString()} Members
                      </h3>
                      {reached && (
                        <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                          Reached!
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-hotpink-500 mt-0.5">{milestone.prize}</p>
                    <p className="text-sm text-slate-500 mt-1">{milestone.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Free Entry (No Purchase Necessary) */}
        <div className="mahj-tile p-6 sm:p-8 mb-10">
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
