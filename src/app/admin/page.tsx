"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { mockGames } from "@/lib/mock-data";
import {
  LayoutDashboard,
  Users,
  GamepadIcon,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Upload,
  Plus,
  FileSpreadsheet,
  UserPlus,
  ShieldCheck,
  Star,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router, isAdmin]);

  if (loading || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="animate-shimmer h-96 rounded-xl" />
      </div>
    );
  }

  const activeGames = mockGames.filter((g) => g.status === "active").length;
  const pendingGames = mockGames.filter((g) => g.status === "pending").length;
  const verifiedGames = mockGames.filter((g) => g.verified).length;
  const unverifiedGames = mockGames.filter((g) => !g.verified).length;
  const promotedGames = mockGames.filter((g) => g.promoted).length;

  // Mock stats
  const stats = {
    totalGames: mockGames.length,
    activeGames,
    pendingGames,
    totalUsers: 47,
    trialUsers: 22,
    subscribers: 15,
    organizers: 10,
    monthlyRevenue: "$74.85",
    unverifiedGames,
  };

  // Games split by verification status
  const unverifiedList = mockGames.filter((g) => !g.verified);
  const recentlyVerified = mockGames.filter((g) => g.verified).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-slate-900">
            Admin Dashboard
          </h1>
          <p className="text-slate-500 mt-1">MahjNearMe management console</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/games"
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <GamepadIcon className="w-4 h-4" /> Manage Games
          </Link>
          <Link
            href="/admin/games?action=new"
            className="flex items-center gap-2 bg-jade-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-jade-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Quick Add Game
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <GamepadIcon className="w-5 h-5 text-jade-600" />
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              {stats.activeGames} active
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.totalGames}</p>
          <p className="text-sm text-slate-500">Total Games</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-medium text-jade-600 bg-jade-50 px-2 py-0.5 rounded-full">
              {stats.subscribers} paid
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.totalUsers}</p>
          <p className="text-sm text-slate-500">Total Users</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.monthlyRevenue}</p>
          <p className="text-sm text-slate-500">Monthly Revenue</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <ShieldCheck className="w-5 h-5 text-jade-600" />
            {unverifiedGames > 0 && (
              <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                {unverifiedGames} unverified
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-slate-800">{verifiedGames}/{stats.totalGames}</p>
          <p className="text-sm text-slate-500">Verified Listings</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Unverified Listings */}
        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Unverified Listings
            </h2>
            <Link href="/admin/games?filter=unverified" className="text-sm text-jade-600 hover:text-jade-700 font-medium">
              View All
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {unverifiedList.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">All listings are verified!</p>
              </div>
            ) : (
              unverifiedList.map((game) => (
                <div key={game.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{game.name}</p>
                    <p className="text-xs text-slate-500">{game.city}, {game.state}</p>
                  </div>
                  <button className="flex items-center gap-1 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg px-3 py-1.5 text-xs font-medium text-green-700 transition-colors">
                    <CheckCircle className="w-3.5 h-3.5" /> Verify
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions + Organizer Management */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Quick Actions</h2>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              <Link
                href="/admin/games?action=new"
                className="flex flex-col items-center gap-2 bg-slate-50 hover:bg-jade-50 border border-slate-200 hover:border-jade-200 rounded-xl p-4 transition-colors"
              >
                <Plus className="w-6 h-6 text-jade-600" />
                <span className="text-sm font-medium text-slate-700">Add Game</span>
              </Link>
              <Link
                href="/admin/games?action=csv"
                className="flex flex-col items-center gap-2 bg-slate-50 hover:bg-jade-50 border border-slate-200 hover:border-jade-200 rounded-xl p-4 transition-colors"
              >
                <Upload className="w-6 h-6 text-jade-600" />
                <span className="text-sm font-medium text-slate-700">CSV Upload</span>
              </Link>
              <Link
                href="/admin/users"
                className="flex flex-col items-center gap-2 bg-slate-50 hover:bg-jade-50 border border-slate-200 hover:border-jade-200 rounded-xl p-4 transition-colors"
              >
                <UserPlus className="w-6 h-6 text-jade-600" />
                <span className="text-sm font-medium text-slate-700">Users</span>
              </Link>
              <Link
                href="/admin/submissions"
                className="flex flex-col items-center gap-2 bg-slate-50 hover:bg-jade-50 border border-slate-200 hover:border-jade-200 rounded-xl p-4 transition-colors"
              >
                <FileSpreadsheet className="w-6 h-6 text-jade-600" />
                <span className="text-sm font-medium text-slate-700">Submissions</span>
              </Link>
            </div>
          </div>

          {/* Verified Listings Overview */}
          <div className="bg-white border border-slate-200 rounded-xl">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Verified Listings
              </h2>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-600 font-medium">{verifiedGames} verified</span>
                <span className="text-slate-300">&middot;</span>
                <span className="text-gold-600 font-medium">{promotedGames} featured</span>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {recentlyVerified.map((game) => (
                <div key={game.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{game.name}</p>
                      <p className="text-xs text-slate-500">{game.city}, {game.state}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {game.promoted && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gold-600 bg-gold-50 border border-gold-200 rounded-full px-2 py-0.5">
                        <Star className="w-3 h-3" /> Featured
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </span>
                    <button className="flex items-center gap-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 transition-colors">
                      <XCircle className="w-3.5 h-3.5" /> Unverify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Signups */}
          <div className="bg-white border border-slate-200 rounded-xl">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Recent Signups</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {[
                { name: "Jane D.", type: "trial", time: "2 hours ago" },
                { name: "Carol S.", type: "subscriber", time: "5 hours ago" },
                { name: "Mike R.", type: "organizer", time: "1 day ago" },
                { name: "Barbara T.", type: "trial", time: "2 days ago" },
              ].map((signup, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{signup.name}</p>
                      <p className="text-xs text-slate-500">{signup.time}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    signup.type === "subscriber" ? "bg-jade-50 text-jade-700" :
                    signup.type === "organizer" ? "bg-purple-50 text-purple-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {signup.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
