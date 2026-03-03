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
  Clock,
  TrendingUp,
  Upload,
  Plus,
  FileSpreadsheet,
  UserPlus,
  ShieldCheck,
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
    needsVerification: 2,
  };

  // Games needing verification (oldest lastVerified)
  const needsVerification = [...mockGames]
    .sort((a, b) => new Date(a.lastVerified).getTime() - new Date(b.lastVerified).getTime())
    .slice(0, 5);

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
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Quick Add Game
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <GamepadIcon className="w-5 h-5 text-teal-600" />
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
            <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
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
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            {stats.pendingGames > 0 && (
              <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                {stats.pendingGames} pending
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.needsVerification}</p>
          <p className="text-sm text-slate-500">Needs Verification</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Needs Verification */}
        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              Needs Verification
            </h2>
            <Link href="/admin/games?filter=unverified" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
              View All
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {needsVerification.map((game) => {
              const daysSince = Math.floor(
                (Date.now() - new Date(game.lastVerified).getTime()) / (1000 * 60 * 60 * 24)
              );
              const isOld = daysSince > 90;
              return (
                <div key={game.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{game.name}</p>
                    <p className="text-xs text-slate-500">{game.city}, {game.state}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium ${isOld ? "text-red-600" : "text-yellow-600"}`}>
                      {daysSince}d ago
                    </span>
                    <button className="flex items-center gap-1 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg px-3 py-1.5 text-xs font-medium text-green-700 transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" /> Verify
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Quick Actions</h2>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              <Link
                href="/admin/games?action=new"
                className="flex flex-col items-center gap-2 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 rounded-xl p-4 transition-colors"
              >
                <Plus className="w-6 h-6 text-teal-600" />
                <span className="text-sm font-medium text-slate-700">Add Game</span>
              </Link>
              <Link
                href="/admin/games?action=csv"
                className="flex flex-col items-center gap-2 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 rounded-xl p-4 transition-colors"
              >
                <Upload className="w-6 h-6 text-teal-600" />
                <span className="text-sm font-medium text-slate-700">CSV Upload</span>
              </Link>
              <Link
                href="/admin/users"
                className="flex flex-col items-center gap-2 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 rounded-xl p-4 transition-colors"
              >
                <UserPlus className="w-6 h-6 text-teal-600" />
                <span className="text-sm font-medium text-slate-700">Users</span>
              </Link>
              <Link
                href="/admin/submissions"
                className="flex flex-col items-center gap-2 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 rounded-xl p-4 transition-colors"
              >
                <FileSpreadsheet className="w-6 h-6 text-teal-600" />
                <span className="text-sm font-medium text-slate-700">Submissions</span>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
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
                    signup.type === "subscriber" ? "bg-teal-50 text-teal-700" :
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
