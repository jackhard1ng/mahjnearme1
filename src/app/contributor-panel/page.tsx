"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { mockGames } from "@/lib/mock-data";
import { findMetroByAbbreviation } from "@/lib/metro-regions";
import { MONTHLY_REFERRAL_COMMISSION, ANNUAL_REFERRAL_COMMISSION } from "@/lib/constants";
import type { Game, Organizer, GameStyle, SkillLevel } from "@/types";
import {
  DollarSign,
  Users,
  MapPin,
  CheckCircle,
  Edit3,
  Flag,
  Plus,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Search,
  Building2,
  X,
  Save,
  ClipboardList,
  Briefcase,
} from "lucide-react";

type Tab = "earnings" | "listings" | "organizers";

export default function ContributorPanelPage() {
  const { user, userProfile, isContributor } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("earnings");

  if (!user || !userProfile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-charcoal mb-4">Contributor Panel</h1>
        <p className="text-slate-500 mb-4">Please log in to access your contributor panel.</p>
        <Link href="/login" className="inline-flex items-center gap-2 bg-hotpink-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-hotpink-600 transition-colors">
          Log In
        </Link>
      </div>
    );
  }

  if (!isContributor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-charcoal mb-4">Contributor Panel</h1>
        <p className="text-slate-500 mb-4">This panel is for approved contributors only.</p>
        <Link href="/community" className="text-hotpink-500 hover:text-hotpink-600 font-medium">
          Apply to contribute on the Community page
        </Link>
      </div>
    );
  }

  const metro = userProfile.contributorMetro;
  const metroData = metro ? findMetroByAbbreviation(metro) : null;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "earnings", label: "Earnings", icon: <DollarSign className="w-4 h-4" /> },
    { key: "listings", label: "Listings", icon: <ClipboardList className="w-4 h-4" /> },
    { key: "organizers", label: "Organizers", icon: <Building2 className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-skyblue-500/90 via-skyblue-400/80 to-hotpink-400/70" />
        </div>
        <div className="max-w-5xl mx-auto px-4 pt-14 pb-10 text-center relative">
          <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-3xl sm:text-4xl text-white mb-2 tracking-tight drop-shadow-lg">
            Contributor Panel
          </h1>
          {metroData && (
            <p className="text-lg text-white/80">
              {metroData.metro}, {metroData.state}
            </p>
          )}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-white text-charcoal shadow-sm"
                  : "text-slate-500 hover:text-charcoal"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "earnings" && <EarningsTab userId={user.uid} />}
        {activeTab === "listings" && <ListingsTab metro={metro} userId={user.uid} />}
        {activeTab === "organizers" && <OrganizersTab metro={metro} userId={user.uid} />}
      </div>
    </>
  );
}

// ─── Section A: Earnings Tab ───

function EarningsTab({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    referralCode: string | null;
    referralLink: string | null;
    activeReferralsCount: number;
    monthlyEarnings: number;
    pendingEarnings: number;
    lifetimeEarnings: number;
    referralList: {
      signupDate: string;
      status: string;
      plan: string;
      isVested: boolean;
    }[];
    payouts: { id: string; amount: number; period: string; status: string; paidAt: string | null }[];
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/referrals?contributorId=${userId}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-slate-500 text-center py-8">Unable to load earnings data.</p>;
  }

  const monthlyCommission = data.referralList
    .filter((r) => r.status === "active" && r.isVested && r.plan === "monthly")
    .length * MONTHLY_REFERRAL_COMMISSION;

  const annualBonuses = data.referralList
    .filter((r) => r.plan === "annual" && r.isVested)
    .length * ANNUAL_REFERRAL_COMMISSION;

  return (
    <div className="space-y-6">
      {/* Big numbers */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Referrals"
          value={String(data.activeReferralsCount)}
          icon={<Users className="w-5 h-5 text-hotpink-500" />}
          large
        />
        <StatCard
          label="Monthly Earnings"
          value={`$${data.monthlyEarnings.toFixed(2)} / mo`}
          icon={<DollarSign className="w-5 h-5 text-green-500" />}
        />
        <StatCard
          label="Annual Bonuses"
          value={`$${annualBonuses.toFixed(2)}`}
          icon={<DollarSign className="w-5 h-5 text-skyblue-500" />}
          subtitle="one-time $8 per annual signup"
        />
        <StatCard
          label="Total Earned"
          value={`$${data.lifetimeEarnings.toFixed(2)}`}
          icon={<DollarSign className="w-5 h-5 text-hotpink-500" />}
        />
      </div>

      {/* Referral code */}
      {data.referralCode && (
        <div className="bg-skyblue-50 border border-skyblue-200 rounded-xl p-4">
          <p className="text-sm text-slate-600 mb-1">Your referral code</p>
          <p className="text-2xl font-bold text-charcoal tracking-wider">{data.referralCode}</p>
          {data.referralLink && (
            <p className="text-xs text-slate-500 mt-1">{data.referralLink}</p>
          )}
        </div>
      )}

      {/* Referral table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-charcoal">Referral Details</h3>
        </div>
        {data.referralList.length === 0 ? (
          <p className="text-sm text-slate-500 p-5">No referrals yet. Share your code to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-5 py-2.5 font-medium">Member</th>
                  <th className="text-left px-5 py-2.5 font-medium">Subscribed</th>
                  <th className="text-left px-5 py-2.5 font-medium">Plan</th>
                  <th className="text-left px-5 py-2.5 font-medium">Status</th>
                  <th className="text-right px-5 py-2.5 font-medium">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.referralList.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5 text-charcoal">Member #{i + 1}</td>
                    <td className="px-5 py-2.5 text-slate-500">
                      {new Date(r.signupDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.plan === "annual" ? "bg-skyblue-100 text-skyblue-600" : "bg-slate-100 text-slate-600"
                      }`}>
                        {r.plan}
                      </span>
                    </td>
                    <td className="px-5 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right font-medium text-charcoal">
                      {r.status === "active" && r.isVested
                        ? `$${(r.plan === "monthly" ? MONTHLY_REFERRAL_COMMISSION : ANNUAL_REFERRAL_COMMISSION / 12).toFixed(2)}/mo`
                        : r.status === "active" ? "vesting" : "-"}
                    </td>
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

function StatCard({
  label,
  value,
  icon,
  subtitle,
  large,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  subtitle?: string;
  large?: boolean;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className={`font-bold text-charcoal ${large ? "text-3xl" : "text-xl"}`}>{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}

// ─── Section B: Listings Tab ───

function ListingsTab({ metro, userId }: { metro: string | null; userId: string }) {
  const [verifying, setVerifying] = useState<string | null>(null);
  const [flagging, setFlagging] = useState<string | null>(null);
  const [flagNote, setFlagNote] = useState("");
  const [search, setSearch] = useState("");
  const [showAddListing, setShowAddListing] = useState(false);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);

  const metroListings = mockGames.filter((g) => g.metroRegion === metro);

  const now = Date.now();
  const staleCount = metroListings.filter((g) => {
    const lastV = new Date(g.lastVerified).getTime();
    return (now - lastV) / (1000 * 60 * 60 * 24) > 30;
  }).length;

  const filtered = search
    ? metroListings.filter(
        (g) =>
          g.name.toLowerCase().includes(search.toLowerCase()) ||
          g.venueName.toLowerCase().includes(search.toLowerCase())
      )
    : metroListings;

  // Sort: stale listings first
  const sorted = [...filtered].sort((a, b) => {
    const aStale = (now - new Date(a.lastVerified).getTime()) / (1000 * 60 * 60 * 24) > 30;
    const bStale = (now - new Date(b.lastVerified).getTime()) / (1000 * 60 * 60 * 24) > 30;
    if (aStale && !bStale) return -1;
    if (!aStale && bStale) return 1;
    return 0;
  });

  useEffect(() => {
    if (!metro) return;
    fetch(`/api/organizers?metro=${encodeURIComponent(metro)}`)
      .then((r) => r.json())
      .then((d) => setOrganizers(d.organizers || []))
      .catch(() => {});
  }, [metro]);

  async function handleVerify(gameId: string) {
    setVerifying(gameId);
    try {
      await fetch("/api/contributor-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, activityType: "verification" }),
      });
    } catch {
      // silent
    } finally {
      setVerifying(null);
    }
  }

  function getDaysSinceVerified(lastVerified: string) {
    return Math.floor((now - new Date(lastVerified).getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="space-y-4">
      {/* Stale alert */}
      {staleCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{staleCount} listing{staleCount !== 1 ? "s" : ""}</strong> haven&apos;t been verified in 30+ days.
          </p>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search listings..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hotpink-200"
          />
        </div>
        <button
          onClick={() => setShowAddListing(!showAddListing)}
          className="flex items-center gap-2 bg-hotpink-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Listing
        </button>
      </div>

      {/* Add listing form with organizer autofill */}
      {showAddListing && (
        <AddListingForm
          metro={metro}
          organizers={organizers}
          userId={userId}
          onClose={() => setShowAddListing(false)}
        />
      )}

      {/* Listings table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Event</th>
                <th className="text-left px-4 py-2.5 font-medium">Venue</th>
                <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">Day/Time</th>
                <th className="text-left px-4 py-2.5 font-medium">Verified</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-right px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((game) => {
                const daysSince = getDaysSinceVerified(game.lastVerified);
                const isStale = daysSince > 30;
                return (
                  <tr key={game.id} className={`hover:bg-slate-50 ${isStale ? "bg-amber-50/50" : ""}`}>
                    <td className="px-4 py-2.5 font-medium text-charcoal max-w-[200px] truncate">
                      {game.name}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 max-w-[150px] truncate">{game.venueName}</td>
                    <td className="px-4 py-2.5 text-slate-500 hidden md:table-cell text-xs">
                      {game.recurringSchedule
                        ? `${game.recurringSchedule.dayOfWeek} ${game.recurringSchedule.startTime}`
                        : game.eventDate || "-"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs ${isStale ? "text-amber-600 font-medium" : "text-slate-400"}`}>
                        {daysSince === 0 ? "Today" : `${daysSince}d ago`}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        game.status === "active" ? "bg-green-100 text-green-700" :
                        game.status === "pending" ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {game.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleVerify(game.id)}
                          disabled={verifying === game.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                          title="Mark as verified today"
                        >
                          {verifying === game.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          Verify
                        </button>
                        <button
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-skyblue-50 text-skyblue-600 hover:bg-skyblue-100 transition-colors"
                          title="Edit listing"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setFlagging(flagging === game.id ? null : game.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                          title="Flag for review"
                        >
                          <Flag className="w-3 h-3" />
                        </button>
                      </div>
                      {flagging === game.id && (
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="text"
                            value={flagNote}
                            onChange={(e) => setFlagNote(e.target.value)}
                            placeholder="What needs attention?"
                            className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-300"
                          />
                          <button
                            onClick={() => { setFlagging(null); setFlagNote(""); }}
                            className="text-xs text-amber-600 font-medium hover:text-amber-700"
                          >
                            Submit
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {sorted.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-8">No listings found in your metro.</p>
        )}
      </div>
    </div>
  );
}

// ─── Add Listing Form with Organizer Autofill ───

function AddListingForm({
  metro,
  organizers,
  userId,
  onClose,
}: {
  metro: string | null;
  organizers: Organizer[];
  userId: string;
  onClose: () => void;
}) {
  const [selectedOrganizer, setSelectedOrganizer] = useState<string>("");
  const [showNewOrganizer, setShowNewOrganizer] = useState(false);
  const [organizerSearch, setOrganizerSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    organizerName: "",
    venueName: "",
    address: "",
    city: "",
    gameStyle: "american" as GameStyle,
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    instagram: "",
    facebookGroup: "",
    skillLevels: [] as SkillLevel[],
    dropInFriendly: false,
    setsProvided: false,
    typicalGroupSize: "",
    cost: "",
    isRecurring: true,
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    description: "",
  });

  const filteredOrganizers = organizerSearch
    ? organizers.filter(
        (o) =>
          o.organizerName.toLowerCase().includes(organizerSearch.toLowerCase()) ||
          o.venueName.toLowerCase().includes(organizerSearch.toLowerCase())
      )
    : organizers;

  function handleSelectOrganizer(orgId: string) {
    setSelectedOrganizer(orgId);
    const org = organizers.find((o) => o.id === orgId);
    if (org) {
      setForm((prev) => ({
        ...prev,
        organizerName: org.organizerName,
        venueName: org.venueName,
        address: org.address,
        city: org.city,
        gameStyle: org.gameStyle,
        contactName: org.contactName,
        contactEmail: org.contactEmail,
        contactPhone: org.contactPhone,
        website: org.website,
        instagram: org.instagram,
        facebookGroup: org.facebookGroup,
        skillLevels: org.skillLevels,
        dropInFriendly: org.dropInFriendly,
        setsProvided: org.setsProvided,
        typicalGroupSize: org.typicalGroupSize,
      }));
    }
  }

  return (
    <div className="bg-white border border-hotpink-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-charcoal">Add New Listing</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Organizer autofill */}
      <div className="mb-5 p-4 bg-skyblue-50 border border-skyblue-200 rounded-lg">
        <label className="block text-sm font-medium text-charcoal mb-2">
          Select an organizer (optional)
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={organizerSearch}
            onChange={(e) => setOrganizerSearch(e.target.value)}
            placeholder="Search organizers in your metro..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-skyblue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-skyblue-300 bg-white"
          />
        </div>
        {organizerSearch && filteredOrganizers.length > 0 && (
          <div className="mt-2 bg-white border border-slate-200 rounded-lg max-h-40 overflow-y-auto">
            {filteredOrganizers.map((org) => (
              <button
                key={org.id}
                onClick={() => {
                  handleSelectOrganizer(org.id);
                  setOrganizerSearch("");
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-skyblue-50 transition-colors ${
                  selectedOrganizer === org.id ? "bg-skyblue-100" : ""
                }`}
              >
                <span className="font-medium">{org.organizerName}</span>
                <span className="text-slate-400 ml-2">{org.venueName}</span>
              </button>
            ))}
          </div>
        )}
        {selectedOrganizer && (
          <p className="text-xs text-skyblue-600 mt-2">
            Autofilled from organizer. Only fill in event-specific details below.
          </p>
        )}
        {!showNewOrganizer && (
          <button
            onClick={() => setShowNewOrganizer(true)}
            className="mt-2 text-xs text-skyblue-500 hover:text-skyblue-600 font-medium"
          >
            + Add new organizer
          </button>
        )}
        {showNewOrganizer && (
          <InlineNewOrganizerForm
            metro={metro}
            userId={userId}
            onSaved={(org) => {
              setShowNewOrganizer(false);
              handleSelectOrganizer(org.id);
            }}
            onCancel={() => setShowNewOrganizer(false)}
          />
        )}
      </div>

      {/* Event-specific fields */}
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Event Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotpink-200"
            placeholder="e.g., Tuesday Night Mahjong"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Venue Name</label>
          <input
            type="text"
            value={form.venueName}
            onChange={(e) => setForm({ ...form, venueName: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotpink-200"
            placeholder="e.g., Westside Library"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Day of Week</label>
          <select
            value={form.dayOfWeek}
            onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotpink-200"
          >
            <option value="">Select...</option>
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => (
              <option key={d} value={d.toLowerCase()}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Start Time</label>
          <input
            type="time"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotpink-200"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Cost</label>
          <input
            type="text"
            value={form.cost}
            onChange={(e) => setForm({ ...form, cost: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotpink-200"
            placeholder="e.g., Free, $5"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hotpink-200"
          placeholder="Brief description of this event..."
        />
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">
          Cancel
        </button>
        <button className="flex items-center gap-2 bg-hotpink-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors">
          <Save className="w-4 h-4" /> Save Listing
        </button>
      </div>
    </div>
  );
}

// ─── Inline New Organizer Form ───

function InlineNewOrganizerForm({
  metro,
  userId,
  onSaved,
  onCancel,
}: {
  metro: string | null;
  userId: string;
  onSaved: (org: Organizer) => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    organizerName: "",
    venueName: "",
    contactName: "",
    contactEmail: "",
    website: "",
    instagram: "",
    facebookGroup: "",
  });

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!form.organizerName) return;
    setSaving(true);
    try {
      const res = await fetch("/api/organizers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          metroRegion: metro,
          addedBy: userId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onSaved(data as Organizer);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="mt-3 bg-white border border-slate-200 rounded-lg p-3 space-y-2">
      <p className="text-xs font-medium text-slate-600">New Organizer</p>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          required
          value={form.organizerName}
          onChange={(e) => setForm({ ...form, organizerName: e.target.value })}
          placeholder="Organizer name *"
          className="text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-skyblue-300"
        />
        <input
          type="text"
          value={form.venueName}
          onChange={(e) => setForm({ ...form, venueName: e.target.value })}
          placeholder="Venue name"
          className="text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-skyblue-300"
        />
        <input
          type="text"
          value={form.contactName}
          onChange={(e) => setForm({ ...form, contactName: e.target.value })}
          placeholder="Contact name"
          className="text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-skyblue-300"
        />
        <input
          type="email"
          value={form.contactEmail}
          onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
          placeholder="Contact email"
          className="text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-skyblue-300"
        />
        <input
          type="text"
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
          placeholder="Website"
          className="text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-skyblue-300"
        />
        <input
          type="text"
          value={form.instagram}
          onChange={(e) => setForm({ ...form, instagram: e.target.value })}
          placeholder="Instagram"
          className="text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-skyblue-300"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="text-xs bg-skyblue-400 text-white px-3 py-1.5 rounded font-medium hover:bg-skyblue-500 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Organizer"}
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-slate-400 hover:text-slate-600">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Section C: Organizers Tab ───

function OrganizersTab({ metro, userId }: { metro: string | null; userId: string }) {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const loadOrganizers = useCallback(async () => {
    if (!metro) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/organizers?metro=${encodeURIComponent(metro)}`);
      if (res.ok) {
        const data = await res.json();
        setOrganizers(data.organizers || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [metro]);

  useEffect(() => {
    loadOrganizers();
  }, [loadOrganizers]);

  const filtered = search
    ? organizers.filter(
        (o) =>
          o.organizerName.toLowerCase().includes(search.toLowerCase()) ||
          o.venueName.toLowerCase().includes(search.toLowerCase())
      )
    : organizers;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizers..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hotpink-200"
          />
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-skyblue-400 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-skyblue-500 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Organizer
        </button>
      </div>

      {showAdd && (
        <InlineNewOrganizerForm
          metro={metro}
          userId={userId}
          onSaved={() => {
            setShowAdd(false);
            loadOrganizers();
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}

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
                  <th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">Contact</th>
                  <th className="text-left px-4 py-2.5 font-medium">Last Updated</th>
                  <th className="text-right px-4 py-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-charcoal">{org.organizerName}</td>
                    <td className="px-4 py-2.5 text-slate-500">{org.venueName || "-"}</td>
                    <td className="px-4 py-2.5 text-slate-500 hidden md:table-cell text-xs">
                      {org.contactEmail || org.contactPhone || "-"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">
                      {new Date(org.lastUpdated).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => setEditing(editing === org.id ? null : org.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-skyblue-50 text-skyblue-600 hover:bg-skyblue-100 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-slate-500 text-sm py-8">
              {organizers.length === 0 ? "No organizers yet. Add one to get started." : "No organizers match your search."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
