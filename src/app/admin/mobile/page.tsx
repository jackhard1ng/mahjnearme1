"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle,
  XCircle,
  Users,
  Clock,
  Loader2,
  RefreshCw,
  MapPin,
  Star,
  UserCheck,
  AlertCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrganizerApp {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  organizerName: string;
  city: string;
  state: string;
  bio?: string;
  website?: string;
  instagram?: string;
  isInstructor?: boolean;
  status: string;
  createdAt: string;
}

interface ListingApproval {
  id: string;
  type: string;
  userId: string;
  userEmail: string;
  userName: string;
  listingId: string | null;
  newValues: Record<string, unknown> | null;
  status: string;
  createdAt: string;
}

interface UserRow {
  id: string;
  email: string;
  displayName: string;
  accountType: string;
  subscriptionStatus: string;
  isOrganizer?: boolean;
  createdAt?: string;
}

interface BadGeoListing {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function adminFetch(route: string, method = "GET", body?: unknown) {
  return fetch("/api/admin-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ route, method, body }),
  });
}

function ago(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const ACCOUNT_COLORS: Record<string, string> = {
  subscriber: "bg-green-100 text-green-800",
  admin: "bg-purple-100 text-purple-800",
  organizer: "bg-blue-100 text-blue-800",
  trial: "bg-yellow-100 text-yellow-800",
  free: "bg-slate-100 text-slate-600",
  contributor: "bg-orange-100 text-orange-800",
};

// ---------------------------------------------------------------------------
// Approvals Tab
// ---------------------------------------------------------------------------

function ApprovalsTab() {
  const [orgApps, setOrgApps] = useState<OrganizerApp[]>([]);
  const [listingApprovals, setListingApprovals] = useState<ListingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [appsRes, approvalsRes] = await Promise.all([
        adminFetch("/api/organizer-apply?status=pending"),
        adminFetch("/api/approvals?status=pending"),
      ]);
      const appsData = await appsRes.json();
      const approvalsData = await approvalsRes.json();
      setOrgApps(appsData.applications || []);
      setListingApprovals(approvalsData.approvals || []);
    } catch {
      setToast("Failed to load approvals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const actOnOrgApp = async (id: string, action: "approve" | "reject") => {
    setActing(id);
    try {
      const res = await adminFetch("/api/organizer-apply", "PUT", {
        id,
        status: action === "approve" ? "approved" : "rejected",
      });
      if (res.ok) {
        setToast(action === "approve" ? "Approved!" : "Rejected");
        setOrgApps((prev) => prev.filter((a) => a.id !== id));
      } else {
        setToast("Action failed");
      }
    } catch {
      setToast("Action failed");
    } finally {
      setActing(null);
      setTimeout(() => setToast(""), 3000);
    }
  };

  const actOnListingApproval = async (id: string, action: "approve" | "reject") => {
    setActing(id);
    try {
      const res = await adminFetch("/api/approvals", "PUT", {
        id,
        status: action === "approve" ? "approved" : "rejected",
      });
      if (res.ok) {
        setToast(action === "approve" ? "Approved!" : "Rejected");
        setListingApprovals((prev) => prev.filter((a) => a.id !== id));
      } else {
        setToast("Action failed");
      }
    } catch {
      setToast("Action failed");
    } finally {
      setActing(null);
      setTimeout(() => setToast(""), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-hotpink-500" />
      </div>
    );
  }

  const total = orgApps.length + listingApprovals.length;

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{total} pending</p>
        <button onClick={load} className="text-slate-400 hover:text-slate-600">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {total === 0 && (
        <div className="text-center py-12 text-slate-400">
          <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
          <p>All caught up!</p>
        </div>
      )}

      {/* Organizer / Instructor applications */}
      {orgApps.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Organizer Applications ({orgApps.length})
          </p>
          <div className="space-y-3">
            {orgApps.map((app) => (
              <div key={app.id} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-slate-800">{app.organizerName}</p>
                    <p className="text-xs text-slate-500">{app.city}, {app.state} · {ago(app.createdAt)}</p>
                    <p className="text-xs text-slate-400">{app.userEmail}</p>
                  </div>
                  {app.isInstructor && (
                    <span className="flex-shrink-0 bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" /> Instructor
                    </span>
                  )}
                </div>
                {app.bio && (
                  <p className="text-xs text-slate-600 mb-3 line-clamp-2">{app.bio}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => actOnOrgApp(app.id, "approve")}
                    disabled={acting === app.id}
                    className="flex-1 flex items-center justify-center gap-1 bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50"
                  >
                    {acting === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                    Approve
                  </button>
                  <button
                    onClick={() => actOnOrgApp(app.id, "reject")}
                    disabled={acting === app.id}
                    className="flex-1 flex items-center justify-center gap-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 disabled:opacity-50"
                  >
                    <XCircle className="w-3 h-3" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Listing edits / new listings */}
      {listingApprovals.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Listing Changes ({listingApprovals.length})
          </p>
          <div className="space-y-3">
            {listingApprovals.map((approval) => {
              const newVals = approval.newValues || {};
              const eventName = (newVals.name as string) || approval.listingId || "Untitled";
              const city = (newVals.city as string) || "";
              const state = (newVals.state as string) || "";
              return (
                <div key={approval.id} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="mb-2">
                    <p className="font-semibold text-slate-800">{eventName}</p>
                    <p className="text-xs text-slate-500">
                      {approval.type === "new_listing" ? "New event" : "Edit"} by {approval.userName || approval.userEmail}
                      {city ? ` · ${city}, ${state}` : ""}
                      {" · "}{ago(approval.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => actOnListingApproval(approval.id, "approve")}
                      disabled={acting === approval.id}
                      className="flex-1 flex items-center justify-center gap-1 bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50"
                    >
                      {acting === approval.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                      Approve
                    </button>
                    <button
                      onClick={() => actOnListingApproval(approval.id, "reject")}
                      disabled={acting === approval.id}
                      className="flex-1 flex items-center justify-center gap-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 disabled:opacity-50"
                    >
                      <XCircle className="w-3 h-3" /> Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Users Tab
// ---------------------------------------------------------------------------

function UsersTab() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "subscriber" | "free" | "organizer">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/subscribers");
      const data = await res.json();
      // subscribers endpoint returns subscriber list; also fetch all users
      const usersRes = await adminFetch("/api/organizers?limit=500");
      const usersData = await usersRes.json();

      // Prefer the subscribers list which has account type info
      const rawUsers: UserRow[] = (data.subscribers || data.users || []).map(
        (u: Record<string, unknown>) => ({
          id: u.id as string || u.userId as string || "",
          email: u.email as string || "",
          displayName: u.displayName as string || u.name as string || "",
          accountType: u.accountType as string || "free",
          subscriptionStatus: u.subscriptionStatus as string || "none",
          isOrganizer: u.isOrganizer as boolean || false,
          createdAt: u.createdAt as string || u.subscribedDate as string || "",
        })
      );
      setUsers(rawUsers);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter((u) => {
    if (filter === "subscriber") return u.accountType === "subscriber" || u.subscriptionStatus === "active";
    if (filter === "free") return u.accountType === "free" || u.accountType === "trial";
    if (filter === "organizer") return u.isOrganizer || u.accountType === "organizer";
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-hotpink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "subscriber", "organizer", "free"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
              filter === f
                ? "bg-hotpink-500 text-white border-hotpink-500"
                : "border-slate-200 text-slate-600 bg-white"
            }`}
          >
            {f === "all" ? `All (${users.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button onClick={load} className="ml-auto text-slate-400 hover:text-slate-600">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-slate-400 py-8 text-sm">No users found</p>
      )}

      <div className="space-y-2">
        {filtered.map((u) => (
          <div key={u.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-slate-800 text-sm truncate">
                {u.displayName || u.email}
              </p>
              <p className="text-xs text-slate-400 truncate">{u.email}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {u.isOrganizer && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <UserCheck className="w-2.5 h-2.5" /> Org
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full ${ACCOUNT_COLORS[u.accountType] || ACCOUNT_COLORS.free}`}>
                {u.accountType}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fix Geocoding Tab
// ---------------------------------------------------------------------------

function GeoTab() {
  const [listings, setListings] = useState<BadGeoListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/listings")
      .then((r) => r.json())
      .then((data) => {
        const bad = (data.listings || []).filter(
          (g: Record<string, unknown>) => {
            const gp = g.geopoint as { lat: number; lng: number } | null;
            return !gp || (gp.lat === 0 && gp.lng === 0);
          }
        );
        setListings(
          bad.map((g: Record<string, unknown>) => ({
            id: g.id as string,
            name: g.name as string || "Untitled",
            city: g.city as string || "",
            state: g.state as string || "",
            address: g.address as string || "",
          }))
        );
      })
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, []);

  const regeocode = async (listing: BadGeoListing) => {
    setFixing(listing.id);
    try {
      const q = listing.address
        ? `${listing.address}, ${listing.city}, ${listing.state}`
        : `${listing.city}, ${listing.state}`;
      const geoRes = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const geoData = await geoRes.json();
      if (!geoData.lat) {
        setToast("Geocode failed — try a more specific address");
        setTimeout(() => setToast(""), 3000);
        setFixing(null);
        return;
      }
      // Update listing via admin proxy
      const res = await adminFetch("/api/listings", "PUT", {
        id: listing.id,
        geopoint: { lat: geoData.lat, lng: geoData.lng },
      });
      if (res.ok) {
        setListings((prev) => prev.filter((l) => l.id !== listing.id));
        setToast(`Fixed! ${geoData.lat.toFixed(4)}, ${geoData.lng.toFixed(4)}`);
      } else {
        setToast("Update failed");
      }
    } catch {
      setToast("Something went wrong");
    } finally {
      setFixing(null);
      setTimeout(() => setToast(""), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-hotpink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm shadow-lg">
          {toast}
        </div>
      )}

      <p className="text-sm text-slate-500">{listings.length} listing{listings.length !== 1 ? "s" : ""} with no coordinates</p>

      {listings.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <MapPin className="w-10 h-10 mx-auto mb-2 text-green-400" />
          <p>All listings have coordinates!</p>
        </div>
      )}

      <div className="space-y-2">
        {listings.map((l) => (
          <div key={l.id} className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="font-medium text-slate-800 text-sm">{l.name}</p>
            <p className="text-xs text-slate-500 mb-1">{l.address || "(no address)"} · {l.city}, {l.state}</p>
            <button
              onClick={() => regeocode(l)}
              disabled={fixing === l.id}
              className="flex items-center gap-1.5 bg-hotpink-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-hotpink-600 disabled:opacity-50"
            >
              {fixing === l.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
              Auto-fix coordinates
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type Tab = "approvals" | "users" | "geo";

export default function MobileAdminPage() {
  const [tab, setTab] = useState<Tab>("approvals");

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "approvals", label: "Approvals", icon: <AlertCircle className="w-4 h-4" /> },
    { key: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
    { key: "geo", label: "Fix Map", icon: <MapPin className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">Admin</h1>
        <span className="text-xs text-slate-400">mahjnearme.com</span>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl">
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition ${
              tab === key
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {icon}
            <span className="hidden xs:inline">{label}</span>
          </button>
        ))}
      </div>

      {tab === "approvals" && <ApprovalsTab />}
      {tab === "users" && <UsersTab />}
      {tab === "geo" && <GeoTab />}
    </div>
  );
}
