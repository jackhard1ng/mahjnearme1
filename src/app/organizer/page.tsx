"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Game } from "@/types";
import Link from "next/link";
import {
  Edit3,
  Plus,
  Loader2,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  Globe,
  Instagram,
  Mail,
  User,
  Calendar,
  Star,
  ExternalLink,
} from "lucide-react";

interface OrganizerData {
  id: string;
  organizerName: string;
  slug: string;
  bio: string;
  contactEmail: string;
  website: string;
  instagram: string;
  facebookGroup: string;
  photoURL: string | null;
  photos: string[];
  isInstructor: boolean;
  instructorDetails: {
    teachingStyles: string[];
    certifications: string;
    serviceArea: string;
    gameStylesTaught: string[];
  } | null;
  featured: boolean;
  listingIds: string[];
}

interface PendingApproval {
  id: string;
  type: string;
  listingId: string | null;
  status: string;
  createdAt: string;
}

export default function OrganizerDashboardPage() {
  const { user, userProfile, isOrganizer, isSubscribedOrganizer, loading: authLoading } = useAuth();
  const [organizer, setOrganizer] = useState<OrganizerData | null>(null);
  const [listings, setListings] = useState<Game[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"listings" | "profile" | "add" | "instructor">("listings");
  const [editingListing, setEditingListing] = useState<Game | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/organizer-listings?userId=${user.uid}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setOrganizer(data.organizer);
      setListings(data.listings || []);
      setPendingApprovals(data.pendingApprovals || []);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user && isOrganizer) {
      fetchData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, user, isOrganizer, fetchData]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-softpink-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <User className="w-12 h-12 text-softpink-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Organizer Dashboard</h1>
        <p className="text-slate-600 mb-6">Sign in to access your organizer dashboard.</p>
        <Link href="/account" className="inline-block bg-softpink-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-softpink-600 transition">
          Sign In
        </Link>
      </div>
    );
  }

  if (!isOrganizer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Not an Organizer Yet</h1>
        <p className="text-slate-600 mb-6">
          Claim your listings to get your free organizer dashboard. You&apos;ll be able to edit your events, add new ones, and manage your public profile.
        </p>
        <Link href="/claim-listing" className="inline-block bg-softpink-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-softpink-600 transition">
          Claim Your Listings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {organizer?.organizerName || "Organizer Dashboard"}
          </h1>
          <p className="text-slate-500 text-sm">
            {isSubscribedOrganizer ? (
              <span className="flex items-center gap-1 text-amber-600">
                <Star className="w-4 h-4 fill-amber-500" /> Featured Organizer
              </span>
            ) : (
              "Free Organizer"
            )}
          </p>
        </div>
        {organizer?.slug && (
          <Link
            href={`/organizer/${organizer.slug}`}
            className="text-sm text-softpink-500 hover:text-softpink-600 flex items-center gap-1"
          >
            <ExternalLink className="w-4 h-4" /> View Public Profile
          </Link>
        )}
      </div>

      {/* Approval status banner */}
      {!isSubscribedOrganizer && (
        <div className="bg-skyblue-50 border border-skyblue-200 rounded-lg p-3 mb-6 text-sm text-skyblue-800">
          Edits and new listings require admin approval (usually within 24 hours).{" "}
          <Link href="/pricing" className="font-semibold underline">
            Subscribe
          </Link>{" "}
          for instant edits and a Featured badge.
        </div>
      )}

      {/* Pending approvals */}
      {pendingApprovals.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          <p className="text-sm font-medium text-amber-800">
            {pendingApprovals.length} pending approval{pendingApprovals.length > 1 ? "s" : ""}
          </p>
          <div className="mt-2 space-y-1">
            {pendingApprovals.map((a) => (
              <p key={a.id} className="text-xs text-amber-700">
                {a.type === "listing_edit" ? "Edit" : a.type === "new_listing" ? "New listing" : "Claim"} - Submitted{" "}
                {new Date(a.createdAt).toLocaleDateString()}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {(
          [
            { key: "listings", label: "My Listings", icon: Calendar },
            { key: "add", label: "Add Event", icon: Plus },
            { key: "profile", label: "Profile", icon: User },
            { key: "instructor", label: "Instructor", icon: Star },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition flex items-center gap-1.5 ${
              activeTab === key
                ? "border-softpink-500 text-softpink-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "listings" && (
        <ListingsTab
          listings={listings}
          editingListing={editingListing}
          setEditingListing={setEditingListing}
          userId={user.uid}
          isSubscribed={isSubscribedOrganizer}
          saving={saving}
          setSaving={setSaving}
          saveMessage={saveMessage}
          setSaveMessage={setSaveMessage}
          onRefresh={fetchData}
        />
      )}
      {activeTab === "add" && (
        <AddListingTab
          userId={user.uid}
          organizer={organizer}
          isSubscribed={isSubscribedOrganizer}
          onSuccess={fetchData}
        />
      )}
      {activeTab === "profile" && organizer && (
        <ProfileTab organizer={organizer} userId={user.uid} onRefresh={fetchData} />
      )}
      {activeTab === "instructor" && organizer && (
        <InstructorTab organizer={organizer} userId={user.uid} onRefresh={fetchData} />
      )}
    </div>
  );
}

// ----- Listings Tab -----

function ListingsTab({
  listings,
  editingListing,
  setEditingListing,
  userId,
  isSubscribed,
  saving,
  setSaving,
  saveMessage,
  setSaveMessage,
  onRefresh,
}: {
  listings: Game[];
  editingListing: Game | null;
  setEditingListing: (g: Game | null) => void;
  userId: string;
  isSubscribed: boolean;
  saving: boolean;
  setSaving: (b: boolean) => void;
  saveMessage: string;
  setSaveMessage: (s: string) => void;
  onRefresh: () => void;
}) {
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  const startEdit = (game: Game) => {
    setEditingListing(game);
    setEditForm({
      name: game.name,
      venueName: game.venueName,
      address: game.address,
      description: game.description,
      cost: game.cost,
      contactEmail: game.contactEmail,
      website: game.website,
      instagram: game.instagram,
      schedule: game.recurringSchedule
        ? `${game.recurringSchedule.dayOfWeek} ${game.recurringSchedule.startTime}-${game.recurringSchedule.endTime}`
        : game.eventDate || "",
    });
    setSaveMessage("");
  };

  const saveEdit = async () => {
    if (!editingListing) return;
    setSaving(true);
    setSaveMessage("");

    try {
      // Auto-geocode if address changed
      let geopoint = editingListing.geopoint;
      if (editForm.address && editForm.address !== editingListing.address) {
        try {
          const geoRes = await fetch(
            `/api/geocode?q=${encodeURIComponent(editForm.address)}`
          );
          const geoData = await geoRes.json();
          if (geoData.lat && geoData.lng) {
            geopoint = { lat: geoData.lat, lng: geoData.lng };
          }
        } catch {
          // Keep existing coordinates
        }
      }

      const updates: Record<string, unknown> = {};
      if (editForm.name !== editingListing.name) updates.name = editForm.name;
      if (editForm.venueName !== editingListing.venueName) updates.venueName = editForm.venueName;
      if (editForm.address !== editingListing.address) {
        updates.address = editForm.address;
        updates.geopoint = geopoint;
      }
      if (editForm.description !== editingListing.description) updates.description = editForm.description;
      if (editForm.cost !== editingListing.cost) updates.cost = editForm.cost;
      if (editForm.contactEmail !== editingListing.contactEmail) updates.contactEmail = editForm.contactEmail;
      if (editForm.website !== editingListing.website) updates.website = editForm.website;
      if (editForm.instagram !== editingListing.instagram) updates.instagram = editForm.instagram;

      if (Object.keys(updates).length === 0) {
        setSaveMessage("No changes to save.");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/organizer-listings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          listingId: editingListing.id,
          updates,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveMessage(data.error || "Failed to save");
      } else if (data.instant) {
        setSaveMessage("Changes saved and live!");
        setEditingListing(null);
        onRefresh();
      } else {
        setSaveMessage("Changes submitted for approval.");
        setEditingListing(null);
        onRefresh();
      }
    } catch {
      setSaveMessage("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  if (listings.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Calendar className="w-10 h-10 mx-auto mb-3" />
        <p>No listings yet. Add your first event!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {saveMessage && (
        <div className={`p-3 rounded-lg text-sm ${saveMessage.includes("Failed") || saveMessage.includes("wrong") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {saveMessage}
        </div>
      )}
      {listings.map((game) => (
        <div key={game.id} className="border border-slate-200 rounded-lg p-4">
          {editingListing?.id === game.id ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <EditField label="Name" value={editForm.name} onChange={(v) => setEditForm({ ...editForm, name: v })} />
                <EditField label="Venue" value={editForm.venueName} onChange={(v) => setEditForm({ ...editForm, venueName: v })} />
                <EditField label="Address" value={editForm.address} onChange={(v) => setEditForm({ ...editForm, address: v })} />
                <EditField label="Cost" value={editForm.cost} onChange={(v) => setEditForm({ ...editForm, cost: v })} />
                <EditField label="Email" value={editForm.contactEmail} onChange={(v) => setEditForm({ ...editForm, contactEmail: v })} />
                <EditField label="Website" value={editForm.website} onChange={(v) => setEditForm({ ...editForm, website: v })} />
                <EditField label="Instagram" value={editForm.instagram} onChange={(v) => setEditForm({ ...editForm, instagram: v })} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded text-sm h-20 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={saving} className="bg-softpink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-softpink-600 disabled:opacity-50 flex items-center gap-1">
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                  {isSubscribed ? "Save" : "Submit for Approval"}
                </button>
                <button onClick={() => setEditingListing(null)} className="text-slate-500 text-sm px-4 py-2 hover:text-slate-700">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-slate-800">{game.name}</h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {game.city}, {game.state}
                  </span>
                  {game.venueName && <span>{game.venueName}</span>}
                  {game.recurringSchedule?.dayOfWeek && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {game.recurringSchedule.dayOfWeek}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => startEdit(game)}
                className="text-softpink-500 hover:text-softpink-600 p-1"
                title="Edit listing"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border border-slate-200 rounded text-sm"
      />
    </div>
  );
}

// ----- Add Listing Tab -----

function AddListingTab({
  userId,
  organizer,
  isSubscribed,
  onSuccess,
}: {
  userId: string;
  organizer: OrganizerData | null;
  isSubscribed: boolean;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    type: "open_play",
    gameStyle: "american",
    venueName: "",
    address: "",
    city: "",
    state: "",
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    frequency: "weekly",
    cost: "",
    description: "",
    skillLevels: "beginner|intermediate",
    dropInFriendly: true,
    contactEmail: organizer?.contactEmail || "",
    website: organizer?.website || "",
    instagram: organizer?.instagram || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!form.name || !form.city || !form.state) {
      setMessage("Name, city, and state are required.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      // Auto-geocode address
      let geopoint = { lat: 0, lng: 0 };
      const addressToGeocode = form.address || `${form.city}, ${form.state}`;
      try {
        const geoRes = await fetch(`/api/geocode?q=${encodeURIComponent(addressToGeocode)}`);
        const geoData = await geoRes.json();
        if (geoData.lat && geoData.lng) {
          geopoint = { lat: geoData.lat, lng: geoData.lng };
        }
      } catch {
        // Continue without geocoding
      }

      const listing = {
        name: form.name,
        type: form.type,
        gameStyle: form.gameStyle,
        venueName: form.venueName,
        address: form.address,
        city: form.city,
        state: form.state.toUpperCase(),
        geopoint,
        isRecurring: !!form.dayOfWeek,
        recurringSchedule: form.dayOfWeek
          ? {
              dayOfWeek: form.dayOfWeek,
              startTime: form.startTime,
              endTime: form.endTime,
              frequency: form.frequency,
            }
          : null,
        eventDate: null,
        cost: form.cost || "Contact for price",
        description: form.description,
        skillLevels: form.skillLevels.split("|").filter(Boolean),
        dropInFriendly: form.dropInFriendly,
        contactEmail: form.contactEmail,
        website: form.website,
        instagram: form.instagram,
        contactName: organizer?.organizerName || "",
        organizerName: organizer?.organizerName || "",
      };

      const res = await fetch("/api/organizer-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, listing }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to add listing");
      } else if (data.instant) {
        setMessage("Event added and live!");
        onSuccess();
      } else {
        setMessage("Event submitted for approval.");
        onSuccess();
      }
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateForm = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Add New Event</h2>

      {message && (
        <div className={`p-3 rounded-lg text-sm mb-4 ${message.includes("Failed") || message.includes("wrong") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Event Name *</label>
            <input type="text" value={form.name} onChange={(e) => updateForm("name", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="e.g. Tuesday Night Mahjong" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select value={form.type} onChange={(e) => updateForm("type", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg">
              <option value="open_play">Open Play</option>
              <option value="lesson">Lesson</option>
              <option value="league">League</option>
              <option value="event">Event</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Game Style</label>
            <select value={form.gameStyle} onChange={(e) => updateForm("gameStyle", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg">
              <option value="american">American (NMJL)</option>
              <option value="chinese">Chinese</option>
              <option value="riichi">Riichi / Japanese</option>
              <option value="other">Other / Mixed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Venue Name</label>
            <input type="text" value={form.venueName} onChange={(e) => updateForm("venueName", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <input type="text" value={form.address} onChange={(e) => updateForm("address", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="Full street address (auto-geocoded)" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
            <input type="text" value={form.city} onChange={(e) => updateForm("city", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
            <input type="text" value={form.state} onChange={(e) => updateForm("state", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="e.g. TX" maxLength={2} />
          </div>
        </div>

        <h3 className="font-medium text-slate-800 pt-2">Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Day of Week</label>
            <select value={form.dayOfWeek} onChange={(e) => updateForm("dayOfWeek", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg">
              <option value="">One-time event</option>
              <option value="monday">Monday</option>
              <option value="tuesday">Tuesday</option>
              <option value="wednesday">Wednesday</option>
              <option value="thursday">Thursday</option>
              <option value="friday">Friday</option>
              <option value="saturday">Saturday</option>
              <option value="sunday">Sunday</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
            <input type="time" value={form.startTime} onChange={(e) => updateForm("startTime", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
            <input type="time" value={form.endTime} onChange={(e) => updateForm("endTime", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
            <select value={form.frequency} onChange={(e) => updateForm("frequency", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg">
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cost</label>
            <input type="text" value={form.cost} onChange={(e) => updateForm("cost", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="e.g. $5, Free" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
            <input type="email" value={form.contactEmail} onChange={(e) => updateForm("contactEmail", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg h-24 resize-none" placeholder="Tell players about your game..." />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="dropIn" checked={form.dropInFriendly} onChange={(e) => updateForm("dropInFriendly", e.target.checked)} />
          <label htmlFor="dropIn" className="text-sm text-slate-700">Drop-in friendly</label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-softpink-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-softpink-600 transition disabled:opacity-50 flex items-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {isSubscribed ? "Add Event" : "Submit for Approval"}
        </button>
      </div>
    </div>
  );
}

// ----- Profile Tab -----

function ProfileTab({
  organizer,
  userId,
  onRefresh,
}: {
  organizer: OrganizerData;
  userId: string;
  onRefresh: () => void;
}) {
  const [form, setForm] = useState({
    organizerName: organizer.organizerName,
    bio: organizer.bio || "",
    contactEmail: organizer.contactEmail || "",
    website: organizer.website || "",
    instagram: organizer.instagram || "",
    facebookGroup: organizer.facebookGroup || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/organizers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: organizer.id, ...form }),
      });
      if (res.ok) {
        setMessage("Profile updated!");
        onRefresh();
      } else {
        // Try through admin-proxy for organizer self-service
        const proxyRes = await fetch("/api/admin-proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            route: `/api/organizers`,
            method: "PUT",
            body: { id: organizer.id, ...form },
          }),
        });
        if (proxyRes.ok) {
          setMessage("Profile updated!");
          onRefresh();
        } else {
          setMessage("Failed to update profile.");
        }
      }
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { getStorage, ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
      const { getFirebaseApp } = await import("@/lib/firebase");
      const storage = getStorage(getFirebaseApp());
      const storageRef = ref(storage, `organizer-photos/${organizer.id}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // Update organizer profile with photo
      await fetch("/api/admin-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route: `/api/organizers`,
          method: "PUT",
          body: { id: organizer.id, photoURL: url, photos: [...(organizer.photos || []), url] },
        }),
      });

      setMessage("Photo uploaded!");
      onRefresh();
    } catch {
      setMessage("Failed to upload photo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">Edit Profile</h2>
      <p className="text-sm text-slate-500">
        Changes here apply to your public organizer profile and all your listings.
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
          <input type="text" value={form.organizerName} onChange={(e) => setForm({ ...form, organizerName: e.target.value })} className="w-full p-2 border border-slate-200 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full p-2 border border-slate-200 rounded-lg h-20 resize-none" placeholder="Tell people about yourself and your mahjong community..." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email
            </label>
            <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="w-full p-2 border border-slate-200 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <Globe className="w-3 h-3" /> Website
            </label>
            <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="w-full p-2 border border-slate-200 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <Instagram className="w-3 h-3" /> Instagram
            </label>
            <input type="text" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="@handle or URL" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Facebook Group</label>
            <input type="text" value={form.facebookGroup} onChange={(e) => setForm({ ...form, facebookGroup: e.target.value })} className="w-full p-2 border border-slate-200 rounded-lg" />
          </div>
        </div>

        {/* Photo upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
            <Upload className="w-3 h-3" /> Profile Photo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            disabled={uploading}
            className="text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-softpink-100 file:text-softpink-700 file:font-medium hover:file:bg-softpink-200"
          />
          {uploading && <p className="text-xs text-slate-400 mt-1">Uploading...</p>}
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.includes("Failed") || message.includes("wrong") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
            {message}
          </div>
        )}

        <button
          onClick={saveProfile}
          disabled={saving}
          className="bg-softpink-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-softpink-600 disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Save Profile
        </button>
      </div>
    </div>
  );
}

// ----- Instructor Tab -----

function InstructorTab({
  organizer,
  userId,
  onRefresh,
}: {
  organizer: OrganizerData;
  userId: string;
  onRefresh: () => void;
}) {
  const [isInstructor, setIsInstructor] = useState(organizer.isInstructor);
  const [details, setDetails] = useState({
    teachingStyles: organizer.instructorDetails?.teachingStyles || [],
    certifications: organizer.instructorDetails?.certifications || "",
    serviceArea: organizer.instructorDetails?.serviceArea || "",
    gameStylesTaught: organizer.instructorDetails?.gameStylesTaught || [],
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const teachingStyleOptions = [
    { value: "private", label: "Private Lessons" },
    { value: "group", label: "Group Lessons" },
    { value: "corporate", label: "Corporate Events" },
    { value: "kids", label: "Kids / Youth" },
    { value: "online", label: "Online / Virtual" },
  ];

  const gameStyleOptions = [
    { value: "american", label: "American (NMJL)" },
    { value: "chinese", label: "Chinese" },
    { value: "riichi", label: "Riichi / Japanese" },
    { value: "other", label: "Other" },
  ];

  const toggleTeachingStyle = (style: string) => {
    setDetails((prev) => ({
      ...prev,
      teachingStyles: prev.teachingStyles.includes(style)
        ? prev.teachingStyles.filter((s) => s !== style)
        : [...prev.teachingStyles, style],
    }));
  };

  const toggleGameStyle = (style: string) => {
    setDetails((prev) => ({
      ...prev,
      gameStylesTaught: prev.gameStylesTaught.includes(style)
        ? prev.gameStylesTaught.filter((s) => s !== style)
        : [...prev.gameStylesTaught, style],
    }));
  };

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const updateData = {
        id: organizer.id,
        isInstructor,
        instructorDetails: isInstructor ? details : null,
      };

      const res = await fetch("/api/admin-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route: "/api/organizers",
          method: "PUT",
          body: updateData,
        }),
      });

      if (res.ok) {
        setMessage("Instructor details saved!");
        onRefresh();
      } else {
        setMessage("Failed to save.");
      }
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">Instructor Settings</h2>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isInstructor"
          checked={isInstructor}
          onChange={(e) => setIsInstructor(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="isInstructor" className="text-slate-700 font-medium">
          I offer mahjong lessons
        </label>
      </div>

      {isInstructor && (
        <div className="space-y-4 pl-7 border-l-2 border-softpink-200">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Teaching Styles</label>
            <div className="flex flex-wrap gap-2">
              {teachingStyleOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleTeachingStyle(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    details.teachingStyles.includes(opt.value)
                      ? "bg-softpink-500 text-white border-softpink-500"
                      : "border-slate-300 text-slate-600 hover:border-softpink-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Game Styles Taught</label>
            <div className="flex flex-wrap gap-2">
              {gameStyleOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleGameStyle(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    details.gameStylesTaught.includes(opt.value)
                      ? "bg-softpink-500 text-white border-softpink-500"
                      : "border-slate-300 text-slate-600 hover:border-softpink-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Certifications</label>
            <input
              type="text"
              value={details.certifications}
              onChange={(e) => setDetails({ ...details, certifications: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
              placeholder="e.g. Oh My Mahjong certified, Mahjong Molly trained"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Service Area</label>
            <input
              type="text"
              value={details.serviceArea}
              onChange={(e) => setDetails({ ...details, serviceArea: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
              placeholder="e.g. Dallas/Fort Worth and beyond"
            />
          </div>
        </div>
      )}

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.includes("Failed") || message.includes("wrong") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message}
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="bg-softpink-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-softpink-600 disabled:opacity-50 flex items-center gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        Save
      </button>
    </div>
  );
}
