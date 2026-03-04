"use client";

import { useState, useEffect } from "react";
import { Search, Users, Crown, Shield, Eye, X, Mail, Calendar, CreditCard } from "lucide-react";
import { getFirebaseDb } from "@/lib/firebase";
import { isFirebaseConfigured } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

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
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      if (!isFirebaseConfigured) {
        setLoading(false);
        return;
      }
      try {
        const db = getFirebaseDb();
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("createdAt", "desc"), limit(100));
        const snapshot = await getDocs(q);
        const fetched: UserRecord[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
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
          };
        });
        setUsers(fetched);
      } catch {
        // Firestore unavailable
      }
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

  const subscribers = users.filter((u) => u.accountType === "subscriber").length;
  const trialUsers = users.filter((u) => u.subscriptionStatus === "trialing" || u.accountType === "trial").length;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="animate-shimmer h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-6">
        User Management
      </h1>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Users", value: users.length, icon: Users },
          { label: "Subscribers", value: subscribers, icon: Crown },
          { label: "Trial Users", value: trialUsers, icon: Shield },
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
          <p className="text-slate-500 text-sm">
            Users will appear here once people sign up on the site.
          </p>
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
              <option value="trial">Trial</option>
              <option value="free">Free</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          {/* User Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-skyblue-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Trial Ends</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((user) => {
                  const isExpanded = expandedUserId === user.id;
                  const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
                  const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
                  const trialEnd = user.trialEndsAt ? new Date(user.trialEndsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
                  const isTrialExpired = user.trialEndsAt ? new Date(user.trialEndsAt) < new Date() : false;
                  const isTrialing = user.subscriptionStatus === "trialing" || user.accountType === "trial";
                  return (
                    <tr key={user.id} className="hover:bg-skyblue-100">
                      <td className="px-4 py-3" colSpan={isExpanded ? 7 : undefined}>
                        {isExpanded ? (
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-hotpink-100 rounded-full flex items-center justify-center">
                                  <span className="text-lg font-bold text-hotpink-600">
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
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-start gap-2">
                                <Crown className="w-4 h-4 text-hotpink-400 mt-0.5 shrink-0" />
                                <div>
                                  <span className="text-xs font-medium text-slate-400 uppercase block">Account Type</span>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                                    user.accountType === "subscriber" ? "bg-hotpink-200 text-hotpink-600" :
                                    user.accountType === "admin" ? "bg-slate-200 text-slate-700" :
                                    user.accountType === "trial" ? "bg-skyblue-200 text-skyblue-600" :
                                    "bg-skyblue-100 text-slate-600"
                                  }`}>
                                    {user.accountType}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <CreditCard className="w-4 h-4 text-hotpink-400 mt-0.5 shrink-0" />
                                <div>
                                  <span className="text-xs font-medium text-slate-400 uppercase block">Plan</span>
                                  <p className="text-charcoal mt-1">{user.plan || "No plan"}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Calendar className="w-4 h-4 text-hotpink-400 mt-0.5 shrink-0" />
                                <div>
                                  <span className="text-xs font-medium text-slate-400 uppercase block">Joined</span>
                                  <p className="text-charcoal mt-1">{joinDate}</p>
                                </div>
                              </div>
                              {isTrialing && (
                                <div className="flex items-start gap-2">
                                  <Shield className="w-4 h-4 text-skyblue-400 mt-0.5 shrink-0" />
                                  <div>
                                    <span className="text-xs font-medium text-slate-400 uppercase block">Trial Ends</span>
                                    <p className={`mt-1 ${isTrialExpired ? "text-red-500 font-medium" : "text-charcoal"}`}>
                                      {trialEnd}{isTrialExpired ? " (expired)" : ""}
                                    </p>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-start gap-2">
                                <Calendar className="w-4 h-4 text-skyblue-400 mt-0.5 shrink-0" />
                                <div>
                                  <span className="text-xs font-medium text-slate-400 uppercase block">Last Login</span>
                                  <p className="text-charcoal mt-1">{lastLogin}</p>
                                </div>
                              </div>
                            </div>
                            <div className="grid sm:grid-cols-3 gap-4 text-sm pt-2 border-t border-slate-100">
                              <div>
                                <span className="text-xs font-medium text-slate-400 uppercase">City</span>
                                <p className="text-charcoal">{user.homeCity || "Not set"}</p>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-slate-400 uppercase">Game Style</span>
                                <p className="text-charcoal">{user.gameStylePreference || "Not set"}</p>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-slate-400 uppercase">Skill Level</span>
                                <p className="text-charcoal">{user.skillLevel || "Not set"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                              <span className={`text-xs font-medium ${
                                user.subscriptionStatus === "active" ? "text-hotpink-500" :
                                user.subscriptionStatus === "trialing" ? "text-skyblue-500" :
                                "text-slate-400"
                              }`}>
                                Status: {user.subscriptionStatus}
                              </span>
                              <a
                                href={`mailto:${user.email}`}
                                className="ml-auto flex items-center gap-1 bg-skyblue-100 hover:bg-skyblue-200 rounded-lg px-3 py-1.5 text-xs font-medium text-skyblue-700 transition-colors"
                              >
                                <Mail className="w-3.5 h-3.5" /> Send Email
                              </a>
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
                              user.accountType === "trial" ? "bg-skyblue-200 text-skyblue-600" :
                              "bg-skyblue-100 text-slate-600"
                            }`}>
                              {user.accountType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{user.plan || "—"}</td>
                          <td className="px-4 py-3 text-slate-600">{joinDate}</td>
                          <td className="px-4 py-3">
                            {isTrialing ? (
                              <span className={`text-xs font-medium ${isTrialExpired ? "text-red-500" : "text-skyblue-600"}`}>
                                {trialEnd}{isTrialExpired ? " (expired)" : ""}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium ${
                              user.subscriptionStatus === "active" ? "text-hotpink-500" :
                              user.subscriptionStatus === "trialing" ? "text-skyblue-500" :
                              "text-slate-400"
                            }`}>
                              {user.subscriptionStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setExpandedUserId(user.id)}
                              className="p-1.5 hover:bg-skyblue-100 rounded"
                              title="View"
                            >
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
