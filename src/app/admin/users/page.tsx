"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Users, Crown, Shield, Eye, X, Mail, Calendar, CreditCard, Gift, DollarSign, Link2, Copy, Check } from "lucide-react";
import { getFirebaseDb } from "@/lib/firebase";
import { isFirebaseConfigured } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, doc, setDoc, getDoc } from "firebase/firestore";

interface UserRecord {
  id: string;
  displayName: string;
  email: string;
  accountType: string;
  subscriptionStatus: string;
  plan: string | null;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  createdAt: string;
  lastLoginAt: string;
  homeCity: string;
  gameStylePreference: string | null;
  skillLevel: string | null;
  // Contributor fields
  isContributor: boolean;
  isOrganizer: boolean;
  referralCode: string | null;
  referralLink: string | null;
  contributorCity: string | null;
}

interface ReferralStats {
  activeReferrals: number;
  totalReferrals: number;
  commissionOwed: number;
}

function generateReferralCode(name: string, city: string): string {
  const firstName = name.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "");
  const cityPart = (city || "MAHJ").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 10);
  return `${firstName}-${cityPart}`;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [giftingUserId, setGiftingUserId] = useState<string | null>(null);
  const [giftPlan, setGiftPlan] = useState("monthly");
  const [giftDuration, setGiftDuration] = useState("1");
  const [giftSaving, setGiftSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [promotingUserId, setPromotingUserId] = useState<string | null>(null);
  const [promoCity, setPromoCity] = useState("");
  const [promoSaving, setPromoSaving] = useState(false);
  const [referralStats, setReferralStats] = useState<Record<string, ReferralStats>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleGiftPlan(userId: string) {
    if (!isFirebaseConfigured) return;
    setGiftSaving(true);
    try {
      const db = getFirebaseDb();
      const months = giftPlan === "yearly" ? 12 * parseInt(giftDuration) : parseInt(giftDuration);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + months);

      await setDoc(
        doc(db, "users", userId),
        {
          accountType: "subscriber",
          subscriptionStatus: "active",
          plan: giftPlan === "yearly" ? "yearly" : "monthly",
          subscriptionEndsAt: endDate.toISOString(),
          giftedByAdmin: true,
          giftedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, accountType: "subscriber", subscriptionStatus: "active", plan: giftPlan === "yearly" ? "yearly" : "monthly", subscriptionEndsAt: endDate.toISOString() }
            : u
        )
      );

      setGiftingUserId(null);
      showToast("Plan gifted successfully!");
    } catch {
      showToast("Failed to gift plan. Try again.");
    }
    setGiftSaving(false);
  }

  async function handlePromoteToContributor(userId: string) {
    if (!isFirebaseConfigured) return;
    setPromoSaving(true);

    try {
      const db = getFirebaseDb();
      const user = users.find((u) => u.id === userId);
      if (!user) return;

      const referralCode = generateReferralCode(user.displayName, promoCity || user.homeCity);
      const referralLink = `https://www.mahjnearme.com/pricing?ref=${encodeURIComponent(referralCode)}`;

      await setDoc(
        doc(db, "users", userId),
        {
          accountType: "contributor",
          isContributor: true,
          subscriptionStatus: "active",
          referralCode,
          referralLink,
          contributorCity: promoCity || user.homeCity || null,
          contributorStatus: "approved",
          contributorAppliedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, accountType: "contributor", isContributor: true, subscriptionStatus: "active", referralCode, referralLink, contributorCity: promoCity || user.homeCity }
            : u
        )
      );

      setPromotingUserId(null);
      setPromoCity("");
      showToast(`${user.displayName} promoted to contributor! Code: ${referralCode}`);
    } catch {
      showToast("Failed to promote. Try again.");
    }
    setPromoSaving(false);
  }

  async function handleRevokeContributor(userId: string) {
    if (!isFirebaseConfigured || !confirm("Revoke contributor status? They'll lose full access.")) return;
    try {
      const db = getFirebaseDb();
      await setDoc(
        doc(db, "users", userId),
        {
          accountType: "free",
          isContributor: false,
          subscriptionStatus: "none",
          contributorStatus: "rejected",
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setUsers((prev) =>
        prev.map((u) => u.id === userId ? { ...u, accountType: "free", isContributor: false, subscriptionStatus: "none" } : u)
      );
      showToast("Contributor status revoked.");
    } catch {
      showToast("Failed to revoke.");
    }
  }

  async function handleToggleOrganizer(userId: string, current: boolean) {
    if (!isFirebaseConfigured) return;
    try {
      const db = getFirebaseDb();
      await setDoc(
        doc(db, "users", userId),
        { isOrganizer: !current, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isOrganizer: !current } : u));
      showToast(!current ? "Organizer access granted." : "Organizer access removed.");
    } catch {
      showToast("Failed to update.");
    }
  }

  const fetchReferralStats = useCallback(async (userId: string, referralCode: string) => {
    if (referralStats[userId]) return;
    try {
      const res = await fetch(`/api/referrals?admin=true`);
      if (res.ok) {
        const data = await res.json();
        const contribStats: Record<string, ReferralStats> = {};
        (data.contributors || []).forEach((c: { referralCode: string; activeReferrals: number; totalReferrals: number; commissionOwed: number }) => {
          const matchUser = users.find((u) => u.referralCode === c.referralCode);
          if (matchUser) {
            contribStats[matchUser.id] = { activeReferrals: c.activeReferrals, totalReferrals: c.totalReferrals, commissionOwed: c.commissionOwed };
          }
        });
        setReferralStats((prev) => ({ ...prev, ...contribStats }));
      }
    } catch { /* silent */ }
  }, [referralStats, users]);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  useEffect(() => {
    async function fetchUsers() {
      if (!isFirebaseConfigured) { setLoading(false); return; }
      try {
        const db = getFirebaseDb();
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("createdAt", "desc"), limit(200));
        const snapshot = await getDocs(q);
        const fetched: UserRecord[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            displayName: data.displayName || "Unknown",
            email: data.email || "",
            accountType: data.accountType || "free",
            subscriptionStatus: data.subscriptionStatus || "none",
            plan: data.plan || null,
            trialEndsAt: data.trialEndsAt || null,
            subscriptionEndsAt: data.subscriptionEndsAt || null,
            createdAt: data.createdAt || "",
            lastLoginAt: data.lastLoginAt || "",
            homeCity: data.homeCity || "",
            gameStylePreference: data.gameStylePreference || null,
            skillLevel: data.skillLevel || null,
            isContributor: data.isContributor || false,
            isOrganizer: data.isOrganizer || false,
            referralCode: data.referralCode || null,
            referralLink: data.referralLink || null,
            contributorCity: data.contributorCity || null,
          };
        });
        setUsers(fetched);
      } catch { /* Firestore unavailable */ }
      setLoading(false);
    }
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    const matchesSearch = !searchQuery ||
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || u.accountType === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalSubscribers = users.filter((u) => u.accountType === "subscriber").length;
  const totalContributors = users.filter((u) => u.accountType === "contributor" || u.isContributor).length;

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-10"><div className="animate-shimmer h-96 rounded-xl" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-6">
        User Management
      </h1>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Users", value: users.length, icon: Users },
          { label: "Subscribers", value: totalSubscribers, icon: Crown },
          { label: "Contributors", value: totalContributors, icon: Shield },
          { label: "Total Revenue", value: `$${(totalSubscribers * 4.99).toFixed(2)}/mo`, icon: DollarSign },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <s.icon className="w-5 h-5 text-hotpink-500 mb-2" />
            <p className="text-2xl font-bold text-charcoal">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {users.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl text-center py-16 px-6">
          <Users className="w-12 h-12 text-hotpink-200 mx-auto mb-4" />
          <h3 className="font-semibold text-lg text-charcoal mb-2">No users yet</h3>
          <p className="text-slate-500 text-sm">Users will appear here once people sign up.</p>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm" />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
              <option value="all">All Types</option>
              <option value="subscriber">Subscribers</option>
              <option value="contributor">Contributors</option>
              <option value="free">Free</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          {/* Promote Modal */}
          {promotingUserId && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                <h3 className="font-semibold text-lg text-charcoal mb-1 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-skyblue-500" /> Promote to Contributor
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  {users.find((u) => u.id === promotingUserId)?.displayName} will get full site access, giveaway entry, and a referral code.
                </p>
                <div className="space-y-3 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Their City (for referral code)</label>
                    <input
                      type="text"
                      value={promoCity}
                      onChange={(e) => setPromoCity(e.target.value)}
                      placeholder={users.find((u) => u.id === promotingUserId)?.homeCity || "e.g., Tulsa"}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <p className="text-xs text-slate-400">
                    Referral code will be: <strong>{generateReferralCode(
                      users.find((u) => u.id === promotingUserId)?.displayName || "",
                      promoCity || users.find((u) => u.id === promotingUserId)?.homeCity || ""
                    )}</strong>
                  </p>
                  <p className="text-xs text-slate-400">
                    They earn $1.50/month for each subscriber who uses their code. Create a 15% off coupon in Stripe with this code.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setPromotingUserId(null); setPromoCity(""); }} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button onClick={() => handlePromoteToContributor(promotingUserId)} disabled={promoSaving} className="flex-1 px-4 py-2 rounded-lg bg-skyblue-500 text-white text-sm font-semibold hover:bg-skyblue-600 disabled:opacity-50">
                    {promoSaving ? "Promoting..." : "Promote"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Gift Plan Modal */}
          {giftingUserId && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                <h3 className="font-semibold text-lg text-charcoal mb-1 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-hotpink-500" /> Gift Free Plan
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Give {users.find((u) => u.id === giftingUserId)?.displayName || "this user"} a free subscription.
                </p>
                <div className="space-y-3 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Plan Type</label>
                    <select value={giftPlan} onChange={(e) => setGiftPlan(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                    <select value={giftDuration} onChange={(e) => setGiftDuration(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                      <option value="1">1 {giftPlan === "yearly" ? "year" : "month"}</option>
                      <option value="3">3 {giftPlan === "yearly" ? "years" : "months"}</option>
                      <option value="6">6 {giftPlan === "yearly" ? "years" : "months"}</option>
                      <option value="12">{giftPlan === "yearly" ? "12 years" : "1 year"}</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setGiftingUserId(null)} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button onClick={() => handleGiftPlan(giftingUserId)} disabled={giftSaving} className="flex-1 px-4 py-2 rounded-lg bg-hotpink-500 text-white text-sm font-semibold hover:bg-hotpink-600 disabled:opacity-50">
                    {giftSaving ? "Saving..." : "Gift Plan"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Toast */}
          {toast && (
            <div className="fixed bottom-6 right-6 bg-charcoal text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium z-50">
              {toast}
            </div>
          )}

          {/* User Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-skyblue-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Last Login</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((user) => {
                  const isExpanded = expandedUserId === user.id;
                  const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "-";
                  const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "-";
                  const stats = referralStats[user.id];

                  return (
                    <tr key={user.id} className={isExpanded ? "bg-skyblue-50" : "hover:bg-skyblue-50/50"}>
                      <td className="px-4 py-3" colSpan={isExpanded ? 7 : undefined}>
                        {isExpanded ? (
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                  user.accountType === "contributor" ? "bg-skyblue-100" : "bg-hotpink-100"
                                }`}>
                                  <span className={`text-lg font-bold ${
                                    user.accountType === "contributor" ? "text-skyblue-600" : "text-hotpink-600"
                                  }`}>
                                    {user.displayName.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold text-lg text-charcoal">{user.displayName}</p>
                                  <p className="text-sm text-slate-500">{user.email}</p>
                                </div>
                              </div>
                              <button onClick={() => setExpandedUserId(null)} className="p-1.5 hover:bg-slate-100 rounded">
                                <X className="w-4 h-4 text-slate-400" />
                              </button>
                            </div>

                            {/* Info grid */}
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-xs font-medium text-slate-400 uppercase block">Account Type</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                                  user.accountType === "subscriber" ? "bg-hotpink-200 text-hotpink-600" :
                                  user.accountType === "admin" ? "bg-slate-200 text-slate-700" :
                                  user.accountType === "contributor" ? "bg-skyblue-200 text-skyblue-600" :
                                  "bg-skyblue-100 text-slate-600"
                                }`}>
                                  {user.accountType}
                                </span>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-slate-400 uppercase block">Plan</span>
                                <p className="text-charcoal mt-1">{user.plan || "No plan"}</p>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-slate-400 uppercase block">Joined</span>
                                <p className="text-charcoal mt-1">{user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}</p>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-slate-400 uppercase block">Last Login</span>
                                <p className="text-charcoal mt-1">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}</p>
                              </div>
                            </div>

                            {/* Contributor section */}
                            {(user.accountType === "contributor" || user.isContributor) && user.referralCode && (
                              <div className="bg-skyblue-50 border border-skyblue-200 rounded-lg p-4">
                                <h4 className="font-semibold text-sm text-charcoal mb-3 flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-skyblue-500" /> Contributor Details
                                </h4>
                                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-xs text-slate-400 uppercase block">Referral Code</span>
                                    <div className="flex items-center gap-2 mt-1">
                                      <code className="bg-white px-2 py-1 rounded text-sm font-mono font-bold text-charcoal border">{user.referralCode}</code>
                                      <button onClick={() => copyCode(user.referralCode!)} className="p-1 hover:bg-skyblue-100 rounded">
                                        {copiedCode === user.referralCode ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                                      </button>
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-xs text-slate-400 uppercase block">Referral Link</span>
                                    <div className="flex items-center gap-2 mt-1">
                                      <code className="bg-white px-2 py-1 rounded text-xs text-slate-600 border truncate max-w-[200px]">{user.referralLink}</code>
                                      <button onClick={() => copyCode(user.referralLink!)} className="p-1 hover:bg-skyblue-100 rounded">
                                        {copiedCode === user.referralLink ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                                      </button>
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-xs text-slate-400 uppercase block">City</span>
                                    <p className="text-charcoal mt-1">{user.contributorCity || "-"}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-slate-400 uppercase block">Active Referrals / Earnings</span>
                                    {stats ? (
                                      <p className="text-charcoal mt-1">
                                        <strong>{stats.activeReferrals}</strong> active ({stats.totalReferrals} total) &middot;{" "}
                                        <strong className="text-green-600">${stats.commissionOwed.toFixed(2)}</strong> owed
                                      </p>
                                    ) : (
                                      <button
                                        onClick={() => fetchReferralStats(user.id, user.referralCode!)}
                                        className="text-xs text-hotpink-500 hover:text-hotpink-600 font-medium mt-1"
                                      >
                                        Load stats
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 flex-wrap">
                              <span className={`text-xs font-medium ${
                                user.subscriptionStatus === "active" ? "text-green-500" : "text-slate-400"
                              }`}>
                                Status: {user.subscriptionStatus}
                              </span>

                              <div className="ml-auto flex items-center gap-2 flex-wrap">
                                <button
                                  onClick={() => handleToggleOrganizer(user.id, user.isOrganizer)}
                                  className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${user.isOrganizer ? "bg-violet-100 hover:bg-violet-200 text-violet-700" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}
                                >
                                  <Crown className="w-3.5 h-3.5" />
                                  {user.isOrganizer ? "Organizer ✓" : "Make Organizer"}
                                </button>
                                {user.accountType !== "contributor" && user.accountType !== "admin" && (
                                  <button
                                    onClick={() => { setPromotingUserId(user.id); setPromoCity(user.homeCity || ""); }}
                                    className="flex items-center gap-1 bg-skyblue-100 hover:bg-skyblue-200 rounded-lg px-3 py-1.5 text-xs font-medium text-skyblue-700 transition-colors"
                                  >
                                    <Shield className="w-3.5 h-3.5" /> Make Contributor
                                  </button>
                                )}
                                {(user.accountType === "contributor" || user.isContributor) && (
                                  <button
                                    onClick={() => handleRevokeContributor(user.id)}
                                    className="flex items-center gap-1 bg-red-50 hover:bg-red-100 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" /> Revoke Contributor
                                  </button>
                                )}
                                <button
                                  onClick={() => { setGiftingUserId(user.id); setGiftPlan("monthly"); setGiftDuration("1"); }}
                                  className="flex items-center gap-1 bg-hotpink-100 hover:bg-hotpink-200 rounded-lg px-3 py-1.5 text-xs font-medium text-hotpink-700 transition-colors"
                                >
                                  <Gift className="w-3.5 h-3.5" /> Gift Plan
                                </button>
                                <a
                                  href={`mailto:${user.email}`}
                                  className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors"
                                >
                                  <Mail className="w-3.5 h-3.5" /> Email
                                </a>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="font-medium text-charcoal">{user.displayName}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </>
                        )}
                      </td>
                      {!isExpanded && (
                        <>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              user.accountType === "subscriber" ? "bg-hotpink-200 text-hotpink-600" :
                              user.accountType === "admin" ? "bg-slate-200 text-slate-700" :
                              user.accountType === "contributor" ? "bg-skyblue-200 text-skyblue-600" :
                              "bg-skyblue-100 text-slate-600"
                            }`}>
                              {user.accountType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{user.plan || "-"}</td>
                          <td className="px-4 py-3 text-slate-600">{joinDate}</td>
                          <td className="px-4 py-3 text-slate-600">{lastLogin}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium ${
                              user.subscriptionStatus === "active" ? "text-green-500" : "text-slate-400"
                            }`}>
                              {user.subscriptionStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => setExpandedUserId(user.id)} className="p-1.5 hover:bg-skyblue-100 rounded" title="View">
                              <Eye className="w-4 h-4 text-slate-500" />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
