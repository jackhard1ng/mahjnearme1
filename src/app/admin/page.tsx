"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useFirestoreListings } from "@/hooks/useFirestoreListings";
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

// Helper to route admin API calls through the secure proxy
async function adminFetch(route: string, method: string = "GET", body?: unknown): Promise<Response> {
  return fetch("/api/admin-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ route, method, body }),
  });
}

export default function AdminDashboardPage() {
  const games = useFirestoreListings();
  const [activeTab, setActiveTab] = useState<"overview" | "subscribers" | "referrals" | "giveaways" | "organizers" | "approvals" | "notifications">("overview");
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
      const res = await adminFetch("/api/contributor-activity");
      if (res.ok) {
        const data = await res.json();
        setContributors(data.contributors || []);
      }
    } catch { /* silent */ }
  }, []);

  const fetchReferrals = useCallback(async () => {
    try {
      const res = await adminFetch("/api/referrals?admin=true");
      if (res.ok) {
        setReferralData(await res.json());
      }
    } catch { /* silent */ }
  }, []);

  const fetchGiveaway = useCallback(async () => {
    try {
      const res = await adminFetch("/api/giveaway?admin=true");
      if (res.ok) {
        setGiveawayData(await res.json());
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    // Contributors tab removed - replaced by organizer referrals
    if (activeTab === "referrals") fetchReferrals();
    if (activeTab === "giveaways") fetchGiveaway();
  }, [activeTab, fetchContributors, fetchReferrals, fetchGiveaway]);

  async function handleDraw() {
    if (!confirm("Draw a winner? This action cannot be undone.")) return;
    setDrawing(true);
    try {
      const res = await adminFetch("/api/giveaway", "POST", { action: "draw" });
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
      const res = await adminFetch("/api/giveaway/announce", "POST", { prizeName: announcePrizeName, prizeValue: announcePrizeValue });
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
      await adminFetch("/api/contributor-activity", "PATCH", { userId, action: "reactivate" });
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
    { id: "referrals" as const, label: "Referrals" },
    { id: "giveaways" as const, label: "Giveaways" },
    { id: "organizers" as const, label: "Organizers" },
    { id: "approvals" as const, label: "Approvals" },
    { id: "notifications" as const, label: "Notifications" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-heading)] font-bold text-2xl sm:text-3xl text-charcoal">
          Admin Dashboard
        </h1>
        <p className="text-slate-500 mt-1 text-sm">MahjNearMe management console</p>
        <div className="flex gap-2 flex-wrap mt-3">
          <Link
            href="/admin/events"
            className="flex items-center gap-1.5 bg-hotpink-50 border border-hotpink-200 px-3 py-1.5 rounded-lg text-sm font-medium text-hotpink-700 hover:bg-hotpink-100 transition-colors"
          >
            <GamepadIcon className="w-3.5 h-3.5" /> Edit Events
          </Link>
          <Link
            href="/admin/games"
            className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-skyblue-100 transition-colors"
          >
            <GamepadIcon className="w-3.5 h-3.5" /> Games (legacy)
          </Link>
          <Link
            href="/admin/games?action=new"
            className="flex items-center gap-1.5 bg-hotpink-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Quick Add
          </Link>
        </div>
      </div>

      {/* Tabs — horizontally scrollable on mobile */}
      <div className="overflow-x-auto -mx-4 px-4 mb-6">
        <div className="flex gap-1 border-b border-slate-200 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-hotpink-500 text-hotpink-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
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
                  <Link href="/admin/events" className="flex flex-col items-center gap-2 bg-hotpink-50 hover:bg-hotpink-100 border border-hotpink-200 rounded-xl p-4 transition-colors">
                    <GamepadIcon className="w-6 h-6 text-hotpink-500" />
                    <span className="text-sm font-medium text-slate-700">Edit Events</span>
                  </Link>
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

      {/* Contributors Tab (deprecated - replaced by organizer referrals) */}
      {false && (
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

              {/* Manual Entry (Mail-In AMOE) */}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-semibold text-charcoal mb-2">Add Manual Entry (Mail-In)</h3>
                <p className="text-sm text-slate-500 mb-4">
                  For mail-in entries received. Enter their info from the card.
                </p>
                <div className="grid sm:grid-cols-3 gap-3 mb-3">
                  <input id="manual-entry-name" type="text" placeholder="Full name" className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                  <input id="manual-entry-email" type="email" placeholder="Email address" className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                  <input id="manual-entry-city" type="text" placeholder="City, State" className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <button
                  onClick={async () => {
                    const nameEl = document.getElementById("manual-entry-name") as HTMLInputElement;
                    const emailEl = document.getElementById("manual-entry-email") as HTMLInputElement;
                    const cityEl = document.getElementById("manual-entry-city") as HTMLInputElement;
                    const name = nameEl?.value?.trim();
                    const email = emailEl?.value?.trim();
                    if (!name || !email) { alert("Name and email are required."); return; }
                    try {
                      const res = await adminFetch("/api/giveaway", "POST", {
                        action: "manual_entry",
                        name,
                        email,
                        city: cityEl?.value?.trim() || "",
                      });
                      const data = await res.json();
                      if (res.ok) {
                        alert(`${name} added to this month's drawing.`);
                        nameEl.value = "";
                        emailEl.value = "";
                        cityEl.value = "";
                        fetchGiveaway();
                      } else {
                        alert(data.error || "Failed to add entry.");
                      }
                    } catch {
                      alert("Failed to add entry.");
                    }
                  }}
                  className="flex items-center gap-2 bg-skyblue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-skyblue-600"
                >
                  <Plus className="w-4 h-4" /> Add Entry
                </button>
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
      {activeTab === "approvals" && <AdminApprovalsPanel />}
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
        const res = await adminFetch("/api/subscribers");
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
  const [organizers, setOrganizers] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | "linked" | "self" | "assisted" | "instructors" | "featured">("all");
  const [populating, setPopulating] = useState(false);
  const [populateResult, setPopulateResult] = useState<string | null>(null);
  const [importingInstructors, setImportingInstructors] = useState(false);
  const [instructorImportResult, setInstructorImportResult] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichResult, setEnrichResult] = useState<string | null>(null);

  async function handleEnrich() {
    if (!confirm("This will apply all organizer profile edits to the listings and download the updated JSON. Continue?")) return;
    setEnriching(true);
    setEnrichResult(null);
    try {
      const res = await adminFetch("/api/organizers/enrich", "POST");
      const data = await res.json();
      if (data.success && data.enrichedData) {
        // Download the enriched JSON
        const blob = new Blob([JSON.stringify(data.enrichedData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "listings.json";
        a.click();
        URL.revokeObjectURL(url);
        setEnrichResult(`Updated ${data.enriched} listings with organizer data. ${data.unmatched} unmatched. Downloaded listings.json.`);
      } else {
        setEnrichResult(`Error: ${data.error || "Unknown"}`);
      }
    } catch { setEnrichResult("Failed."); }
    setEnriching(false);
  }

  async function fetchOrganizers() {
    setLoading(true);
    try {
      const res = await adminFetch("/api/organizers?all=true");
      if (res.ok) {
        const data = await res.json();
        setOrganizers(data.organizers || []);
      }
    } catch { /* silent */ }
    setLoading(false);
  }

  useEffect(() => { fetchOrganizers(); }, []);

  async function handlePopulate() {
    if (!confirm("This will scan all listings and create organizer profiles. Existing ones won't be overwritten. Continue?")) return;
    setPopulating(true);
    setPopulateResult(null);
    try {
      const res = await adminFetch("/api/organizers/populate", "POST");
      const data = await res.json();
      if (data.success) {
        setPopulateResult(`Created ${data.created} organizers. ${data.skipped} skipped. ${data.totalOrganizers} total found.`);
        fetchOrganizers();
      } else {
        setPopulateResult(`Error: ${data.error}`);
      }
    } catch { setPopulateResult("Failed."); }
    setPopulating(false);
  }

  function startEdit(org: Record<string, unknown>) {
    setEditing(org.id as string);
    setEditData({
      organizerName: (org.organizerName as string) || "",
      personalName: (org.personalName as string) || "",
      slug: (org.slug as string) || "",
      contactEmail: (org.contactEmail as string) || "",
      website: (org.website as string) || "",
      instagram: (org.instagram as string) || "",
      facebookGroup: (org.facebookGroup as string) || "",
      bio: (org.bio as string) || "",
      verified: org.verified ? "true" : "false",
      featured: org.featured ? "true" : "false",
      isInstructor: org.isInstructor ? "true" : "false",
      userId: (org.userId as string) || "",
    });
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        id: editing,
        organizerName: editData.organizerName,
        personalName: editData.personalName,
        slug: editData.slug,
        contactEmail: editData.contactEmail,
        website: editData.website,
        instagram: editData.instagram,
        facebookGroup: editData.facebookGroup,
        bio: editData.bio,
        verified: editData.verified === "true",
        featured: editData.featured === "true",
        isInstructor: editData.isInstructor === "true",
        updatedAt: new Date().toISOString(),
      };
      if (editData.userId) payload.userId = editData.userId;
      await adminFetch("/api/organizers", "PUT", payload);
      setEditing(null);
      fetchOrganizers();
    } catch { /* silent */ }
    setSaving(false);
  }

  async function linkUserToOrganizer(org: Record<string, unknown>) {
    const email = prompt(`Enter the email of the user to link to "${org.organizerName}":\n\nThis will give them organizer access and connect all ${org.listingCount || 0} listings to their dashboard.`);
    if (!email) return;

    try {
      const res = await adminFetch("/api/admin-link-organizer", "POST", {
        email: email.trim(),
        organizerProfileId: org.id,
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to link user.");
        return;
      }

      alert(`Linked ${email} to "${org.organizerName}". They now have organizer access with ${org.listingCount || 0} listings.`);
      fetchOrganizers();
    } catch {
      alert("Failed to link user.");
    }
  }

  const filtered = search
    ? organizers.filter((o) => {
        const q = search.toLowerCase();
        return (
          ((o.organizerName as string) || "").toLowerCase().includes(q) ||
          ((o.nameKey as string) || "").toLowerCase().includes(q) ||
          ((o.slug as string) || "").toLowerCase().includes(q) ||
          ((o.contactEmail as string) || "").toLowerCase().includes(q) ||
          ((o.instagram as string) || "").toLowerCase().includes(q) ||
          ((o.website as string) || "").toLowerCase().includes(q) ||
          ((o.facebookGroup as string) || "").toLowerCase().includes(q) ||
          ((o.bio as string) || "").toLowerCase().includes(q) ||
          ((o.cities as string[]) || []).some((c) => c.toLowerCase().includes(q)) ||
          ((o.states as string[]) || []).some((s) => s.toLowerCase().includes(q)) ||
          ((o.listingIds as string[]) || []).some((id) => id.toLowerCase().includes(q))
        );
      })
    : organizers;

  // Apply tier filter
  const tierFiltered = tierFilter === "all" ? filtered
    : tierFilter === "linked" ? filtered.filter((o) => !!o.userId)
    : tierFilter === "self" ? filtered.filter((o) => !!o.userId && o.managementPreference === "self")
    : tierFilter === "assisted" ? filtered.filter((o) => !!o.userId && o.managementPreference === "assisted")
    : tierFilter === "instructors" ? filtered.filter((o) => o.isInstructor === true)
    : tierFilter === "featured" ? filtered.filter((o) => o.featured === true)
    : filtered;

  // Sort by listing count descending
  const sorted = [...tierFiltered].sort((a, b) => ((b.listingCount as number) || 0) - ((a.listingCount as number) || 0));

  const linkedCount = organizers.filter((o) => !!o.userId).length;
  const selfCount = organizers.filter((o) => !!o.userId && o.managementPreference === "self").length;
  const assistedCount = organizers.filter((o) => !!o.userId && o.managementPreference === "assisted").length;
  const instructorCount = organizers.filter((o) => o.isInstructor === true).length;
  const featuredCount = organizers.filter((o) => o.featured === true).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-charcoal">Organizer Directory ({organizers.length})</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, city, email, Instagram..."
            className="w-64 pl-3 pr-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
          <button
            onClick={handlePopulate}
            disabled={populating}
            className="inline-flex items-center gap-1.5 bg-skyblue-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-skyblue-600 disabled:opacity-50 shrink-0"
          >
            {populating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {populating ? "Populating..." : "Populate from Listings"}
          </button>
          <button
            onClick={handleEnrich}
            disabled={enriching || organizers.length === 0}
            className="inline-flex items-center gap-1.5 bg-hotpink-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-hotpink-600 disabled:opacity-50 shrink-0"
          >
            {enriching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {enriching ? "Enriching..." : "Apply & Download JSON"}
          </button>
          <button
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".json";
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                setImportingInstructors(true);
                setInstructorImportResult(null);
                try {
                  const text = await file.text();
                  const data = JSON.parse(text);
                  const instructors = Array.isArray(data) ? data : data.instructors || data;
                  if (!Array.isArray(instructors)) {
                    setInstructorImportResult("Error: Expected a JSON array of instructors.");
                    setImportingInstructors(false);
                    return;
                  }
                  setInstructorImportResult(`Importing ${instructors.length} instructors...`);
                  const res = await adminFetch("/api/instructors/import", "POST", { instructors });
                  const result = await res.json();
                  if (result.success) {
                    setInstructorImportResult(`Done! Flagged ${result.flagged} existing organizers as instructors. Created ${result.created} new instructor profiles. Skipped ${result.skipped}.`);
                    fetchOrganizers();
                  } else {
                    setInstructorImportResult(`Error: ${result.error}`);
                  }
                } catch {
                  setInstructorImportResult("Error: Failed to parse JSON file.");
                }
                setImportingInstructors(false);
              };
              input.click();
            }}
            disabled={importingInstructors}
            className="inline-flex items-center gap-1.5 bg-purple-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-purple-600 disabled:opacity-50 shrink-0"
          >
            {importingInstructors ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
            {importingInstructors ? "Importing..." : "Import Instructors"}
          </button>
        </div>
      </div>

      {/* Tier filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {([
          { key: "all" as const, label: `All (${organizers.length})` },
          { key: "linked" as const, label: `Linked (${linkedCount})` },
          { key: "self" as const, label: `Self-Managed (${selfCount})` },
          { key: "assisted" as const, label: `We Manage (${assistedCount})` },
          { key: "instructors" as const, label: `Instructors (${instructorCount})` },
          { key: "featured" as const, label: `Featured (${featuredCount})` },
        ]).map(({ key, label }) => (
          <button key={key} onClick={() => setTierFilter(key)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${tierFilter === key ? "bg-hotpink-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {label}
          </button>
        ))}
      </div>

      {populateResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">{populateResult}</div>
      )}
      {instructorImportResult && (
        <div className={`p-3 rounded-lg text-sm ${instructorImportResult.startsWith("Error") ? "bg-red-50 text-red-700 border border-red-200" : "bg-purple-50 text-purple-700 border border-purple-200"}`}>{instructorImportResult}</div>
      )}
      {enrichResult && (
        <div className="bg-skyblue-50 border border-skyblue-200 rounded-lg p-3 text-sm text-skyblue-700">{enrichResult}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : organizers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-slate-500 mb-3">No organizers in the directory yet.</p>
          <p className="text-xs text-slate-400">Click "Populate from Listings" to auto-create profiles from your existing listings data.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((org) => (
            <div key={org.id as string} className="bg-white border border-slate-200 rounded-xl p-4">
              {editing === org.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={editData.organizerName} onChange={(e) => setEditData({ ...editData, organizerName: e.target.value })} placeholder="Company/Brand Name" className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm" />
                    <input value={editData.personalName} onChange={(e) => setEditData({ ...editData, personalName: e.target.value })} placeholder="Personal Name(s)" className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm" />
                    <input value={editData.slug} onChange={(e) => setEditData({ ...editData, slug: e.target.value })} placeholder="Slug (URL)" className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm" />
                    <input value={editData.contactEmail} onChange={(e) => setEditData({ ...editData, contactEmail: e.target.value })} placeholder="Email" className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm" />
                    <input value={editData.website} onChange={(e) => setEditData({ ...editData, website: e.target.value })} placeholder="Website" className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm" />
                    <input value={editData.instagram} onChange={(e) => setEditData({ ...editData, instagram: e.target.value })} placeholder="Instagram" className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm" />
                    <input value={editData.facebookGroup} onChange={(e) => setEditData({ ...editData, facebookGroup: e.target.value })} placeholder="Facebook Group" className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm" />
                    <input value={editData.userId} onChange={(e) => setEditData({ ...editData, userId: e.target.value })} placeholder="Linked User ID" className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-mono text-xs" />
                  </div>
                  <textarea value={editData.bio} onChange={(e) => setEditData({ ...editData, bio: e.target.value })} placeholder="Bio" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm h-16 resize-none" />
                  <div className="flex flex-wrap gap-4 text-sm">
                    <label className="flex items-center gap-1.5">
                      <input type="checkbox" checked={editData.verified === "true"} onChange={(e) => setEditData({ ...editData, verified: e.target.checked ? "true" : "false" })} />
                      Verified
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input type="checkbox" checked={editData.featured === "true"} onChange={(e) => setEditData({ ...editData, featured: e.target.checked ? "true" : "false" })} />
                      Featured
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input type="checkbox" checked={editData.isInstructor === "true"} onChange={(e) => setEditData({ ...editData, isInstructor: e.target.checked ? "true" : "false" })} />
                      Instructor
                    </label>
                  </div>
                  {/* Photo upload */}
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-slate-600">Photo:</label>
                    {org.photoURL ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={String(org.photoURL)} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : null}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !editing) return;
                        try {
                          const { getStorage, ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
                          const { getFirebaseApp } = await import("@/lib/firebase");
                          const storage = getStorage(getFirebaseApp());
                          const storageRef = ref(storage, `organizer-photos/${editing}/${Date.now()}-${file.name}`);
                          await uploadBytes(storageRef, file);
                          const url = await getDownloadURL(storageRef);
                          await adminFetch("/api/organizers", "PUT", { id: editing, photoURL: url });
                          fetchOrganizers();
                        } catch {
                          alert("Failed to upload photo.");
                        }
                      }}
                      className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-slate-100 file:text-slate-600 file:font-medium file:text-xs hover:file:bg-slate-200"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={saving} className="bg-hotpink-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-hotpink-600 disabled:opacity-50">
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button onClick={() => setEditing(null)} className="text-slate-500 text-xs hover:text-slate-700">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {org.photoURL ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={String(org.photoURL)} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0 mt-0.5" />
                    ) : null}
                    <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-charcoal">{org.organizerName as string}</p>
                      {org.personalName ? <span className="text-xs text-slate-400">({org.personalName as string})</span> : null}
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{org.listingCount as number} listings</span>
                      {org.verified === true && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Verified</span>}
                      {org.featured === true && <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">Featured</span>}
                      {org.isInstructor === true && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Instructor</span>}
                      {org.userId ? <span className="text-xs bg-skyblue-100 text-skyblue-600 px-2 py-0.5 rounded-full">Linked</span> : null}
                      {org.managementPreference === "assisted" ? <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">We Manage</span> : null}
                      {org.managementPreference === "self" ? <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Self</span> : null}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      {org.contactEmail ? <span>{String(org.contactEmail)}</span> : null}
                      {org.website ? <a href={String(org.website)} target="_blank" rel="noopener noreferrer" className="text-hotpink-500 hover:underline">{String(org.website).replace(/^https?:\/\//, "").replace(/\/$/, "")}</a> : null}
                      {org.instagram ? <span>@{String(org.instagram).replace(/^@/, "")}</span> : null}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {((org.cities as string[]) || []).slice(0, 5).join(", ")} {((org.states as string[]) || []).length > 0 ? `(${((org.states as string[]) || []).join(", ")})` : ""}
                    </p>
                    {((org.locations as unknown[]) || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {((org.locations as { venueName: string; city: string; state: string }[]) || []).slice(0, 3).map((loc, i) => (
                          <span key={i} className="text-[10px] bg-skyblue-50 text-skyblue-600 px-1.5 py-0.5 rounded">
                            {loc.venueName ? `${loc.venueName}, ${loc.city}` : loc.city}, {loc.state}
                          </span>
                        ))}
                        {((org.locations as unknown[]) || []).length > 3 && (
                          <span className="text-[10px] text-slate-400">+{((org.locations as unknown[]) || []).length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0 ml-4">
                    <button onClick={() => startEdit(org)} className="text-xs text-hotpink-500 font-medium hover:underline">Edit</button>
                    <button onClick={() => linkUserToOrganizer(org)} className="text-xs text-skyblue-500 font-medium hover:underline">{org.userId ? "Re-link" : "Link User"}</button>
                    <button onClick={async () => { if (!confirm(`Delete "${org.organizerName}"? This cannot be undone.`)) return; await adminFetch(`/api/organizers?id=${org.id}`, "DELETE"); fetchOrganizers(); }} className="text-xs text-red-400 font-medium hover:underline hover:text-red-600">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <p className="text-xs text-slate-400 text-center pt-2">Showing {sorted.length} of {organizers.length} organizers</p>
        </div>
      )}
    </div>
  );
}

function AdminApprovalsPanel() {
  const [claims, setClaims] = useState<{ id: string; userId: string; userEmail: string; userName: string; listingIds: string[]; status: string; message: string; createdAt: string }[]>([]);
  const [approvals, setApprovals] = useState<{ id: string; type: string; userId: string; userEmail: string; userName: string; listingId: string | null; oldValues: Record<string, unknown> | null; newValues: Record<string, unknown> | null; status: string; createdAt: string }[]>([]);
  const [applications, setApplications] = useState<{ id: string; userId: string; userEmail: string; userName: string; organizerName: string; city: string; state: string; role: string; bio: string; isInstructor: boolean; instructorDetails: Record<string, unknown> | null; message: string; website: string; instagram: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState("");
  const [importing, setImporting] = useState(false);
  const [showAiPrompt, setShowAiPrompt] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [claimsRes, approvalsRes, appsRes] = await Promise.all([
        adminFetch("/api/claims?status=pending"),
        adminFetch("/api/approvals?status=pending"),
        adminFetch("/api/organizer-apply?status=pending"),
      ]);
      const claimsData = await claimsRes.json();
      const approvalsData = await approvalsRes.json();
      const appsData = await appsRes.json();
      setClaims(claimsData.claims || []);
      setApprovals(approvalsData.approvals || []);
      setApplications(appsData.applications || []);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  const handleApplication = async (appId: string, status: "approved" | "rejected") => {
    setProcessing(appId);
    try {
      const res = await adminFetch("/api/organizer-apply", "PUT", { id: appId, status, reviewedBy: "admin" });
      const data = await res.json();
      if (!res.ok) {
        alert(`Error: ${data.error || "Failed to process application"}`);
      } else {
        alert(status === "approved" ? "Approved! They now have organizer access." : "Rejected.");
      }
      await loadData();
    } catch (err) {
      alert("Error processing application. Check console.");
      console.error("Application error:", err);
    } finally {
      setProcessing(null);
    }
  };

  const handleClaim = async (claimId: string, status: "approved" | "rejected") => {
    setProcessing(claimId);
    try {
      const res = await adminFetch("/api/claims", "PUT", { id: claimId, status, reviewedBy: "admin" });
      const data = await res.json();
      if (!res.ok) alert(`Error: ${data.error || "Failed"}`);
      await loadData();
    } catch (err) {
      alert("Error processing claim.");
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const handleApproval = async (approvalId: string, status: "approved" | "rejected") => {
    setProcessing(approvalId);
    try {
      const res = await adminFetch("/api/approvals", "PUT", { id: approvalId, status, reviewedBy: "admin" });
      const data = await res.json();
      if (!res.ok) alert(`Error: ${data.error || "Failed"}`);
      await loadData();
    } catch (err) {
      alert("Error processing approval.");
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const handleAssignOrganizer = async () => {
    const email = prompt("Enter the user's email to make them an organizer:");
    if (!email) return;

    try {
      const res = await adminFetch("/api/subscribers?email=" + encodeURIComponent(email));
      const data = await res.json();
      const user = data.subscribers?.find((s: { email: string }) => s.email === email);
      if (!user) {
        alert("User not found with that email.");
        return;
      }
      // Create organizer profile and link to user
      const slug = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await adminFetch("/api/organizers", "POST", {
        organizerName: user.name || email.split("@")[0],
        slug,
        nameKey: slug,
        bio: "",
        contactEmail: email,
        website: "",
        instagram: "",
        facebookGroup: "",
        locations: [],
        listingIds: [],
        listingCount: 0,
        cities: [],
        states: [],
        verified: true,
        featured: false,
        userId: user.id,
        isInstructor: false,
        instructorDetails: null,
        metroRegion: "other",
        addedBy: "admin",
      });
      alert("Organizer profile created. The user will need to re-login to see their dashboard.");
    } catch {
      alert("Failed to assign organizer status.");
    }
  };

  const handleImportListings = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setImporting(true);
      setImportStatus("Reading file...");

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const listings = data.listings || data;

        if (!Array.isArray(listings)) {
          setImportStatus("Error: Invalid JSON format. Expected { listings: [...] }");
          setImporting(false);
          return;
        }

        setImportStatus(`Importing ${listings.length} listings...`);

        const res = await adminFetch("/api/listings/import", "POST", { listings });
        const result = await res.json();

        if (result.success) {
          setImportStatus(
            `Done! Added: ${result.added}, Updated: ${result.updated}, Skipped (organizer-edited): ${result.skipped}`
          );
        } else {
          setImportStatus(`Error: ${result.error}`);
        }
      } catch (err) {
        setImportStatus("Error: Failed to parse or import file.");
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-hotpink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Import Listings */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
          <Upload className="w-4 h-4" /> Import Listings to Firestore
        </h3>
        <p className="text-sm text-slate-500 mb-3">
          Upload a JSON file to merge listings into Firestore. New listings get added.
          Existing listings that organizers have edited will NOT be overwritten.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleImportListings}
            disabled={importing}
            className="bg-skyblue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-skyblue-600 disabled:opacity-50 flex items-center gap-2"
          >
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Import JSON
          </button>
          {importStatus && (
            <span className={`text-sm ${importStatus.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>
              {importStatus}
            </span>
          )}
        </div>
      </div>

      {/* AI Import Prompt */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <span>🤖</span> AI Prompt — Screenshot to JSON
          </h3>
          <button
            onClick={() => setShowAiPrompt(!showAiPrompt)}
            className="text-sm text-hotpink-600 font-medium hover:underline"
          >
            {showAiPrompt ? "Hide" : "Show"}
          </button>
        </div>
        <p className="text-sm text-slate-500 mt-1 mb-2">Paste this into ChatGPT / Claude with screenshots of event listings to generate import-ready JSON.</p>
        {showAiPrompt && (() => {
          const prompt = `You are helping me convert mahjong event listings (from screenshots, websites, or text) into structured JSON for import into MahjNearMe.

Return ONLY a valid JSON object in this exact format — no markdown, no explanation, just the JSON:

{
  "listings": [
    {
      "id": "city-slug-venue-slug-1",
      "name": "Event Name",
      "type": "open_play",
      "gameStyle": "american",
      "city": "New Orleans",
      "state": "LA",
      "generalArea": "Uptown",
      "venueName": "Community Center",
      "address": "123 Main St",
      "isRecurring": true,
      "dayOfWeek": "monday",
      "startTime": "10:00 AM",
      "endTime": "12:00 PM",
      "frequency": "weekly",
      "eventDate": null,
      "cost": "Free",
      "costAmount": 0,
      "contactName": "Jane Smith",
      "contactEmail": "jane@example.com",
      "contactPhone": "",
      "website": "",
      "instagram": "@handle",
      "facebookGroup": "",
      "registrationLink": "",
      "description": "",
      "howToJoin": "",
      "skillLevels": "beginner|intermediate",
      "dropInFriendly": true,
      "setsProvided": true,
      "typicalGroupSize": "",
      "source": "manual",
      "notes": ""
    }
  ]
}

FIELD RULES:

id: lowercase, hyphens only, format "city-venuename-number" (e.g. "new-orleans-tulane-1"). Must be unique.

type: one of — open_play, lesson, league, event
  - open_play: regular drop-in games, clubs, community groups
  - lesson: classes, instruction, beginner workshops
  - league: organized season-based competitive play
  - event: one-time tournaments, special events

gameStyle: one of — american, chinese, riichi, other
  - Default to "american" unless clearly stated otherwise

state: 2-letter uppercase abbreviation (e.g. "LA", "TX", "NY")

dayOfWeek: lowercase day name(s), pipe-separated for multiple days
  Examples: "monday" / "tuesday|thursday" / "saturday"
  Use null if one-time event

startTime / endTime: "10:00 AM" or "2:30 PM" format (12-hour with AM/PM)
  Always include both if available

frequency: one of — weekly, biweekly, monthly
  Default to "weekly" for recurring events unless stated otherwise

isRecurring: true if it happens regularly, false if one-time event
  If isRecurring is false, set eventDate to "YYYY-MM-DD" format

eventDate: "YYYY-MM-DD" for one-time events only, null for recurring

skillLevels: pipe-separated string — "beginner", "intermediate", "advanced"
  - Default: "beginner|intermediate" (most events welcome all levels)
  - If name contains "101": use "beginner"
  - If name contains "102": use "beginner|intermediate"
  - Only use "advanced" if explicitly stated

setsProvided: true by default — most venues provide sets. Only set false if explicitly stated "bring your own tiles" or "BYOT"

dropInFriendly: true by default for open_play. false for league or invite-only events.

cost: human-readable string like "Free", "$10", "$5/session", "Contact for price"
costAmount: numeric dollar amount (0 for free, null if unknown)

instagram: include @ symbol if present (e.g. "@mahjongclub")

generalArea: neighborhood or area within the city (e.g. "Downtown", "Uptown", "West Side")

Leave any unknown fields as null or empty string "".
Do NOT include geopoint, status, promoted, or any internal fields.
Generate as many listings as are present in the screenshots/text provided.`;

          return (
            <div className="mt-3">
              <div className="relative">
                <pre className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-700 whitespace-pre-wrap overflow-auto max-h-64 font-mono leading-relaxed">
                  {prompt}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(prompt);
                    alert("Prompt copied to clipboard!");
                  }}
                  className="absolute top-2 right-2 bg-hotpink-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-hotpink-600"
                >
                  Copy
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Assign Organizer */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Assign Organizer Status
        </h3>
        <button
          onClick={handleAssignOrganizer}
          className="bg-hotpink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-hotpink-600 flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" /> Assign by Email
        </button>
      </div>

      {/* Organizer/Instructor Applications */}
      <div>
        <h3 className="font-semibold text-slate-800 mb-3">
          Organizer Applications ({applications.length})
        </h3>
        {applications.length === 0 ? (
          <p className="text-slate-400 text-sm">No pending applications.</p>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <div key={app.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-800">{app.organizerName}</p>
                      {app.isInstructor && (
                        <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">Instructor</span>
                      )}
                      <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full capitalize">{app.role}</span>
                    </div>
                    <p className="text-sm text-slate-500">{app.userEmail}</p>
                    <p className="text-sm text-slate-600 mt-1">{app.city}, {app.state}</p>
                    {app.bio && <p className="text-sm text-slate-500 mt-1">{app.bio}</p>}
                    {app.website && <p className="text-xs text-slate-400 mt-1">Website: {app.website}</p>}
                    {app.instagram && <p className="text-xs text-slate-400">Instagram: {app.instagram}</p>}
                    {app.isInstructor && app.instructorDetails && (
                      <div className="mt-1 text-xs text-purple-600">
                        {(app.instructorDetails.teachingStyles as string[])?.length > 0 && (
                          <span>Teaching: {(app.instructorDetails.teachingStyles as string[]).join(", ")} | </span>
                        )}
                        {(app.instructorDetails.gameStylesTaught as string[])?.length > 0 && (
                          <span>Styles: {(app.instructorDetails.gameStylesTaught as string[]).join(", ")} | </span>
                        )}
                        {app.instructorDetails.serviceArea ? <span>Area: {String(app.instructorDetails.serviceArea)}</span> : null}
                      </div>
                    )}
                    {(app as Record<string, unknown>).managementPreference ? (
                      <p className={`text-xs font-medium mt-1 ${(app as Record<string, unknown>).managementPreference === "assisted" ? "text-amber-600" : "text-green-600"}`}>
                        {(app as Record<string, unknown>).managementPreference === "assisted" ? "Wants MahjNearMe to manage events" : "Wants to manage own events"}
                      </p>
                    ) : null}
                    {app.message && <p className="text-sm text-slate-500 mt-1 italic">&quot;{app.message}&quot;</p>}
                    <p className="text-xs text-slate-400 mt-1">Applied {new Date(app.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApplication(app.id, "approved")}
                      disabled={processing === app.id}
                      className="bg-green-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-green-600 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleApplication(app.id, "rejected")}
                      disabled={processing === app.id}
                      className="bg-red-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Claims */}
      <div>
        <h3 className="font-semibold text-slate-800 mb-3">
          Pending Claims ({claims.length})
        </h3>
        {claims.length === 0 ? (
          <p className="text-slate-400 text-sm">No pending claims.</p>
        ) : (
          <div className="space-y-3">
            {claims.map((claim) => (
              <div key={claim.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{claim.userName || claim.userEmail}</p>
                    <p className="text-sm text-slate-500">{claim.userEmail}</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Claiming {claim.listingIds.length} listing{claim.listingIds.length > 1 ? "s" : ""}
                    </p>
                    {claim.message && (
                      <p className="text-sm text-slate-500 mt-1 italic">&quot;{claim.message}&quot;</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      Submitted {new Date(claim.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleClaim(claim.id, "approved")}
                      disabled={processing === claim.id}
                      className="bg-green-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-green-600 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleClaim(claim.id, "rejected")}
                      disabled={processing === claim.id}
                      className="bg-red-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Edits & New Listings */}
      <div>
        <h3 className="font-semibold text-slate-800 mb-3">
          Pending Edits & New Listings ({approvals.length})
        </h3>
        {approvals.length === 0 ? (
          <p className="text-slate-400 text-sm">No pending approvals.</p>
        ) : (
          <div className="space-y-3">
            {approvals.map((approval) => (
              <div key={approval.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        approval.type === "new_listing"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {approval.type === "new_listing" ? "New Listing" : "Edit"}
                      </span>
                      <span className="text-sm text-slate-600">by {approval.userName || approval.userEmail}</span>
                    </div>

                    {approval.type === "listing_edit" && approval.oldValues && approval.newValues && (
                      <div className="text-sm mt-2 space-y-1">
                        {Object.keys(approval.newValues).map((key) => (
                          <div key={key} className="text-slate-600">
                            <span className="font-medium">{key}:</span>{" "}
                            <span className="text-red-500 line-through">
                              {String((approval.oldValues as Record<string, unknown>)?.[key] || "")}
                            </span>{" "}
                            <span className="text-green-600">
                              {String((approval.newValues as Record<string, unknown>)?.[key] || "")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {approval.type === "new_listing" && approval.newValues && (
                      <div className="text-sm text-slate-600 mt-1">
                        <p>Name: {(approval.newValues as Record<string, unknown>).name as string}</p>
                        <p>City: {(approval.newValues as Record<string, unknown>).city as string}, {(approval.newValues as Record<string, unknown>).state as string}</p>
                      </div>
                    )}

                    <p className="text-xs text-slate-400 mt-1">
                      Submitted {new Date(approval.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproval(approval.id, "approved")}
                      disabled={processing === approval.id}
                      className="bg-green-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-green-600 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproval(approval.id, "rejected")}
                      disabled={processing === approval.id}
                      className="bg-red-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
      const res = await adminFetch("/api/digest/status");
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
      const res = await adminFetch(`/api/digest?type=${type}`, "POST");
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
      const res = await adminFetch("/api/digest/announce", "POST", {
        subject: announceSubject,
        message: announceMessage,
        audience: announceAudience,
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
