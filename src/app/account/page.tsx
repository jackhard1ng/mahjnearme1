"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  MapPin,
  Heart,
  CreditCard,
  Bell,
  Crown,
  ChevronRight,
  Plus,
  X,
  LogOut,
  Pencil,
  Check,
} from "lucide-react";

const SKILL_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const STYLE_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "american", label: "American" },
  { value: "chinese", label: "Chinese / Hong Kong" },
  { value: "riichi", label: "Japanese Riichi" },
  { value: "other", label: "Other" },
];

export default function AccountPage() {
  const { user, userProfile, hasAccess, signOut, loading, updateUserProfile } = useAuth();
  const router = useRouter();
  const [savedCity, setSavedCity] = useState("");

  // Editable fields
  const [editing, setEditing] = useState<string | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editSkillLevel, setEditSkillLevel] = useState("");
  const [editGameStyle, setEditGameStyle] = useState("");
  const [editHomeCity, setEditHomeCity] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user || !userProfile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="animate-shimmer h-96 rounded-xl" />
      </div>
    );
  }

  const trialDaysLeft = userProfile.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(userProfile.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  function startEdit(field: string) {
    setEditing(field);
    if (field === "displayName") setEditDisplayName(userProfile!.displayName || "");
    if (field === "skillLevel") setEditSkillLevel(userProfile!.skillLevel || "");
    if (field === "gameStylePreference") setEditGameStyle(userProfile!.gameStylePreference || "");
    if (field === "homeCity") setEditHomeCity(userProfile!.homeCity || "");
  }

  function saveEdit(field: string) {
    const updates: Record<string, string> = {};
    if (field === "displayName") updates.displayName = editDisplayName;
    if (field === "skillLevel") updates.skillLevel = editSkillLevel;
    if (field === "gameStylePreference") updates.gameStylePreference = editGameStyle;
    if (field === "homeCity") updates.homeCity = editHomeCity;
    updateUserProfile(updates);
    setEditing(null);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-charcoal mb-8">
        Account Settings
      </h1>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-hotpink-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-hotpink-600" />
            </div>
            <div>
              <h2 className="font-semibold text-xl text-charcoal">{userProfile.displayName || "Player"}</h2>
              <p className="text-sm text-slate-500">{userProfile.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-hotpink-100 text-hotpink-600">
                  {userProfile.accountType === "trial" ? "Free Trial" :
                   userProfile.accountType === "subscriber" ? "Subscriber" :
                   userProfile.accountType === "admin" ? "Admin" :
                   "Free"}
                </span>
                {hasAccess && userProfile.accountType === "subscriber" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-skyblue-100 text-skyblue-600">
                    <Crown className="w-3 h-3" /> Verified Player
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Display Name */}
            <div className="group">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Display Name</label>
              {editing === "displayName" ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    className="border border-hotpink-300 rounded-lg px-3 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-hotpink-200"
                    autoFocus
                  />
                  <button onClick={() => saveEdit("displayName")} className="p-1.5 text-hotpink-500 hover:bg-hotpink-50 rounded-lg">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditing(null)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-charcoal font-medium">{userProfile.displayName || "Not set"}</p>
                  <button onClick={() => startEdit("displayName")} className="p-1 text-slate-400 hover:text-hotpink-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Email (not editable) */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</label>
              <p className="text-charcoal font-medium">{userProfile.email}</p>
            </div>

            {/* Skill Level */}
            <div className="group">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Skill Level</label>
              {editing === "skillLevel" ? (
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={editSkillLevel}
                    onChange={(e) => setEditSkillLevel(e.target.value)}
                    className="border border-hotpink-300 rounded-lg px-3 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-hotpink-200 bg-white"
                    autoFocus
                  >
                    {SKILL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <button onClick={() => saveEdit("skillLevel")} className="p-1.5 text-hotpink-500 hover:bg-hotpink-50 rounded-lg">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditing(null)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-charcoal font-medium capitalize">{userProfile.skillLevel || "Not set"}</p>
                  <button onClick={() => startEdit("skillLevel")} className="p-1 text-slate-400 hover:text-hotpink-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Game Style */}
            <div className="group">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Game Style Preference</label>
              {editing === "gameStylePreference" ? (
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={editGameStyle}
                    onChange={(e) => setEditGameStyle(e.target.value)}
                    className="border border-hotpink-300 rounded-lg px-3 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-hotpink-200 bg-white"
                    autoFocus
                  >
                    {STYLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <button onClick={() => saveEdit("gameStylePreference")} className="p-1.5 text-hotpink-500 hover:bg-hotpink-50 rounded-lg">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditing(null)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-charcoal font-medium capitalize">{userProfile.gameStylePreference || "Not set"}</p>
                  <button onClick={() => startEdit("gameStylePreference")} className="p-1 text-slate-400 hover:text-hotpink-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Home City */}
            <div className="group">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Home City</label>
              {editing === "homeCity" ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={editHomeCity}
                    onChange={(e) => setEditHomeCity(e.target.value)}
                    className="border border-hotpink-300 rounded-lg px-3 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-hotpink-200"
                    placeholder="e.g. Nashville, TN"
                    autoFocus
                  />
                  <button onClick={() => saveEdit("homeCity")} className="p-1.5 text-hotpink-500 hover:bg-hotpink-50 rounded-lg">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditing(null)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-charcoal font-medium">{userProfile.homeCity || "Not set"}</p>
                  <button onClick={() => startEdit("homeCity")} className="p-1 text-slate-400 hover:text-hotpink-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subscription Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-lg text-charcoal mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-hotpink-500" />
            Subscription
          </h3>

          {userProfile.accountType === "free" && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-700">Free Account</p>
                  <p className="text-sm text-slate-500">
                    Upgrade to see full game details, maps, and more.
                  </p>
                </div>
                <Link
                  href="/pricing"
                  className="bg-hotpink-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors"
                >
                  View Plans
                </Link>
              </div>
            </div>
          )}

          {userProfile.accountType === "trial" && (
            <div className="bg-softpink-100 border border-hotpink-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-hotpink-600">Free Trial</p>
                  <p className="text-sm text-hotpink-500">
                    {trialDaysLeft > 0 ? `${trialDaysLeft} days remaining` : "Trial expired"}
                  </p>
                </div>
                <Link
                  href="/pricing"
                  className="bg-hotpink-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors"
                >
                  Subscribe Now
                </Link>
              </div>
            </div>
          )}

          {userProfile.accountType === "subscriber" && (
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Plan</span>
                <span className="text-sm font-medium text-charcoal capitalize">{userProfile.plan || "Monthly"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Status</span>
                <span className="text-sm font-medium text-hotpink-500">Active</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-600">Next billing date</span>
                <span className="text-sm font-medium text-charcoal">
                  {userProfile.subscriptionEndsAt
                    ? new Date(userProfile.subscriptionEndsAt).toLocaleDateString()
                    : "—"}
                </span>
              </div>
              <button className="text-sm text-hotpink-500 hover:text-hotpink-600 font-medium mt-2">
                Manage Subscription (Stripe Portal)
              </button>
            </div>
          )}
        </div>

        {/* Saved Cities */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-lg text-charcoal mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-hotpink-500" />
            Saved Cities
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {userProfile.savedCities.length === 0 && (
              <p className="text-sm text-slate-500">No saved cities yet. Save cities to get alerts about new games!</p>
            )}
            {userProfile.savedCities.map((city) => (
              <span key={city} className="inline-flex items-center gap-1.5 bg-skyblue-100 rounded-lg px-3 py-1.5 text-sm text-slate-700">
                {city}
                <button className="text-slate-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={savedCity}
              onChange={(e) => setSavedCity(e.target.value)}
              placeholder="Add a city..."
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1"
            />
            <button className="bg-hotpink-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>

        {/* Favorite Games */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-lg text-charcoal mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-hotpink-500" />
            Favorite Games
          </h3>
          {userProfile.favoriteGames.length === 0 ? (
            <p className="text-sm text-slate-500">
              No favorite games yet. Heart a game on the search page to save it here!
            </p>
          ) : (
            <div className="space-y-2">
              {userProfile.favoriteGames.map((gameId) => (
                <div key={gameId} className="flex items-center justify-between bg-skyblue-50 rounded-lg px-4 py-3">
                  <span className="text-sm text-slate-700">{gameId}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notification Preferences */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-lg text-charcoal mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-hotpink-500" />
            Notifications
          </h3>
          <div className="space-y-3">
            {[
              { label: "New games in saved cities", enabled: true },
              { label: "Weekly digest email", enabled: true },
              { label: "Trial expiration reminders", enabled: true },
              { label: "Product recommendations", enabled: false },
            ].map((pref) => (
              <div key={pref.label} className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-700">{pref.label}</span>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    pref.enabled ? "bg-hotpink-500" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      pref.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={() => {
            signOut();
            router.push("/");
          }}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
