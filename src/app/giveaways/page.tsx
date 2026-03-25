"use client";

// Sweepstakes laws vary by state. Legal review recommended before launch.

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Gift, Trophy, ArrowRight, Check, Loader2, Users, Target } from "lucide-react";

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
  {
    members: 1000,
    prize: "3 Premium Mahjong Sets",
    description: "Three winners each receive a premium American mahjong set. Our first milestone giveaway.",
  },
  {
    members: 5000,
    prize: "10 Premium Mahjong Sets (~$4,000 total)",
    description: "Ten premium sets (approximately $400 each) given away. The biggest mahjong giveaway online.",
  },
  {
    members: 10000,
    prize: "10 Sets + 20 Mahjong Mats + Experiential Prize",
    description: "Premium sets, mahjong mats, plus something experiential like a tournament entry or travel prize.",
  },
  {
    members: 25000,
    prize: "Major Giveaway with Sponsor Involvement",
    description: "A landmark giveaway with sponsor partnerships, travel prizes, or equivalent. Details TBA.",
  },
];

// First draw: April 30, 2026
const FIRST_DRAW_DATE = "April 30, 2026";

export default function GiveawaysPage() {
  const { user, hasAccess, userProfile } = useAuth();
  const [data, setData] = useState<GiveawayInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriberCount, setSubscriberCount] = useState(0);

  useEffect(() => {
    fetchGiveaway();
    fetchSubscriberCount();
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

  async function fetchSubscriberCount() {
    try {
      const res = await fetch("/api/subscriber-count");
      if (res.ok) {
        const json = await res.json();
        setSubscriberCount(json.count);
      }
    } catch {
      // silent - stays at 0
    }
  }

  function formatMonth(monthStr: string): string {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  function getDrawDate(): string {
    if (data?.drawDate) return data.drawDate;
    // First draw is April 30, 2026
    const now = new Date();
    if (now < new Date("2026-04-30")) return FIRST_DRAW_DATE;
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

  // Next milestone
  const nextMilestone = MILESTONES.find((m) => subscriberCount < m.members) || MILESTONES[MILESTONES.length - 1];
  const membersToNext = Math.max(0, nextMilestone.members - subscriberCount);

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
            Monthly Mahjong{" "}
            <span className="text-skyblue-200">Giveaway</span>
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Every month, paid members win mahjong prizes. Sets, mats, tile racks, carrying cases, and more. The prize changes month to month.
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
                  {data?.prizeName || "Monthly Prize"}
                </h2>
                <p className="text-sm text-slate-500">
                  Prize to be announced by founder before each draw
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Winners this month</p>
                <p className="text-lg font-bold text-charcoal">{data?.numberOfWinners || 1}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Next draw date</p>
                <p className="text-lg font-bold text-charcoal">{getDrawDate()}</p>
              </div>
              {subscriberCount > 0 && (
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1">Members entered</p>
                  <p className="text-lg font-bold text-charcoal">{subscriberCount}</p>
                </div>
              )}
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
                Winner drawn on the last day of each month. Prize delivered to your door.
              </p>
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-4">
            Prizes are not always mahjong sets. Some months it may be mats, tile racks, carrying cases, or other mahjong accessories. Variety is intentional.
          </p>
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
                No winners yet. The first drawing is {FIRST_DRAW_DATE}!
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
                      <img src={winner.winnerSetPhoto} alt="Winner's prize" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <span className="text-xs font-medium text-hotpink-500 bg-hotpink-50 px-3 py-1 rounded-full shrink-0">
                    {winner.prizeName || "Mahjong Prize"}
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
                {subscriberCount} paying members
              </span>
              <span className="text-sm text-slate-400">Next: {nextMilestone.members.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-hotpink-500 to-skyblue-400 h-3 rounded-full transition-all"
                style={{ width: `${Math.min((subscriberCount / nextMilestone.members) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {membersToNext > 0
                ? `${membersToNext.toLocaleString()} more members until the next milestone!`
                : "Milestone reached!"}
            </p>
          </div>

          <div className="space-y-4">
            {MILESTONES.map((milestone) => {
              const reached = subscriberCount >= milestone.members;
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

        {/* Fine print: No Purchase Necessary + Sweepstakes Rules */}
        <div className="text-center text-sm text-slate-400 space-y-1">
          <p>
            No purchase necessary.{" "}
            <Link href="/sweepstakes-rules" className="hover:text-hotpink-500 underline">
              See official rules
            </Link>{" "}
            for alternative method of entry.
          </p>
          <p>
            <Link href="/sweepstakes-rules" className="hover:text-hotpink-500 underline">
              Official Sweepstakes Rules
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
