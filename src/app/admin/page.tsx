"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { mockGames } from "@/lib/mock-data";
import { getAnalytics, DailyStats } from "@/lib/analytics";
import { formatCurrency } from "@/lib/currency";
import { MONTHLY_PRICE, ANNUAL_PRICE } from "@/lib/constants";
import {
  Users,
  GamepadIcon,
  MapPin,
  Upload,
  Plus,
  FileSpreadsheet,
  UserPlus,
  Star,
  BarChart3,
  TrendingUp,
  Eye,
  Shield,
  DollarSign,
  Gift,
  AlertTriangle,
  Download,
  RefreshCw,
  Loader2,
  Bell,
  Send,
  Mail,
} from "lucide-react";

interface ContributorData {
  id: string;
  name: string;
  email: string;
  metro: string;
  referralCode: string;
  lastActivityDate: string | null;
  daysSinceActivity: number;
  verificationsThisMonth: number;
  accountType: string;
  inactivityStatus: "active" | "warning" | "suspended";
}

interface ReferralData {
  contributors: {
    id: string;
    name: string;
    referralCode: string;
    metro: string;
    activeReferrals: number;
    totalReferrals: number;
    commissionOwed: number;
    lastActivityDate: string | null;
  }[];
  totalCommissionsOwed: number;
  totalReferrals: number;
}

interface GiveawayData {
  currentMonth: string;
  eligibleEntries: { userId: string; userName: string; email: string; plan: string; entries: number }[];
  totalEntries: number;
  totalParticipants: number;
  winners: { id: string; month: string; winnerName: string; winnerCity: string; drawnAt: string }[];
}

export default function AdminDashboardPage() {
  const [games] = useState(mockGames);
  const [activeTab, setActiveTab] = useState<"overview" | "subscribers" | "contributors" | "referrals" | "giveaways" | "organizers" | "notifications">("overview");
  const [analytics, setAnalytics] = useState<{
    totalViews: number;
    todayViews: number;
    dailyStats: DailyStats[];
    topPages: { path: string; views: number }[];
  } | null>(null);
  const [contributors, setContributors] = useState<ContributorData[]>([]);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [giveawayData, setGiveawayData] = useState<GiveawayData | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [announcePrizeName, setAnnouncePrizeName] = useState("");
  const [announcePrizeValue, setAnnouncePrizeValue] = useState("");
  const [reactivating, setReactivating] = useState<string | null>(null);

  const refreshAnalytics = useCallback(() => {
    getAnalytics(30).then(setAnalytics);
  }, []);

  useEffect(() => {
    refreshAnalytics();
  }, [refreshAnalytics]);

  // Refresh analytics when tab switches back to overview or page regains focus
  useEffect(() => {
    if (activeTab === "overview") refreshAnalytics();
  }, [activeTab, refreshAnalytics]);

  useEffect(() => {
    const onFocus = () => refreshAnalytics();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshAnalytics]);

  const fetchContributors = useCallback(async () => {
    try {
      const res = await fetch("/api/contributor-activity");
      if (res.ok) {
        const data = await res.json();
        setContributors(data.contributors || []);
      }
    } catch { /* silent */ }
  }, []);

  const fetchReferrals = useCallback(async () => {
    try {
      const res = await fetch("/api/referrals?admin=true");
      if (res.ok) {
        setReferralData(await res.json());
      }
    } catch { /* silent */ }
  }, []);

  const fetchGiveaway = useCallback(async () => {
    try {
      const res = await fetch("/api/giveaway?admin=true");
      if (res.ok) {
        setGiveawayData(await res.json());
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (activeTab === "contributors") fetchContributors();
    if (activeTab === "referrals") fetchReferrals();
    if (activeTab === "giveaways") fetchGiveaway();
  }, [activeTab, fetchContributors, fetchReferrals, fetchGiveaway]);

  async function handleDraw() {
    if (!confirm("Draw a winner? This action cannot be undone.")) return;
    setDrawing(true);
    try {
      const res = await fetch("/api/giveaway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "draw" }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Winner: ${data.winner.winnerName} from ${data.winner.winnerCity}`);
        fetchGiveaway();
      } else {
        alert(data.error || "Draw failed");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setDrawing(false);
    }
  }

  async function handleSendAnnouncement() {
    if (!announcePrizeName || !announcePrizeValue) {
      alert("Please enter both prize name and value.");
      return;
    }
    if (!confirm(`Send giveaway announcement to all active contributors?\n\nPrize: ${announcePrizeValue} ${announcePrizeName}`)) return;
    setSendingAnnouncement(true);
    try {
      const res = await fetch("/api/giveaway/announce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prizeName: announcePrizeName, prizeValue: announcePrizeValue }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Announcement sent to ${data.sent} contributor(s): ${data.recipients.join(", ")}`);
        setAnnouncePrizeName("");
        setAnnouncePrizeValue("");
      } else {
        alert(data.error || "Failed to send announcements");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setSendingAnnouncement(false);
    }
  }

  async function handleReactivate(userId: string) {
    setReactivating(userId);
    try {
      await fetch("/api/contributor-activity", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "reactivate" }),
      });
      fetchContributors();
    } catch { /* silent */ }
    finally { setReactivating(null); }
  }

  function exportReferralCSV() {
    if (!referralData) return;
    const rows = [
      ["Contributor", "Referral Code", "Metro", "Active Referrals", "Total Referrals", "Commission Owed"],
      ...referralData.contributors.map((c) => [
        c.name,
        c.referralCode || "",
        c.metro || "",
        String(c.activeReferrals),
        String(c.totalReferrals),
        formatCurrency(c.commissionOwed),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `referral-payouts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const activeGames = games.filter((g) => g.status === "active").length;
  const promotedGames = games.filter((g) => g.promoted).length;
  const cities = new Set(games.map((g) => `${g.city}, ${g.state}`));
  const states = new Set(games.map((g) => g.state));
  const recentGames = games.slice(0, 5);

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "subscribers" as const, label: "Subscribers" },
    { id: "contributors" as const, label: "Contributors" },
    { id: "referrals" as const, label: "Referrals" },
    { id: "giveaways" as const, label: "Giveaways" },
    { id: "organizers" as const, label: "Organizers" },
    { id: "notifications" as const, label: "Notifications" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-charcoal">
            Admin Dashboard
          </h1>
          <p className="text-slate-500 mt-1">MahjNearMe management console</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/games"
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-skyblue-100 transition-colors"
          >
            <GamepadIcon className="w-4 h-4" /> Manage Games
          </Link>
          <Link
            href="/admin/games?action=new"
            className="flex items-center gap-2 bg-hotpink-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Quick Add Game
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? "border-hotpink-500 text-hotpink-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <GamepadIcon className="w-5 h-5 text-hotpink-500" />
                <span className="text-xs font-medium text-hotpink-500 bg-skyblue-100 px-2 py-0.5 rounded-full">{activeGames} active</span>
              </div>
              <p className="text-2xl font-bold text-charcoal">{games.length}</p>
              <p className="text-sm text-slate-500">Total Listings</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="w-5 h-5 text-skyblue-500" />
                <span className="text-xs font-medium text-skyblue-600 bg-skyblue-100 px-2 py-0.5 rounded-full">{states.size} states</span>
              </div>
              <p className="text-2xl font-bold text-charcoal">{cities.size}</p>
              <p className="text-sm text-slate-500">Cities Covered</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <Star className="w-5 h-5 text-hotpink-500" />
                <span className="text-xs font-medium text-hotpink-500 bg-softpink-100 px-2 py-0.5 rounded-full">{promotedGames} featured</span>
              </div>
              <p className="text-2xl font-bold text-charcoal">{activeGames}</p>
              <p className="text-sm text-slate-500">Active Listings</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <Eye className="w-5 h-5 text-hotpink-500 mb-2" />
              <p className="text-2xl font-bold text-charcoal">{analytics?.todayViews ?? "-"}</p>
              <p className="text-sm text-slate-500">Views Today</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <TrendingUp className="w-5 h-5 text-skyblue-500 mb-2" />
              <p className="text-2xl font-bold text-charcoal">{analytics?.totalViews ?? "-"}</p>
              <p className="text-sm text-slate-500">Views (30d)</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-charcoal flex items-center gap-2">
                  <GamepadIcon className="w-5 h-5 text-hotpink-500" /> Recent Listings
                </h2>
                <Link href="/admin/games" className="text-sm text-hotpink-500 hover:text-hotpink-600 font-medium">View All</Link>
              </div>
              <div className="divide-y divide-slate-50">
                {recentGames.map((game) => (
                  <div key={game.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-charcoal">{game.name}</p>
                      <p className="text-xs text-slate-500">{game.city}, {game.state}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      game.status === "active" ? "bg-hotpink-100 text-hotpink-600" : "bg-skyblue-100 text-skyblue-600"
                    }`}>{game.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="font-semibold text-charcoal">Quick Actions</h2>
                </div>
                <div className="p-5 grid grid-cols-2 gap-3">
                  <Link href="/admin/games?action=new" className="flex flex-col items-center gap-2 bg-skyblue-50 hover:bg-softpink-100 border border-slate-200 rounded-xl p-4 transition-colors">
                    <Plus className="w-6 h-6 text-hotpink-500" />
                    <span className="text-sm font-medium text-slate-700">Add Game</span>
                  </Link>
                  <Link href="/admin/games?action=csv" className="flex flex-col items-center gap-2 bg-skyblue-50 hover:bg-softpink-100 border border-slate-200 rounded-xl p-4 transition-colors">
                    <Upload className="w-6 h-6 text-hotpink-500" />
                    <span className="text-sm font-medium text-slate-700">CSV Upload</span>
                  </Link>
                  <Link href="/admin/users" className="flex flex-col items-center gap-2 bg-skyblue-50 hover:bg-softpink-100 border border-slate-200 rounded-xl p-4 transition-colors">
                    <UserPlus className="w-6 h-6 text-hotpink-500" />
                    <span className="text-sm font-medium text-slate-700">Users</span>
                  </Link>
                  <Link href="/admin/submissions" className="flex flex-col items-center gap-2 bg-skyblue-50 hover:bg-softpink-100 border border-slate-200 rounded-xl p-4 transition-colors">
                    <FileSpreadsheet className="w-6 h-6 text-hotpink-500" />
                    <span className="text-sm font-medium text-slate-700">Inquiries</span>
                  </Link>
                </div>
              </div>

              {analytics && analytics.topPages.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h2 className="font-semibold text-charcoal flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-hotpink-500" /> Top Pages (30 days)
                    </h2>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {analytics.topPages.map((page) => (
                      <div key={page.path} className="px-5 py-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-charcoal font-mono">{page.path}</span>
                        <span className="text-xs font-semibold text-skyblue-600 bg-skyblue-50 px-2.5 py-0.5 rounded-full">
                          {page.views} views
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Subscribers Tab */}
      {activeTab === "subscribers" && <AdminSubscribersPanel />}

      {/* Contributors Tab */}
      {activeTab === "contributors" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg text-charcoal flex items-center gap-2">
              <Shield className="w-5 h-5 text-skyblue-500" /> Contributor Accountability
            </h2>
            <button onClick={fetchContributors} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {contributors.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No approved contributors yet.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Contributor</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Metro</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Verifications</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Last Active</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {contributors
                      .sort((a, b) => {
                        const order = { suspended: 0, warning: 1, active: 2 };
                        return order[a.inactivityStatus] - order[b.inactivityStatus];
                      })
                      .map((c) => (
                      <tr key={c.id} className={
                        c.inactivityStatus === "suspended" ? "bg-red-50" :
                        c.inactivityStatus === "warning" ? "bg-amber-50" : ""
                      }>
                        <td className="px-4 py-3">
                          <p className="font-medium text-charcoal">{c.name}</p>
                          <p className="text-xs text-slate-400">{c.email}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{c.metro || "-"}</td>
                        <td className="px-4 py-3 text-center">{c.verificationsThisMonth}</td>
                        <td className="px-4 py-3 text-center text-slate-500">
                          {c.lastActivityDate
                            ? `${c.daysSinceActivity}d ago`
                            : "Never"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            c.inactivityStatus === "active" ? "bg-green-100 text-green-700" :
                            c.inactivityStatus === "warning" ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {c.inactivityStatus === "active" ? "Active" :
                             c.inactivityStatus === "warning" ? "45d+ Inactive" :
                             "60d+ Suspended"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {c.inactivityStatus === "suspended" && (
                            <button
                              onClick={() => handleReactivate(c.id)}
                              disabled={reactivating === c.id}
                              className="text-xs text-skyblue-600 hover:text-skyblue-700 font-medium"
                            >
                              {reactivating === c.id ? "..." : "Reactivate"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Referrals Tab */}
      {activeTab === "referrals" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg text-charcoal flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-hotpink-500" /> Referral Program
            </h2>
            <div className="flex gap-2">
              <button onClick={exportReferralCSV} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
              <button onClick={fetchReferrals} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
          </div>

          {referralData && (
            <>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 text-center">
                  <p className="text-sm text-slate-500 mb-1">Total Referrals</p>
                  <p className="text-2xl font-bold text-charcoal">{referralData.totalReferrals}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 text-center">
                  <p className="text-sm text-slate-500 mb-1">Total Commissions Owed</p>
                  <p className="text-2xl font-bold text-hotpink-600">{formatCurrency(referralData.totalCommissionsOwed)}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 text-center">
                  <p className="text-sm text-slate-500 mb-1">Active Contributors</p>
                  <p className="text-2xl font-bold text-charcoal">{referralData.contributors.length}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Contributor</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Code</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Active</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Commission</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {referralData.contributors.map((c) => (
                        <tr key={c.id} className={!c.activeReferrals && c.totalReferrals === 0 ? "bg-amber-50/50" : ""}>
                          <td className="px-4 py-3 font-medium text-charcoal">{c.name}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">{c.referralCode || "-"}</td>
                          <td className="px-4 py-3 text-center">{c.activeReferrals}</td>
                          <td className="px-4 py-3 text-center">{c.totalReferrals}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(c.commissionOwed)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {referralData.contributors.filter((c) => c.totalReferrals === 0).length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 text-sm">
                      {referralData.contributors.filter((c) => c.totalReferrals === 0).length} contributor(s) with zero referrals
                    </p>
                    <p className="text-xs text-amber-600">May need outreach or coaching to activate their referral links.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Giveaways Tab */}
      {activeTab === "giveaways" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg text-charcoal flex items-center gap-2">
              <Gift className="w-5 h-5 text-hotpink-500" /> Monthly Giveaway
            </h2>
            <button onClick={fetchGiveaway} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {giveawayData && (
            <>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 text-center">
                  <p className="text-sm text-slate-500 mb-1">Current Month</p>
                  <p className="text-xl font-bold text-charcoal">{giveawayData.currentMonth}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 text-center">
                  <p className="text-sm text-slate-500 mb-1">Eligible Participants</p>
                  <p className="text-2xl font-bold text-charcoal">{giveawayData.totalParticipants}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 text-center">
                  <p className="text-sm text-slate-500 mb-1">Total Entries</p>
                  <p className="text-2xl font-bold text-hotpink-600">{giveawayData.totalEntries}</p>
                  <p className="text-xs text-slate-400">Annual = 2x entries</p>
                </div>
              </div>

              {/* Open New Monthly Giveaway */}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-semibold text-charcoal mb-3">Open Monthly Giveaway</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Set the prize details for this month&apos;s giveaway. These show on the public giveaways page.
                </p>
                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Prize Name</label>
                    <input
                      type="text"
                      placeholder="e.g. American Mah Jongg Set"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotpink-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Prize Value</label>
                    <input
                      type="text"
                      placeholder="e.g. $350"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotpink-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Prize Photo URL</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotpink-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Number of Winners</label>
                    <input
                      type="number"
                      min={1}
                      defaultValue={1}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotpink-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Draw Date</label>
                    <input
                      type="date"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotpink-300"
                    />
                  </div>
                </div>
                <button
                  className="flex items-center gap-2 bg-hotpink-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors"
                >
                  <Gift className="w-4 h-4" /> Save Giveaway Details
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-semibold text-charcoal mb-4">Draw Winner</h3>
                <button
                  onClick={handleDraw}
                  disabled={drawing}
                  className="flex items-center gap-2 bg-hotpink-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors disabled:opacity-50"
                >
                  {drawing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Drawing...</>
                  ) : (
                    <><Gift className="w-4 h-4" /> Draw Winner</>
                  )}
                </button>
                <p className="text-xs text-slate-400 mt-2">
                  This action cannot be undone or modified after the fact. The draw is logged with a timestamp.
                </p>
              </div>

              {/* Send Contributor Announcement */}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-semibold text-charcoal mb-2">Send Contributor Announcement</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Notify all active contributors about this month&apos;s giveaway with a ready-to-post caption and their referral code.
                </p>
                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Prize Name</label>
                    <input
                      type="text"
                      value={announcePrizeName}
                      onChange={(e) => setAnnouncePrizeName(e.target.value)}
                      placeholder="e.g. American Mah Jongg Set"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotpink-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Prize Value</label>
                    <input
                      type="text"
                      value={announcePrizeValue}
                      onChange={(e) => setAnnouncePrizeValue(e.target.value)}
                      placeholder="e.g. $350"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotpink-300"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSendAnnouncement}
                  disabled={sendingAnnouncement || !announcePrizeName || !announcePrizeValue}
                  className="flex items-center gap-2 bg-skyblue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-skyblue-600 transition-colors disabled:opacity-50"
                >
                  {sendingAnnouncement ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                  ) : (
                    <><Users className="w-4 h-4" /> Send Contributor Announcement</>
                  )}
                </button>
                <p className="text-xs text-slate-400 mt-2">
                  Each contributor receives a personalized email with their referral code pre-filled in the caption.
                </p>
              </div>

              {giveawayData.winners.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="font-semibold text-charcoal">Past Winners</h3>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {giveawayData.winners.map((w) => (
                      <div key={w.id} className="px-5 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-charcoal">{w.winnerName}</p>
                          <p className="text-xs text-slate-500">{w.winnerCity}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                            <input type="checkbox" defaultChecked={(w as Record<string, unknown>).displayPermission as boolean} className="rounded text-hotpink-500" />
                            Public display consent
                          </label>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">{w.month}</p>
                            <p className="text-xs text-slate-400">
                              {new Date(w.drawnAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {activeTab === "organizers" && <AdminOrganizersPanel />}
      {activeTab === "notifications" && <AdminNotificationsPanel />}
    </div>
  );
}

function AdminSubscribersPanel() {
  const [data, setData] = useState<{
    subscribers: { name: string; email: string; plan: string; price: number; subscribedDate: string; homeCity: string }[];
    metrics: { total: number; monthlyCount: number; annualCount: number; mrr: number; arr: number } | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/subscribers");
        if (res.ok) setData(await res.json());
      } catch { /* silent */ }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-hotpink-500 animate-spin" />
      </div>
    );
  }

  const metrics = data?.metrics;
  const subs = data?.subscribers || [];

  return (
    <div className="space-y-6">
      {/* Revenue Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Total Subscribers</p>
          <p className="text-2xl font-bold text-charcoal">{metrics?.total || 0}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Monthly</p>
          <p className="text-2xl font-bold text-charcoal">{metrics?.monthlyCount || 0}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Annual</p>
          <p className="text-2xl font-bold text-charcoal">{metrics?.annualCount || 0}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">MRR</p>
          <p className="text-2xl font-bold text-hotpink-600">${metrics?.mrr?.toFixed(2) || "0"}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">ARR</p>
          <p className="text-2xl font-bold text-hotpink-600">${metrics?.arr?.toFixed(2) || "0"}</p>
        </div>
      </div>

      {/* Subscriber List */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="font-semibold text-lg text-charcoal mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-hotpink-500" />
          Active Subscribers ({subs.length})
        </h3>

        {subs.length === 0 ? (
          <p className="text-sm text-slate-500">No active subscribers.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="pb-2 font-medium text-slate-500">Name</th>
                  <th className="pb-2 font-medium text-slate-500">Email</th>
                  <th className="pb-2 font-medium text-slate-500">Plan</th>
                  <th className="pb-2 font-medium text-slate-500">Price</th>
                  <th className="pb-2 font-medium text-slate-500">Since</th>
                  <th className="pb-2 font-medium text-slate-500">City</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((sub, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2 text-charcoal font-medium">{sub.name}</td>
                    <td className="py-2 text-slate-600">{sub.email}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        sub.plan === "annual" ? "bg-hotpink-100 text-hotpink-600" : "bg-skyblue-100 text-skyblue-600"
                      }`}>
                        {sub.plan}
                      </span>
                    </td>
                    <td className="py-2 text-slate-600">${sub.price.toFixed(2)}</td>
                    <td className="py-2 text-xs text-slate-500">
                      {new Date(sub.subscribedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="py-2 text-xs text-slate-500">{sub.homeCity || ""}</td>
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

function AdminOrganizersPanel() {
  const [organizers, setOrganizers] = useState<{ id: string; organizerName: string; venueName: string; city: string; metroRegion: string; contactEmail: string; lastUpdated: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/organizers?all=true");
        if (res.ok) {
          const data = await res.json();
          setOrganizers(data.organizers || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = search
    ? organizers.filter(
        (o) =>
          o.organizerName.toLowerCase().includes(search.toLowerCase()) ||
          o.venueName?.toLowerCase().includes(search.toLowerCase()) ||
          o.metroRegion?.toLowerCase().includes(search.toLowerCase())
      )
    : organizers;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-charcoal">Organizer Directory</h2>
        <div className="relative w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizers..."
            className="w-full pl-3 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hotpink-200"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Organizer</th>
                  <th className="text-left px-4 py-2.5 font-medium">Venue</th>
                  <th className="text-left px-4 py-2.5 font-medium">City</th>
                  <th className="text-left px-4 py-2.5 font-medium">Metro</th>
                  <th className="text-left px-4 py-2.5 font-medium">Contact</th>
                  <th className="text-left px-4 py-2.5 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-charcoal">{org.organizerName}</td>
                    <td className="px-4 py-2.5 text-slate-500">{org.venueName || "-"}</td>
                    <td className="px-4 py-2.5 text-slate-500">{org.city || "-"}</td>
                    <td className="px-4 py-2.5 text-slate-500">{org.metroRegion || "-"}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{org.contactEmail || "-"}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">
                      {new Date(org.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-slate-500 text-sm py-8">
              {organizers.length === 0 ? "No organizers in the directory yet." : "No organizers match your search."}
            </p>
          )}
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
            {organizers.length} total organizers across all metros
          </div>
        </div>
      )}
    </div>
  );
}

function AdminNotificationsPanel() {
  const [subscribers, setSubscribers] = useState<{
    name: string;
    email: string;
    states: string[];
    newEvents: boolean;
    digest: boolean;
    accountType: string;
  }[]>([]);
  const [lastNewEvents, setLastNewEvents] = useState<{ sentAt: string; emailsSent: number; newListingsCount: number } | null>(null);
  const [lastDigest, setLastDigest] = useState<{ sentAt: string; emailsSent: number; newListingsCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingType, setSendingType] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [announceSubject, setAnnounceSubject] = useState("");
  const [announceMessage, setAnnounceMessage] = useState("");
  const [announceAudience, setAnnounceAudience] = useState<"all" | "paid" | "free">("all");
  const [sendingAnnounce, setSendingAnnounce] = useState(false);
  const [announceResult, setAnnounceResult] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/digest/status");
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.subscribers || []);
        setLastNewEvents(data.lastNewEvents || null);
        setLastDigest(data.lastDigest || null);
      }
    } catch {
      // silent
    }
    setLoading(false);
  }

  async function triggerSend(type: "newEvents" | "digest") {
    setSendingType(type);
    setSendResult(null);
    try {
      const res = await fetch(`/api/digest/trigger?type=${type}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSendResult(`Sent ${data.emailsSent} emails. ${data.newListings} new listings found.`);
        fetchData();
      } else {
        setSendResult(`Error: ${data.error || "Unknown error"}`);
      }
    } catch {
      setSendResult("Failed to trigger.");
    }
    setSendingType(null);
  }

  async function sendAnnouncement() {
    if (!announceSubject.trim() || !announceMessage.trim()) return;
    setSendingAnnounce(true);
    setAnnounceResult(null);
    try {
      const res = await fetch("/api/digest/announce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: announceSubject,
          message: announceMessage,
          audience: announceAudience,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAnnounceResult(`Sent to ${data.emailsSent} users. ${data.skipped} skipped. ${data.emailsFailed} failed.`);
        setAnnounceSubject("");
        setAnnounceMessage("");
      } else {
        setAnnounceResult(`Error: ${data.error || "Unknown"}`);
      }
    } catch {
      setAnnounceResult("Failed to send.");
    }
    setSendingAnnounce(false);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-hotpink-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Two send buttons */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* New Events Alert */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-charcoal mb-1 flex items-center gap-2">
            <Bell className="w-4 h-4 text-hotpink-500" />
            New Events Alert
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Send to users with "New events in my area" on. Use after updating the JSON.
          </p>

          {lastNewEvents && (
            <div className="bg-slate-50 rounded-lg p-2 mb-3 text-xs text-slate-500">
              Last: {formatDate(lastNewEvents.sentAt)} ({lastNewEvents.emailsSent} sent, {lastNewEvents.newListingsCount} new)
            </div>
          )}

          <button
            onClick={() => triggerSend("newEvents")}
            disabled={sendingType !== null}
            className="inline-flex items-center gap-2 bg-hotpink-500 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-hotpink-600 transition-colors disabled:opacity-50"
          >
            {sendingType === "newEvents" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sendingType === "newEvents" ? "Sending..." : "Send New Events Alert"}
          </button>
        </div>

        {/* Weekly Digest */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-charcoal mb-1 flex items-center gap-2">
            <Mail className="w-4 h-4 text-skyblue-500" />
            Weekly Digest
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Send to users with "Weekly digest" on. Runs automatically every Monday.
          </p>

          {lastDigest && (
            <div className="bg-slate-50 rounded-lg p-2 mb-3 text-xs text-slate-500">
              Last: {formatDate(lastDigest.sentAt)} ({lastDigest.emailsSent} sent, {lastDigest.newListingsCount} new)
            </div>
          )}

          <button
            onClick={() => triggerSend("digest")}
            disabled={sendingType !== null}
            className="inline-flex items-center gap-2 bg-skyblue-500 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-skyblue-600 transition-colors disabled:opacity-50"
          >
            {sendingType === "digest" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {sendingType === "digest" ? "Sending..." : "Send Weekly Digest"}
          </button>
        </div>
      </div>

      {sendResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-medium">
          {sendResult}
        </div>
      )}

      {/* Notification Subscribers */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="font-semibold text-lg text-charcoal mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-hotpink-500" />
          Users with Notifications On ({subscribers.length})
        </h3>

        {subscribers.length === 0 ? (
          <p className="text-sm text-slate-500">No users have enabled notifications yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="pb-2 font-medium text-slate-500">Name</th>
                  <th className="pb-2 font-medium text-slate-500">Email</th>
                  <th className="pb-2 font-medium text-slate-500">Type</th>
                  <th className="pb-2 font-medium text-slate-500">New Events</th>
                  <th className="pb-2 font-medium text-slate-500">Digest</th>
                  <th className="pb-2 font-medium text-slate-500">Watching</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2 text-charcoal">{sub.name}</td>
                    <td className="py-2 text-slate-600">{sub.email}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        sub.accountType === "admin" ? "bg-purple-100 text-purple-600" :
                        sub.accountType === "subscriber" ? "bg-green-100 text-green-600" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {sub.accountType}
                      </span>
                    </td>
                    <td className="py-2">{sub.newEvents ? "✓" : ""}</td>
                    <td className="py-2">{sub.digest ? "✓" : ""}</td>
                    <td className="py-2 text-xs text-slate-500">{sub.states.join(", ") || "None"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Send Announcement */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="font-semibold text-lg text-charcoal mb-4 flex items-center gap-2">
          <Send className="w-5 h-5 text-hotpink-500" />
          Send Announcement
        </h3>
        <p className="text-xs text-slate-400 mb-4">Send a one-time email to all users or a specific group.</p>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Audience</label>
            <div className="flex gap-2">
              {[
                { key: "all" as const, label: "All Users" },
                { key: "paid" as const, label: "Paid Only" },
                { key: "free" as const, label: "Free Only" },
              ].map((a) => (
                <button
                  key={a.key}
                  onClick={() => setAnnounceAudience(a.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    announceAudience === a.key
                      ? "bg-hotpink-500 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Subject</label>
            <input
              type="text"
              value={announceSubject}
              onChange={(e) => setAnnounceSubject(e.target.value)}
              placeholder="e.g., New feature: Get notified about new games in your area"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Message</label>
            <textarea
              value={announceMessage}
              onChange={(e) => setAnnounceMessage(e.target.value)}
              rows={6}
              placeholder="Write your message here. Line breaks will be preserved."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-y"
            />
          </div>

          <button
            onClick={sendAnnouncement}
            disabled={sendingAnnounce || !announceSubject.trim() || !announceMessage.trim()}
            className="inline-flex items-center gap-2 bg-hotpink-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-hotpink-600 transition-colors disabled:opacity-50"
          >
            {sendingAnnounce ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sendingAnnounce ? "Sending..." : `Send to ${announceAudience === "all" ? "All Users" : announceAudience === "paid" ? "Paid Users" : "Free Users"}`}
          </button>

          {announceResult && (
            <p className="text-sm text-green-600 font-medium">{announceResult}</p>
          )}
        </div>
      </div>
    </div>
  );
}
