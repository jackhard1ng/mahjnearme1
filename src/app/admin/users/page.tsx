"use client";

import { useState } from "react";
import { Search, Users, Crown, Shield, Eye, ChevronDown, X, Mail, Calendar, CreditCard } from "lucide-react";

const mockUsers = [
  { id: "1", name: "Jane D.", email: "jane@example.com", type: "subscriber", plan: "annual", joined: "Jan 15, 2026", status: "active", lastLogin: "Mar 2, 2026", gamesAttended: 12, favoriteStyle: "American", city: "Nashville, TN" },
  { id: "2", name: "Carol S.", email: "carol@example.com", type: "subscriber", plan: "monthly", joined: "Jan 20, 2026", status: "active", lastLogin: "Mar 1, 2026", gamesAttended: 8, favoriteStyle: "American", city: "Dallas, TX" },
  { id: "3", name: "Mike R.", email: "mike@example.com", type: "organizer", plan: null, joined: "Feb 1, 2026", status: "active", lastLogin: "Feb 28, 2026", gamesAttended: 24, favoriteStyle: "Riichi", city: "Chicago, IL" },
  { id: "4", name: "Barbara T.", email: "barb@example.com", type: "trial", plan: null, joined: "Feb 25, 2026", status: "trialing", lastLogin: "Mar 2, 2026", gamesAttended: 2, favoriteStyle: "American", city: "Miami, FL" },
  { id: "5", name: "Linda M.", email: "linda@example.com", type: "trial", plan: null, joined: "Feb 28, 2026", status: "trialing", lastLogin: "Mar 1, 2026", gamesAttended: 1, favoriteStyle: "Chinese", city: "New York, NY" },
  { id: "6", name: "Patricia W.", email: "patricia@example.com", type: "free", plan: null, joined: "Mar 1, 2026", status: "expired", lastLogin: "Mar 1, 2026", gamesAttended: 0, favoriteStyle: "American", city: "Denver, CO" },
];

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const filtered = mockUsers.filter((u) => {
    const matchesSearch = !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || u.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleToggleView = (userId: string) => {
    setExpandedUserId((prev) => (prev === userId ? null : userId));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-6">
        User Management
      </h1>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Users", value: mockUsers.length, icon: Users },
          { label: "Subscribers", value: mockUsers.filter((u) => u.type === "subscriber").length, icon: Crown },
          { label: "Trial Users", value: mockUsers.filter((u) => u.type === "trial").length, icon: Shield },
          { label: "Organizers", value: mockUsers.filter((u) => u.type === "organizer").length, icon: Users },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <s.icon className="w-5 h-5 text-hotpink-500 mb-2" />
            <p className="text-2xl font-bold text-charcoal">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

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
          <option value="organizer">Organizers</option>
          <option value="free">Free</option>
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((user) => {
              const isExpanded = expandedUserId === user.id;
              return (
                <tr key={user.id} className="hover:bg-skyblue-100">
                  <td className="px-4 py-3" colSpan={isExpanded ? 6 : undefined}>
                    {isExpanded ? (
                      /* Expanded user detail view */
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-hotpink-100 rounded-full flex items-center justify-center">
                              <span className="text-lg font-bold text-hotpink-600">
                                {user.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-lg text-charcoal">{user.name}</p>
                              <p className="text-sm text-slate-500">{user.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setExpandedUserId(null)}
                            className="p-1.5 hover:bg-slate-100 rounded"
                          >
                            <X className="w-4 h-4 text-slate-400" />
                          </button>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-start gap-2">
                            <Crown className="w-4 h-4 text-hotpink-400 mt-0.5 shrink-0" />
                            <div>
                              <span className="text-xs font-medium text-slate-400 uppercase block">Account Type</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                                user.type === "subscriber" ? "bg-hotpink-200 text-hotpink-600" :
                                user.type === "organizer" ? "bg-slate-200 text-skyblue-600" :
                                user.type === "trial" ? "bg-skyblue-200 text-skyblue-600" :
                                "bg-skyblue-100 text-slate-600"
                              }`}>
                                {user.type}
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
                              <p className="text-charcoal mt-1">{user.joined}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-skyblue-400 mt-0.5 shrink-0" />
                            <div>
                              <span className="text-xs font-medium text-slate-400 uppercase block">Last Login</span>
                              <p className="text-charcoal mt-1">{user.lastLogin}</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-4 text-sm pt-2 border-t border-slate-100">
                          <div>
                            <span className="text-xs font-medium text-slate-400 uppercase">City</span>
                            <p className="text-charcoal">{user.city}</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-slate-400 uppercase">Favorite Style</span>
                            <p className="text-charcoal">{user.favoriteStyle}</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-slate-400 uppercase">Games Attended</span>
                            <p className="text-charcoal">{user.gamesAttended}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                          <span className={`text-xs font-medium ${
                            user.status === "active" ? "text-hotpink-500" :
                            user.status === "trialing" ? "text-skyblue-500" :
                            "text-slate-400"
                          }`}>
                            Status: {user.status}
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
                        <p className="font-medium text-charcoal">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </>
                    )}
                  </td>
                  {!isExpanded && (
                    <>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.type === "subscriber" ? "bg-hotpink-200 text-hotpink-600" :
                          user.type === "organizer" ? "bg-slate-200 text-skyblue-600" :
                          user.type === "trial" ? "bg-skyblue-200 text-skyblue-600" :
                          "bg-skyblue-100 text-slate-600"
                        }`}>
                          {user.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{user.plan || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{user.joined}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${
                          user.status === "active" ? "text-hotpink-500" :
                          user.status === "trialing" ? "text-skyblue-500" :
                          "text-slate-400"
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleToggleView(user.id)}
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
    </div>
  );
}
