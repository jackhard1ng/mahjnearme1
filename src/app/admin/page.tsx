"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { mockGames } from "@/lib/mock-data";
import { getAnalytics, DailyStats } from "@/lib/analytics";
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
} from "lucide-react";

export default function AdminDashboardPage() {
  const [games] = useState(mockGames);
  const [analytics, setAnalytics] = useState<{
    totalViews: number;
    todayViews: number;
    dailyStats: DailyStats[];
    topPages: { path: string; views: number }[];
  } | null>(null);

  useEffect(() => {
    getAnalytics(30).then(setAnalytics);
  }, []);

  // Real stats from actual game data
  const activeGames = games.filter((g) => g.status === "active").length;
  const promotedGames = games.filter((g) => g.promoted).length;
  const cities = new Set(games.map((g) => `${g.city}, ${g.state}`));
  const states = new Set(games.map((g) => g.state));
  const gameStyles = new Set(games.map((g) => g.gameStyle));

  // Recent games for the overview
  const recentGames = games.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
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

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <GamepadIcon className="w-5 h-5 text-hotpink-500" />
            <span className="text-xs font-medium text-hotpink-500 bg-skyblue-100 px-2 py-0.5 rounded-full">
              {activeGames} active
            </span>
          </div>
          <p className="text-2xl font-bold text-charcoal">{games.length}</p>
          <p className="text-sm text-slate-500">Total Listings</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <MapPin className="w-5 h-5 text-skyblue-500" />
            <span className="text-xs font-medium text-skyblue-600 bg-skyblue-100 px-2 py-0.5 rounded-full">
              {states.size} state{states.size !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-2xl font-bold text-charcoal">{cities.size}</p>
          <p className="text-sm text-slate-500">Cities Covered</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-5 h-5 text-hotpink-500" />
            <span className="text-xs font-medium text-hotpink-500 bg-softpink-100 px-2 py-0.5 rounded-full">
              {promotedGames} featured
            </span>
          </div>
          <p className="text-2xl font-bold text-charcoal">{activeGames}</p>
          <p className="text-sm text-slate-500">Active Listings</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <Eye className="w-5 h-5 text-hotpink-500" />
            <span className="text-xs font-medium text-hotpink-500 bg-softpink-100 px-2 py-0.5 rounded-full">
              today
            </span>
          </div>
          <p className="text-2xl font-bold text-charcoal">{analytics?.todayViews ?? "—"}</p>
          <p className="text-sm text-slate-500">Views Today</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-skyblue-500" />
            <span className="text-xs font-medium text-skyblue-600 bg-skyblue-100 px-2 py-0.5 rounded-full">
              30 days
            </span>
          </div>
          <p className="text-2xl font-bold text-charcoal">{analytics?.totalViews ?? "—"}</p>
          <p className="text-sm text-slate-500">Total Page Views</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Listings */}
        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="px-5 py-4 border-b border-white flex items-center justify-between">
            <h2 className="font-semibold text-charcoal flex items-center gap-2">
              <GamepadIcon className="w-5 h-5 text-hotpink-500" />
              Recent Listings
            </h2>
            <Link href="/admin/games" className="text-sm text-hotpink-500 hover:text-hotpink-600 font-medium">
              View All
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentGames.map((game) => (
              <div key={game.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-charcoal">{game.name}</p>
                  <p className="text-xs text-slate-500">{game.city}, {game.state}</p>
                </div>
                <div className="flex items-center gap-2">
                  {game.promoted && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-skyblue-600 bg-skyblue-100 border border-skyblue-200 rounded-full px-2 py-0.5">
                      <Star className="w-3 h-3" /> Featured
                    </span>
                  )}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    game.status === "active" ? "bg-hotpink-100 text-hotpink-600" : "bg-skyblue-100 text-skyblue-600"
                  }`}>
                    {game.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions + Coverage Breakdown */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl">
            <div className="px-5 py-4 border-b border-white">
              <h2 className="font-semibold text-charcoal">Quick Actions</h2>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              <Link
                href="/admin/games?action=new"
                className="flex flex-col items-center gap-2 bg-skyblue-50 hover:bg-softpink-100 border border-slate-200 hover:border-hotpink-200 rounded-xl p-4 transition-colors"
              >
                <Plus className="w-6 h-6 text-hotpink-500" />
                <span className="text-sm font-medium text-slate-700">Add Game</span>
              </Link>
              <Link
                href="/admin/games?action=csv"
                className="flex flex-col items-center gap-2 bg-skyblue-50 hover:bg-softpink-100 border border-slate-200 hover:border-hotpink-200 rounded-xl p-4 transition-colors"
              >
                <Upload className="w-6 h-6 text-hotpink-500" />
                <span className="text-sm font-medium text-slate-700">CSV Upload</span>
              </Link>
              <Link
                href="/admin/users"
                className="flex flex-col items-center gap-2 bg-skyblue-50 hover:bg-softpink-100 border border-slate-200 hover:border-hotpink-200 rounded-xl p-4 transition-colors"
              >
                <UserPlus className="w-6 h-6 text-hotpink-500" />
                <span className="text-sm font-medium text-slate-700">Users</span>
              </Link>
              <Link
                href="/admin/submissions"
                className="flex flex-col items-center gap-2 bg-skyblue-50 hover:bg-softpink-100 border border-slate-200 hover:border-hotpink-200 rounded-xl p-4 transition-colors"
              >
                <FileSpreadsheet className="w-6 h-6 text-hotpink-500" />
                <span className="text-sm font-medium text-slate-700">Inquiries</span>
              </Link>
            </div>
          </div>

          {/* Top Pages */}
          {analytics && analytics.topPages.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl">
              <div className="px-5 py-4 border-b border-white">
                <h2 className="font-semibold text-charcoal flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-hotpink-500" />
                  Top Pages (30 days)
                </h2>
              </div>
              <div className="divide-y divide-slate-50">
                {analytics.topPages.map((page) => (
                  <div key={page.path} className="px-5 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-charcoal font-mono">{page.path}</span>
                    <span className="text-xs font-semibold text-skyblue-600 bg-skyblue-50 px-2.5 py-0.5 rounded-full">
                      {page.views} view{page.views !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coverage Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl">
            <div className="px-5 py-4 border-b border-white">
              <h2 className="font-semibold text-charcoal">Coverage by City</h2>
            </div>
            <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
              {[...cities].map((city) => {
                const count = games.filter((g) => `${g.city}, ${g.state}` === city).length;
                return (
                  <div key={city} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-hotpink-400" />
                      <span className="text-sm font-medium text-charcoal">{city}</span>
                    </div>
                    <span className="text-xs font-semibold text-hotpink-600 bg-hotpink-50 px-2.5 py-0.5 rounded-full">
                      {count} game{count !== 1 ? "s" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
