"use client";

// Sweepstakes laws vary by state. Legal review recommended before launch.

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Gift, Trophy, ArrowRight, Check, Loader2, Users, Target, Phone, ExternalLink } from "lucide-react";
import { CURRENT_GIVEAWAY } from "@/lib/giveaway-config";

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
    description: "The month after we hit 1,000 members, three winners each receive a premium American mahjong set.",
  },
  {
    members: 5000,
    prize: "10 Premium Mahjong Sets",
    description: "The month after we hit 5,000, ten sets given away. The biggest mahjong giveaway online.",
  },
  {
    members: 10000,
    prize: "10 Sets + 20 Mats + Experiential Prize",
    description: "The month after 10K: premium sets, mahjong mats, plus something experiential like a tournament entry.",
  },
  {
    members: 25000,
    prize: "Major Giveaway with Sponsor Involvement",
    description: "The month after 25K: a landmark giveaway with sponsor partnerships and travel prizes.",
  },
];

// First draw: April 30, 2026
const FIRST_DRAW_DATE = "April 30, 2026";

export default function GiveawaysPage() {
  const { user, hasAccess, userProfile } = useAuth();
  const [data, setData] = useState<GiveawayInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);

  useEffect(() => {
    fetchGiveaway();
    fetchCounts();
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

  async function fetchCounts() {
    try {
      const res = await fetch("/api/subscriber-count");
      if (res.ok) {
        const json = await res.json();
        setSubscriberCount(json.count || 0);
        setTotalEntries(json.totalEntries || json.count || 0);
      }
    } catch {
      // silent
    }
  }

  function formatMonth(monthStr: string): string {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  function getDrawDate(): string {
    if (data?.drawDate) return data.drawDate;
    return CURRENT_GIVEAWAY.drawDate;
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
            {CURRENT_GIVEAWAY.month} Mahjong{" "}
            <span className="text-skyblue-200">Giveaway</span>
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Every month, we give away mahjong prizes to paid members. The prize changes month to month.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Current Giveaway */}
        <div className="mb-12">
          <div className="mahj-tile p-6 sm:p-8">
            {/* Prize headline */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-hotpink-100 text-hotpink-600 px-4 py-1.5 rounded-full text-sm font-bold mb-3">
                <Gift className="w-4 h-4" />
                {CURRENT_GIVEAWAY.month} Giveaway
              </div>
              <h2 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-1">
                {data?.prizeName || CURRENT_GIVEAWAY.prizeName}
                {(data?.prizeValue || CURRENT_GIVEAWAY.prizeValue) && (
                  <span className="text-hotpink-500 ml-2">({data?.prizeValue || CURRENT_GIVEAWAY.prizeValue})</span>
                )}
              </h2>
              <p className="text-sm text-slate-500">{CURRENT_GIVEAWAY.prizeDescription}</p>
              {CURRENT_GIVEAWAY.prizeLink && (
                <a
                  href={CURRENT_GIVEAWAY.prizeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-hotpink-500 hover:text-hotpink-600 font-medium mt-2"
                >
                  See the collection <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {/* Partner logo */}
              {CURRENT_GIVEAWAY.partnerLogo && (
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs text-slate-400">Prize provided by</span>
                  <a href={CURRENT_GIVEAWAY.prizeLink || "#"} target="_blank" rel="noopener noreferrer">
                    <img
                      src={CURRENT_GIVEAWAY.partnerLogo}
                      alt={CURRENT_GIVEAWAY.partnerName || "Prize partner"}
                      className="h-12 w-auto object-contain"
                    />
                  </a>
                </div>
              )}
            </div>

            {/* Stats row — always visible, even logged out */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Entries so far</p>
                <p className="text-2xl font-extrabold text-hotpink-500">{totalEntries}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Winners</p>
                <p className="text-2xl font-extrabold text-charcoal">{data?.numberOfWinners || CURRENT_GIVEAWAY.numberOfWinners}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Draw date</p>
                <p className="text-lg font-bold text-charcoal">{getDrawDate()}</p>
              </div>
            </div>

            {/* User status */}
            {hasAccess ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-5 h-5 text-green-500" />
                  <p className="font-semibold text-green-700">You&apos;re entered!</p>
                </div>
                <p className="text-sm text-green-600 mb-3">
                  You have {entryInfo.entries} {entryInfo.entries === 1 ? "entry" : "entries"} this month.{" "}
                  {entryInfo.explanation && <span className="text-green-500">{entryInfo.explanation}</span>}
                </p>
                <WinnerContactForm />
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

        {/* Milestone Giveaways — hidden until there are subscribers */}
        {subscriberCount > 0 && <div className="mb-12">
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-3 text-center">
            Community Milestones
          </h2>
          <p className="text-center text-slate-500 text-sm mb-6 max-w-xl mx-auto">
            When we hit a subscriber milestone, the following month&apos;s giveaway gets a major upgrade. One special drawing, then we continue with our regular monthly prizes.
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
        </div>}

        {/* Free Entry (no purchase necessary) */}
        {!hasAccess && (
          <FreeEntryForm />
        )}

        {/* Fine print */}
        <div className="text-center text-sm text-slate-400 space-y-1">
          <p>
            No purchase necessary.{" "}
            <Link href="/sweepstakes-rules" className="hover:text-hotpink-500 underline">
              Official Sweepstakes Rules
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

function WinnerContactForm() {
  const { user, userProfile, updateUserProfile } = useAuth();
  const [phone, setPhone] = useState(userProfile?.contactPhone || "");
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  async function savePhone() {
    if (!phone.trim()) return;
    const ok = await updateUserProfile({ contactPhone: phone.trim() });
    if (ok) setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  // If already saved, show confirmation
  if (userProfile?.contactPhone) {
    return (
      <div className="text-sm text-green-600 border-t border-green-200 pt-3">
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5" />
          <span>We&apos;ll call/text <strong>{userProfile.contactPhone}</strong> if you win.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-green-200 pt-3">
      <p className="text-xs text-green-600 mb-2 flex items-center gap-1.5">
        <Phone className="w-3 h-3" />
        Add your phone number so we can reach you faster if you win (optional)
      </p>
      <p className="text-xs text-green-500 mb-2">No phone? No problem. We&apos;ll email you instead.</p>
      <div className="flex gap-2">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 123-4567"
          className="border border-green-200 rounded-lg px-3 py-1.5 text-sm flex-1 bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
        />
        <button
          onClick={savePhone}
          className="bg-green-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors"
        >
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}

function FreeEntryForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "already">("idle");

  async function handleFreeEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/giveaway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "free_entry", email, name }),
      });
      if (res.status === 409) {
        setStatus("already");
      } else if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="mahj-tile p-6 text-center mb-8">
        <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <p className="font-semibold text-charcoal">You&apos;re entered!</p>
        <p className="text-sm text-slate-500">Good luck this month. We&apos;ll email the winner on draw day.</p>
      </div>
    );
  }

  if (status === "already") {
    return (
      <div className="mahj-tile p-6 text-center mb-8">
        <Check className="w-8 h-8 text-skyblue-500 mx-auto mb-2" />
        <p className="font-semibold text-charcoal">You&apos;re already entered this month</p>
        <p className="text-sm text-slate-500">One free entry per month. Check back next month!</p>
      </div>
    );
  }

  return (
    <div className="mahj-tile p-6 mb-8">
      <h3 className="font-semibold text-charcoal mb-1 text-center">Free Entry (No Purchase Necessary)</h3>
      <p className="text-sm text-slate-500 text-center mb-4">Enter your email for one free entry this month.</p>
      <form onSubmit={handleFreeEntry} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (optional)"
          className="border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm sm:w-36"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm flex-1"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-hotpink-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors disabled:opacity-50"
        >
          {status === "loading" ? "Entering..." : "Enter Free"}
        </button>
      </form>
      {status === "error" && (
        <p className="text-xs text-red-500 text-center mt-2">Something went wrong. Please try again.</p>
      )}
      <p className="text-xs text-slate-400 text-center mt-3">
        One entry per email per month. Paid subscribers are entered automatically with bonus entries.
      </p>
    </div>
  );
}
