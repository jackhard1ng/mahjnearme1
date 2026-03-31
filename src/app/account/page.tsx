"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { getCitiesWithGames } from "@/lib/mock-data";
import { getStateName } from "@/lib/utils";
import METRO_REGIONS, { findMetroByAbbreviation } from "@/lib/metro-regions";
import { HOME_METRO_CHANGE_COOLDOWN_DAYS } from "@/lib/constants";
import ReferralDashboard from "@/components/ReferralDashboard";
import NotificationPreferences from "@/components/NotificationPreferences";
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
  AlertTriangle,
  ExternalLink,
  Loader2,
  Shield,
  Camera,
  MessageSquare,
  Star,
} from "lucide-react";

const AVATAR_COLORS = [
  { value: "hotpink", bg: "bg-hotpink-500", ring: "ring-hotpink-300" },
  { value: "skyblue", bg: "bg-skyblue-400", ring: "ring-skyblue-300" },
  { value: "purple", bg: "bg-purple-500", ring: "ring-purple-300" },
  { value: "emerald", bg: "bg-emerald-500", ring: "ring-emerald-300" },
  { value: "amber", bg: "bg-amber-500", ring: "ring-amber-300" },
  { value: "rose", bg: "bg-rose-500", ring: "ring-rose-300" },
  { value: "indigo", bg: "bg-indigo-500", ring: "ring-indigo-300" },
  { value: "teal", bg: "bg-teal-500", ring: "ring-teal-300" },
];

function getAvatarBg(color: string | null | undefined): string {
  const found = AVATAR_COLORS.find((c) => c.value === color);
  return found ? found.bg : "bg-hotpink-100";
}

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

const allCities = getCitiesWithGames().map((c) => `${c.city}, ${getStateName(c.state)}`);

export default function AccountPage() {
  const { user, userProfile, hasAccess, signOut, loading, updateUserProfile, isContributor } = useAuth();
  const router = useRouter();
  const [savedCity, setSavedCity] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [portalLoading, setPortalLoading] = useState(false);
  const [nextBillingDate, setNextBillingDate] = useState<string | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save feedback
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Editable fields
  const [editing, setEditing] = useState<string | null>(null);
  const [editingAll, setEditingAll] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editSkillLevel, setEditSkillLevel] = useState("");
  const [editGameStyle, setEditGameStyle] = useState("");
  const [editHomeCity, setEditHomeCity] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Fetch billing date from Stripe if not stored locally
  useEffect(() => {
    if (userProfile?.subscriptionEndsAt) {
      setNextBillingDate(userProfile.subscriptionEndsAt);
      return;
    }
    if (userProfile?.stripeCustomerId) {
      fetch(`/api/billing-date?customerId=${userProfile.stripeCustomerId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.nextBillingDate) {
            setNextBillingDate(d.nextBillingDate);
            // Also save it to Firestore for next time
            updateUserProfile({ subscriptionEndsAt: d.nextBillingDate });
          }
        })
        .catch(() => {});
    } else if (userProfile?.subscribedDate) {
      // Fallback: estimate from subscribed date + plan interval
      const subDate = new Date(userProfile.subscribedDate);
      const now = new Date();
      if (userProfile.plan === "annual") {
        while (subDate <= now) subDate.setFullYear(subDate.getFullYear() + 1);
      } else {
        while (subDate <= now) subDate.setMonth(subDate.getMonth() + 1);
      }
      setNextBillingDate(subDate.toISOString());
    }
  }, [userProfile?.subscriptionEndsAt, userProfile?.stripeCustomerId, userProfile?.subscribedDate]);

  if (loading || !user || !userProfile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="animate-shimmer h-96 rounded-xl" />
      </div>
    );
  }

  const trialDaysLeft = 0; // Legacy trial support removed

  function startEditAll() {
    setEditingAll(true);
    setEditDisplayName(userProfile!.displayName || "");
    setEditSkillLevel(userProfile!.skillLevel || "");
    setEditGameStyle(userProfile!.gameStylePreference || "");
    setEditHomeCity(userProfile!.homeCity || "");
  }

  async function saveAll() {
    setSaveStatus("saving");
    const ok = await updateUserProfile({
      displayName: editDisplayName,
      skillLevel: (editSkillLevel || null) as "beginner" | "intermediate" | "advanced" | null,
      gameStylePreference: (editGameStyle || null) as "american" | "chinese" | "riichi" | "other" | "any" | null,
      homeCity: editHomeCity,
    });
    setSaveStatus(ok ? "saved" : "error");
    if (ok) { setEditingAll(false); setEditing(null); }
    setTimeout(() => setSaveStatus("idle"), 3000);
  }

  function cancelEditAll() {
    setEditingAll(false);
    setEditing(null);
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // TODO: Move to CDN before production (e.g., Firebase Storage, Cloudflare R2, or S3)
    // Convert to base64 data URL for storage
    setPhotoUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      updateUserProfile({ photoURL: dataUrl, avatarColor: null });
      setPhotoUploading(false);
      setEditingAvatar(false);
    };
    reader.onerror = () => {
      setPhotoUploading(false);
    };
    reader.readAsDataURL(file);
  }

  function startEdit(field: string) {
    setEditing(field);
    if (field === "displayName") setEditDisplayName(userProfile!.displayName || "");
    if (field === "skillLevel") setEditSkillLevel(userProfile!.skillLevel || "");
    if (field === "gameStylePreference") setEditGameStyle(userProfile!.gameStylePreference || "");
    if (field === "homeCity") setEditHomeCity(userProfile!.homeCity || "");
  }

  async function saveEdit(field: string) {
    const updates: Record<string, string> = {};
    if (field === "displayName") updates.displayName = editDisplayName;
    if (field === "skillLevel") updates.skillLevel = editSkillLevel;
    if (field === "gameStylePreference") updates.gameStylePreference = editGameStyle;
    if (field === "homeCity") updates.homeCity = editHomeCity;
    setSaveStatus("saving");
    const ok = await updateUserProfile(updates);
    setSaveStatus(ok ? "saved" : "error");
    if (ok) setEditing(null);
    setTimeout(() => setSaveStatus("idle"), 3000);
  }

  const isFieldEditing = (field: string) => editingAll || editing === field;

  // Saved cities autocomplete
  const citySuggestions = useMemo(() => {
    if (!savedCity.trim()) return [];
    const q = savedCity.toLowerCase();
    const saved = new Set(userProfile?.savedCities || []);
    return allCities
      .filter((c) => c.toLowerCase().includes(q) && !saved.has(c))
      .slice(0, 6);
  }, [savedCity, userProfile?.savedCities]);

  function addSavedCity(city: string) {
    if (!userProfile || (userProfile.savedCities || []).includes(city)) return;
    updateUserProfile({ savedCities: [...(userProfile.savedCities || []), city] });
    setSavedCity("");
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  }

  function removeSavedCity(city: string) {
    if (!userProfile) return;
    updateUserProfile({ savedCities: (userProfile.savedCities || []).filter((c) => c !== city) });
  }

  function handleCityKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, citySuggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && citySuggestions[highlightedIndex]) {
        addSavedCity(citySuggestions[highlightedIndex]);
      } else if (citySuggestions.length === 1) {
        addSavedCity(citySuggestions[0]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  async function handleManageSubscription() {
    if (!userProfile?.stripeCustomerId) {
      // No Stripe customer ID — redirect to pricing instead
      window.location.href = "/pricing";
      return;
    }
    setPortalLoading(true);
    try {
      const res = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripeCustomerId: userProfile.stripeCustomerId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Could not open subscription management. Please try again.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-charcoal mb-8">
        Account Settings
      </h1>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setEditingAvatar(!editingAvatar)}
                className="relative w-16 h-16 rounded-full flex items-center justify-center shrink-0 group"
                title="Change avatar"
              >
                {userProfile.photoURL ? (
                  <img src={userProfile.photoURL} alt="" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${userProfile.avatarColor ? getAvatarBg(userProfile.avatarColor) : "bg-hotpink-100"}`}>
                    <span className={`text-2xl font-bold ${userProfile.avatarColor ? "text-white" : "text-hotpink-600"}`}>
                      {(userProfile.displayName || userProfile.email || "?")[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Pencil className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
              <div>
                <h2 className="font-semibold text-xl text-charcoal">{userProfile.displayName || "Player"}</h2>
                <p className="text-sm text-slate-500">{userProfile.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-hotpink-100 text-hotpink-600">
                    {userProfile.accountType === "subscriber" ? "Subscriber" :
                     userProfile.accountType === "contributor" ? "Contributor" :
                     userProfile.accountType === "admin" ? "Admin" :
                     "Free"}
                  </span>
                  {isContributor && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-skyblue-100 text-skyblue-600">
                      <Shield className="w-3 h-3" /> Community Contributor
                    </span>
                  )}
                  {userProfile.isGrandfathered && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                      <Star className="w-3 h-3" /> Founding Member
                    </span>
                  )}
                  {hasAccess && userProfile.accountType === "subscriber" && !isContributor && !userProfile.isGrandfathered && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-skyblue-100 text-skyblue-600">
                      <Crown className="w-3 h-3" /> Verified Player
                    </span>
                  )}
                </div>
              </div>
            </div>
            {!editingAll ? (
              <button
                onClick={startEditAll}
                className="flex items-center gap-1.5 bg-hotpink-50 text-hotpink-500 border border-hotpink-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-hotpink-100 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={saveAll}
                  disabled={saveStatus === "saving"}
                  className="flex items-center gap-1.5 bg-hotpink-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors disabled:opacity-50"
                >
                  {saveStatus === "saving" ? "Saving..." : <><Check className="w-3.5 h-3.5" /> Save All</>}
                </button>
                <button
                  onClick={cancelEditAll}
                  className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                {saveStatus === "saved" && <span className="text-xs text-green-600 font-medium">Saved</span>}
                {saveStatus === "error" && <span className="text-xs text-red-500 font-medium">Save failed — try again</span>}
              </div>
            )}
          </div>

          {/* Avatar Color Picker + Photo Upload */}
          {editingAvatar && (
            <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Upload a Photo</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoUploading}
                  className="flex items-center gap-2 bg-hotpink-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors disabled:opacity-50"
                >
                  {photoUploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                  ) : (
                    <><Camera className="w-4 h-4" /> Choose Photo</>
                  )}
                </button>
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Or Choose Avatar Color</p>
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      updateUserProfile({ avatarColor: color.value, photoURL: null });
                      setEditingAvatar(false);
                    }}
                    className={`w-10 h-10 rounded-full ${color.bg} flex items-center justify-center hover:scale-110 transition-transform ${
                      userProfile.avatarColor === color.value ? `ring-2 ${color.ring} ring-offset-2` : ""
                    }`}
                  >
                    <span className="text-white font-bold text-sm">
                      {(userProfile.displayName || userProfile.email || "?")[0].toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setEditingAvatar(false)}
                className="text-xs text-slate-400 hover:text-slate-600 mt-3"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Display Name */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Display Name</label>
              {isFieldEditing("displayName") ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    className="border border-hotpink-300 rounded-lg px-3 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-hotpink-200"
                    autoFocus={!editingAll}
                  />
                  {!editingAll && (
                    <>
                      <button onClick={() => saveEdit("displayName")} className="p-1.5 text-hotpink-500 hover:bg-hotpink-50 rounded-lg">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditing(null)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-charcoal font-medium">{userProfile.displayName || "Not set"}</p>
              )}
            </div>

            {/* Email (not editable) */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</label>
              <p className="text-charcoal font-medium">{userProfile.email}</p>
            </div>

            {/* Skill Level */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Skill Level</label>
              {isFieldEditing("skillLevel") ? (
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={editSkillLevel}
                    onChange={(e) => setEditSkillLevel(e.target.value)}
                    className="border border-hotpink-300 rounded-lg px-3 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-hotpink-200 bg-white"
                  >
                    {SKILL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {!editingAll && (
                    <>
                      <button onClick={() => saveEdit("skillLevel")} className="p-1.5 text-hotpink-500 hover:bg-hotpink-50 rounded-lg">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditing(null)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-charcoal font-medium capitalize">{userProfile.skillLevel || "Not set"}</p>
              )}
            </div>

            {/* Game Style */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Game Style Preference</label>
              {isFieldEditing("gameStylePreference") ? (
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={editGameStyle}
                    onChange={(e) => setEditGameStyle(e.target.value)}
                    className="border border-hotpink-300 rounded-lg px-3 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-hotpink-200 bg-white"
                  >
                    {STYLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {!editingAll && (
                    <>
                      <button onClick={() => saveEdit("gameStylePreference")} className="p-1.5 text-hotpink-500 hover:bg-hotpink-50 rounded-lg">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditing(null)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-charcoal font-medium capitalize">{userProfile.gameStylePreference || "Not set"}</p>
              )}
            </div>

            {/* Home City */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Home City</label>
              {isFieldEditing("homeCity") ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={editHomeCity}
                    onChange={(e) => setEditHomeCity(e.target.value)}
                    className="border border-hotpink-300 rounded-lg px-3 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-hotpink-200"
                    placeholder="e.g. Tulsa, OK"
                  />
                  {!editingAll && (
                    <>
                      <button onClick={() => saveEdit("homeCity")} className="p-1.5 text-hotpink-500 hover:bg-hotpink-50 rounded-lg">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditing(null)} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-charcoal font-medium">{userProfile.homeCity || "Not set"}</p>
              )}
            </div>

            {/* Home Metro */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Home Metro (Free Tier Access)</label>
              {(() => {
                const currentMetro = userProfile.homeMetro ? findMetroByAbbreviation(userProfile.homeMetro) : null;
                const canChange = !userProfile.homeMetroSelectedAt ||
                  (Date.now() - new Date(userProfile.homeMetroSelectedAt).getTime()) > HOME_METRO_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
                const daysUntilChange = userProfile.homeMetroSelectedAt
                  ? Math.max(0, Math.ceil((HOME_METRO_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000 - (Date.now() - new Date(userProfile.homeMetroSelectedAt).getTime())) / (1000 * 60 * 60 * 24)))
                  : 0;

                if (currentMetro && !canChange) {
                  return (
                    <div>
                      <p className="text-charcoal font-medium">{currentMetro.metro}, {currentMetro.state}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Can change in {daysUntilChange} days</p>
                    </div>
                  );
                }

                return (
                  <div>
                    {currentMetro && <p className="text-charcoal font-medium mb-1">{currentMetro.metro}, {currentMetro.state}</p>}
                    <select
                      value={userProfile.homeMetro || ""}
                      onChange={(e) => {
                        if (e.target.value) {
                          updateUserProfile({
                            homeMetro: e.target.value,
                            homeMetroSelectedAt: new Date().toISOString(),
                          });
                        }
                      }}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-hotpink-200 bg-white"
                    >
                      <option value="">Select your home metro...</option>
                      {METRO_REGIONS.map((m) => (
                        <option key={m.abbreviation} value={m.abbreviation}>
                          {m.metro}, {m.state}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Contributor Application Banner */}
        {userProfile.contributorStatus === "pending" && (
          <div className="bg-skyblue-50 border border-skyblue-200 rounded-xl p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-skyblue-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-skyblue-700">Your contributor application is under review</p>
              <p className="text-sm text-skyblue-600">
                Enjoy full access while you wait. We&apos;ll review your application soon.
              </p>
            </div>
          </div>
        )}

        {/* Contributor Badge */}
        {isContributor && (
          <div className="bg-skyblue-50 border border-skyblue-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-skyblue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-skyblue-700">Community Contributor</p>
                <p className="text-sm text-skyblue-600">
                  You&apos;re helping keep the {userProfile.contributorMetro || userProfile.contributorCity || "your area"} listings accurate.
                </p>
              </div>
            </div>
            <Link
              href="/community"
              className="flex items-center gap-1.5 text-sm text-skyblue-600 font-medium hover:text-skyblue-700"
            >
              <MessageSquare className="w-4 h-4" /> Forum
            </Link>
          </div>
        )}

        {/* Referral Dashboard (Contributors only) */}
        <ReferralDashboard />

        {/* Past Due Banner */}
        {userProfile.subscriptionStatus === "past_due" && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800">Payment Failed</p>
              <p className="text-sm text-amber-700">
                Please update your payment method to keep your access.
              </p>
            </div>
            <button
              onClick={() => handleManageSubscription()}
              className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors whitespace-nowrap"
            >
              Update Payment
            </button>
          </div>
        )}

        {/* Subscription Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-lg text-charcoal mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-hotpink-500" />
            Subscription
          </h3>

          {userProfile.accountType === "free" && userProfile.subscriptionStatus !== "canceled" && (
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

          {userProfile.accountType === "free" && userProfile.subscriptionStatus === "canceled" && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-700">Subscription Canceled</p>
                  <p className="text-sm text-slate-500">
                    Your subscription has been canceled. Resubscribe to regain full access.
                  </p>
                </div>
                <Link
                  href="/pricing"
                  className="bg-hotpink-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors"
                >
                  Resubscribe
                </Link>
              </div>
            </div>
          )}

          {false && ( // Legacy trial UI removed
            <div className="hidden"></div>
          )}

          {userProfile.accountType === "subscriber" && (
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Plan</span>
                <span className="text-sm font-medium text-charcoal capitalize">{userProfile.plan || "Monthly"} — ${userProfile.plan === "annual" ? "39.99/year" : "4.99/month"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Status</span>
                <span className={`text-sm font-medium ${userProfile.subscriptionStatus === "past_due" ? "text-amber-500" : "text-green-500"}`}>
                  {userProfile.subscriptionStatus === "past_due" ? "Past Due" : "Active"}
                </span>
              </div>
              {userProfile.subscribedDate && (
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Member since</span>
                  <span className="text-sm font-medium text-charcoal">
                    {new Date(userProfile.subscribedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Next billing date</span>
                <span className="text-sm font-medium text-charcoal">
                  {nextBillingDate
                    ? new Date(nextBillingDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                    : "—"}
                </span>
              </div>
              <button
                onClick={() => handleManageSubscription()}
                disabled={portalLoading}
                className="flex items-center justify-center gap-2 w-full text-sm bg-hotpink-50 text-hotpink-500 border border-hotpink-200 hover:bg-hotpink-100 font-semibold py-2.5 rounded-lg mt-3 disabled:opacity-60 transition-colors"
              >
                {portalLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Opening portal...</>
                ) : (
                  <><ExternalLink className="w-4 h-4" /> Manage Subscription</>
                )}
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
            {(userProfile.savedCities || []).length === 0 && (
              <p className="text-sm text-slate-500">No saved cities yet. Save cities to get alerts about new games!</p>
            )}
            {(userProfile.savedCities || []).map((city) => (
              <span key={city} className="inline-flex items-center gap-1.5 bg-skyblue-100 rounded-lg px-3 py-1.5 text-sm text-slate-700">
                {city}
                <button onClick={() => removeSavedCity(city)} className="text-slate-400 hover:text-red-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="relative">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={savedCity}
                onChange={(e) => {
                  setSavedCity(e.target.value);
                  setShowSuggestions(true);
                  setHighlightedIndex(-1);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => {
                  // Delay so click on suggestion registers
                  setTimeout(() => setShowSuggestions(false), 150);
                }}
                onKeyDown={handleCityKeyDown}
                placeholder="Search for a city..."
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-hotpink-200 focus:border-hotpink-300"
              />
              <button
                onClick={() => {
                  if (citySuggestions.length === 1) {
                    addSavedCity(citySuggestions[0]);
                  } else if (highlightedIndex >= 0 && citySuggestions[highlightedIndex]) {
                    addSavedCity(citySuggestions[highlightedIndex]);
                  }
                }}
                disabled={citySuggestions.length === 0}
                className="bg-hotpink-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            {showSuggestions && citySuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute left-0 right-16 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden"
              >
                {citySuggestions.map((city, i) => (
                  <button
                    key={city}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addSavedCity(city);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                      i === highlightedIndex
                        ? "bg-hotpink-50 text-hotpink-600"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-hotpink-400 shrink-0" />
                    {city}
                  </button>
                ))}
              </div>
            )}
            {showSuggestions && savedCity.trim() && citySuggestions.length === 0 && (
              <div className="absolute left-0 right-16 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 p-3">
                <p className="text-sm text-slate-500">No matching cities found</p>
              </div>
            )}
          </div>
        </div>

        {/* Favorite Games */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-lg text-charcoal mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-hotpink-500" />
            Favorite Games
          </h3>
          {(userProfile.favoriteGames || []).length === 0 ? (
            <p className="text-sm text-slate-500">
              No favorite games yet. Heart a game on the search page to save it here!
            </p>
          ) : (
            <div className="space-y-2">
              {(userProfile.favoriteGames || []).map((gameId) => (
                <div key={gameId} className="flex items-center justify-between bg-skyblue-50 rounded-lg px-4 py-3">
                  <span className="text-sm text-slate-700">{gameId}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notification Preferences */}
        <NotificationPreferences />

        {/* Change Password */}
        <ChangePasswordSection />

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

function ChangePasswordSection() {
  const { user } = useAuth();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  if (!user?.email) return null;

  // Google-only users can't change password
  const isGoogleUser = user.providerData.some((p) => p.providerId === "google.com");
  const isEmailUser = user.providerData.some((p) => p.providerId === "password");

  if (isGoogleUser && !isEmailUser) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="font-semibold text-lg text-charcoal mb-2">Password</h3>
        <p className="text-sm text-slate-500">You signed in with Google. Your password is managed by your Google account.</p>
      </div>
    );
  }

  async function sendReset() {
    if (!user?.email) return;
    setStatus("sending");
    try {
      const { sendPasswordResetEmail } = await import("firebase/auth");
      const { getFirebaseAuth } = await import("@/lib/firebase");
      await sendPasswordResetEmail(getFirebaseAuth(), user.email);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h3 className="font-semibold text-lg text-charcoal mb-2">Password</h3>

      {status === "sent" ? (
        <p className="text-sm text-green-600">Password reset email sent to <strong>{user.email}</strong>. Check your inbox.</p>
      ) : status === "error" ? (
        <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-3">We&apos;ll send a password reset link to your email.</p>
          <button
            onClick={sendReset}
            disabled={status === "sending"}
            className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {status === "sending" ? "Sending..." : "Change Password"}
          </button>
        </>
      )}
    </div>
  );
}
