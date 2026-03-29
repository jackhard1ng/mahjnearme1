"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { mockGames } from "@/lib/mock-data";
import { getStateName, slugify, formatSchedule, getGameTypeLabel, getGameTypeColor } from "@/lib/utils";
import { MONTHLY_REFERRAL_COMMISSION } from "@/lib/constants";
import {
  DollarSign, Users, MapPin, Search, Loader2, Copy, Check,
  MessageSquare, Send, ChevronDown, ChevronUp, Link2, Shield,
} from "lucide-react";

type Tab = "listings" | "earnings";

export default function ContributorPanelPage() {
  const { user, userProfile, isContributor } = useAuth();

  if (!user || !userProfile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-charcoal mb-4">Contributor Panel</h1>
        <p className="text-slate-500 mb-4">Please log in to access your contributor panel.</p>
        <Link href="/login" className="inline-flex items-center gap-2 bg-hotpink-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-hotpink-600 transition-colors">
          Log In
        </Link>
      </div>
    );
  }

  if (!isContributor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-charcoal mb-4">Contributor Panel</h1>
        <p className="text-slate-500 mb-4">This panel is for approved contributors only.</p>
        <Link href="/contact" className="text-hotpink-500 hover:text-hotpink-600 font-medium">
          Contact us to apply
        </Link>
      </div>
    );
  }

  const assignedState = userProfile.contributorCity || null; // This is actually the state abbreviation
  const stateName = assignedState ? getStateName(assignedState) : null;

  return <ContributorDashboard
    userId={user.uid}
    assignedState={assignedState}
    stateName={stateName || assignedState}
    referralCode={userProfile.referralCode || null}
    referralLink={userProfile.referralLink || null}
    displayName={userProfile.displayName}
  />;
}

function ContributorDashboard({ userId, assignedState, stateName, referralCode, referralLink, displayName }: {
  userId: string;
  assignedState: string | null;
  stateName: string | null;
  referralCode: string | null;
  referralLink: string | null;
  displayName: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("listings");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  }

  return (
    <>
      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-skyblue-500/90 via-skyblue-400/80 to-hotpink-400/70" />
        </div>
        <div className="max-w-5xl mx-auto px-4 pt-10 pb-8 relative">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 text-white/80" />
            <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              Contributor Panel
            </h1>
          </div>
          <p className="text-white/70 text-sm mb-4">
            Welcome back, {displayName}. {stateName && <>You&apos;re assigned to <strong className="text-white">{stateName}</strong>.</>}
          </p>

          {/* Referral code + link */}
          {referralCode && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <span className="text-xs text-white/60">Code:</span>
                <code className="text-sm font-bold text-white">{referralCode}</code>
                <button onClick={() => copyToClipboard(referralCode)} className="p-0.5">
                  {copiedText === referralCode ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5 text-white/60 hover:text-white" />}
                </button>
              </div>
              {referralLink && (
                <button
                  onClick={() => copyToClipboard(referralLink)}
                  className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-white/80 hover:text-white transition-colors"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  {copiedText === referralLink ? "Copied!" : "Copy referral link"}
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
          {[
            { key: "listings" as Tab, label: "Listings", icon: <MapPin className="w-4 h-4" /> },
            { key: "earnings" as Tab, label: "Earnings", icon: <DollarSign className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key ? "bg-white text-charcoal shadow-sm" : "text-slate-500 hover:text-charcoal"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "listings" && <ListingsTab assignedState={assignedState} userId={userId} />}
        {activeTab === "earnings" && <EarningsTab userId={userId} referralCode={referralCode} />}
      </div>
    </>
  );
}

// ─── Listings Tab ───

function ListingsTab({ assignedState, userId }: { assignedState: string | null; userId: string }) {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState<string | null>(null);

  // Get listings for the assigned state
  const stateListings = assignedState
    ? mockGames.filter((g) => g.state === assignedState && g.status === "active")
    : [];

  const filtered = search
    ? stateListings.filter(
        (g) =>
          g.name.toLowerCase().includes(search.toLowerCase()) ||
          g.venueName.toLowerCase().includes(search.toLowerCase()) ||
          g.city.toLowerCase().includes(search.toLowerCase())
      )
    : stateListings;

  async function submitFeedback(gameId: string, gameName: string) {
    if (!feedbackText.trim()) return;
    setFeedbackSending(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Contributor feedback`,
          email: "contributor@mahjnearme.com",
          message: `Listing: ${gameName} (ID: ${gameId})\n\nFeedback: ${feedbackText}`,
          formType: "contributor-feedback",
          _ts: Date.now() - 5000, // bypass time check
        }),
      });
      setFeedbackSent(gameId);
      setFeedbackText("");
      setTimeout(() => setFeedbackSent(null), 3000);
    } catch {
      // silent
    }
    setFeedbackSending(false);
  }

  if (!assignedState) {
    return (
      <div className="text-center py-12">
        <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No state assigned yet. Contact Jack to get assigned.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          <strong className="text-charcoal">{stateListings.length}</strong> listings in {getStateName(assignedState)}
        </p>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((game) => {
          const isExpanded = expandedId === game.id;
          return (
            <div key={game.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : game.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getGameTypeColor(game.type)}`}>
                    {getGameTypeLabel(game.type)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-charcoal truncate">{game.name}</p>
                    <p className="text-xs text-slate-500">{game.city} &middot; {formatSchedule(game)}</p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-100">
                  <div className="grid sm:grid-cols-2 gap-3 mt-3 text-sm">
                    <div>
                      <span className="text-xs text-slate-400 uppercase">Venue</span>
                      <p className="text-charcoal">{game.venueName || "-"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 uppercase">Address</span>
                      <p className="text-charcoal">{game.address || "-"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 uppercase">Cost</span>
                      <p className="text-charcoal">{game.cost}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 uppercase">Contact</span>
                      <p className="text-charcoal">{game.contactEmail || game.contactPhone || game.instagram || "-"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 uppercase">Drop-in</span>
                      <p className="text-charcoal">{game.dropInFriendly ? "Yes" : "No"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 uppercase">Last Updated</span>
                      <p className="text-charcoal">{game.lastVerified || "-"}</p>
                    </div>
                  </div>

                  {game.description && (
                    <div className="mt-3">
                      <span className="text-xs text-slate-400 uppercase">Description</span>
                      <p className="text-sm text-slate-600 mt-1">{game.description}</p>
                    </div>
                  )}

                  {/* Feedback form */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Submit feedback on this listing
                    </p>
                    {feedbackSent === game.id ? (
                      <p className="text-sm text-green-600 font-medium">Feedback sent! Jack will review it.</p>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={expandedId === game.id ? feedbackText : ""}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          placeholder="e.g., Wrong address, event cancelled, cost changed to $20..."
                          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        />
                        <button
                          onClick={() => submitFeedback(game.id, game.name)}
                          disabled={feedbackSending || !feedbackText.trim()}
                          className="flex items-center gap-1 bg-hotpink-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-hotpink-600 disabled:opacity-50 transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {feedbackSending ? "..." : "Send"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Earnings Tab ───

function EarningsTab({ userId, referralCode }: { userId: string; referralCode: string | null }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    activeReferralsCount: number;
    monthlyEarnings: number;
    lifetimeEarnings: number;
    referralList: { signupDate: string; status: string; plan: string; isVested: boolean }[];
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/referrals?contributorId=${userId}`);
        if (res.ok) setData(await res.json());
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [userId]);

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  if (!data) {
    return <p className="text-slate-500 text-center py-8">Unable to load earnings data.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-hotpink-500" />
            <span className="text-xs font-medium text-slate-500 uppercase">Active Referrals</span>
          </div>
          <p className="text-3xl font-bold text-charcoal">{data.activeReferralsCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <span className="text-xs font-medium text-slate-500 uppercase">Monthly Earnings</span>
          </div>
          <p className="text-3xl font-bold text-charcoal">${data.monthlyEarnings.toFixed(2)}<span className="text-sm font-normal text-slate-400">/mo</span></p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-hotpink-500" />
            <span className="text-xs font-medium text-slate-500 uppercase">Total Earned</span>
          </div>
          <p className="text-3xl font-bold text-charcoal">${data.lifetimeEarnings.toFixed(2)}</p>
        </div>
      </div>

      {/* Referral list */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-charcoal">Your Referrals</h3>
          <p className="text-xs text-slate-400">You earn ${MONTHLY_REFERRAL_COMMISSION.toFixed(2)}/month for each active subscriber</p>
        </div>
        {data.referralList.length === 0 ? (
          <p className="text-sm text-slate-500 p-5">No referrals yet. Share your code to get started!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-5 py-2.5 font-medium">#</th>
                  <th className="text-left px-5 py-2.5 font-medium">Subscribed</th>
                  <th className="text-left px-5 py-2.5 font-medium">Plan</th>
                  <th className="text-left px-5 py-2.5 font-medium">Status</th>
                  <th className="text-right px-5 py-2.5 font-medium">You Earn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.referralList.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5 text-charcoal">{i + 1}</td>
                    <td className="px-5 py-2.5 text-slate-500">
                      {new Date(r.signupDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-5 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.plan === "annual" ? "bg-skyblue-100 text-skyblue-600" : "bg-slate-100 text-slate-600"
                      }`}>
                        {r.plan}
                      </span>
                    </td>
                    <td className="px-5 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right font-medium text-charcoal">
                      {r.status === "active" ? `$${MONTHLY_REFERRAL_COMMISSION.toFixed(2)}/mo` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
