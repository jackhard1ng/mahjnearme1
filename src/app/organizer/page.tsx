"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Game } from "@/types";
import Link from "next/link";
import {
  Edit3,
  Plus,
  Loader2,
  MapPin,
  Gift,
  Copy,
  DollarSign,
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
  Search,
  Trash2,
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
  const [activeTab, setActiveTab] = useState<"listings" | "claim" | "add" | "profile" | "instructor" | "referrals">("listings");
  const [editingListing, setEditingListing] = useState<Game | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [duplicateSource, setDuplicateSource] = useState<Game | null>(null);

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
        <Loader2 className="w-8 h-8 animate-spin text-hotpink-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <User className="w-12 h-12 text-hotpink-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Organizer Dashboard</h1>
        <p className="text-slate-600 mb-6">Sign in to access your organizer dashboard.</p>
        <Link href="/account" className="inline-block bg-hotpink-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-hotpink-600 transition">
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
        <Link href="/claim-listing" className="inline-block bg-hotpink-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-hotpink-600 transition">
          Claim Your Listings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {organizer?.organizerName || "Organizer Dashboard"}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
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
            className="text-sm text-hotpink-500 hover:text-hotpink-600 flex items-center gap-1"
          >
            <ExternalLink className="w-4 h-4" /> View Public Profile
          </Link>
        )}
      </div>

      {/* Subscription upsell for free organizers */}
      {!isSubscribedOrganizer && (
        <div className="space-y-2 mb-6">
          {organizer?.slug && (
            <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 text-sm text-violet-800">
              <p className="font-semibold mb-0.5">Your profile page is public and shareable 🎉</p>
              <p className="text-violet-700 text-xs mb-2">
                Anyone you send your link to can see your full profile, events, and contact info — no subscription needed.
                The directory listing (where members browse &amp; discover instructors) is a subscriber feature, but your personal page is always free to share.
              </p>
              <div className="flex items-center gap-2 bg-white border border-violet-200 rounded px-2 py-1.5">
                <span className="text-xs text-slate-500 truncate flex-1">mahjnearme.com/organizer/{organizer.slug}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(`https://mahjnearme.com/organizer/${organizer.slug}`)}
                  className="text-xs font-medium text-violet-600 hover:text-violet-700 shrink-0"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
          <div className="bg-skyblue-50 border border-skyblue-200 rounded-lg p-3 text-sm text-skyblue-800">
            Want a Featured badge, priority placement, photo uploads, and a referral code?{" "}
            <Link href="/pricing" className="font-semibold underline">
              Subscribe
            </Link>{" "}
            to unlock premium organizer perks.
          </div>
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
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {(
          [
            { key: "listings", label: "My Listings", icon: Calendar },
            { key: "claim", label: "Claim Listings", icon: Search },
            { key: "add", label: "Add Event", icon: Plus },
            { key: "profile", label: "Profile", icon: User },
            { key: "instructor", label: "Instructor", icon: Star },
            { key: "referrals" as const, label: "Referrals", icon: Gift },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2.5 text-sm font-medium rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === key
                ? "bg-hotpink-500 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Tab content in white card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
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
          onDuplicate={(game) => {
            setDuplicateSource(game);
            setActiveTab("add");
          }}
        />
      )}
      {activeTab === "claim" && organizer && (
        <ClaimListingsTab
          userId={user.uid}
          userEmail={userProfile?.email || ""}
          userName={userProfile?.displayName || ""}
          organizerProfileId={organizer.id}
          existingListingIds={organizer.listingIds || []}
          onSuccess={fetchData}
        />
      )}
      {activeTab === "add" && (
        <AddListingTab
          userId={user.uid}
          organizer={organizer}
          isSubscribed={isSubscribedOrganizer}
          onSuccess={() => { fetchData(); setDuplicateSource(null); }}
          duplicateFrom={duplicateSource}
        />
      )}
      {activeTab === "profile" && organizer && (
        <ProfileTab organizer={organizer} userId={user.uid} isSubscribed={isSubscribedOrganizer} onRefresh={fetchData} />
      )}
      {activeTab === "instructor" && organizer && (
        <InstructorTab organizer={organizer} userId={user.uid} onRefresh={fetchData} />
      )}
      {activeTab === "referrals" && (
        <ReferralsTab userId={user.uid} />
      )}
      </div>
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
  onDuplicate,
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
  onDuplicate: (game: Game) => void;
}) {
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const deleteListing = async (listingId: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/organizer-listings?userId=${userId}&listingId=${listingId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveMessage(data.error || "Failed to delete");
      } else {
        setSaveMessage("Event deleted.");
        setConfirmDeleteId(null);
        onRefresh();
      }
    } catch {
      setSaveMessage("Something went wrong.");
    } finally {
      setDeleting(false);
    }
  };

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
                <button onClick={saveEdit} disabled={saving} className="bg-hotpink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-hotpink-600 disabled:opacity-50 flex items-center gap-1">
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                  Save
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
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => startEdit(game)}
                  className="text-hotpink-500 hover:text-hotpink-600 p-1"
                  title="Edit listing"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDuplicate(game)}
                  className="flex items-center gap-1 text-xs font-medium text-skyblue-600 hover:text-skyblue-700 bg-skyblue-50 hover:bg-skyblue-100 border border-skyblue-200 px-2.5 py-1.5 rounded-lg transition"
                  title="Copy this event with a new date"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy event
                </button>
                {confirmDeleteId === game.id ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-red-600 font-medium">Delete?</span>
                    <button
                      onClick={() => deleteListing(game.id)}
                      disabled={deleting}
                      className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded transition disabled:opacity-50"
                    >
                      {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes"}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs text-slate-500 hover:text-slate-700 px-1.5 py-1"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(game.id)}
                    className="text-slate-400 hover:text-red-500 p-1 transition"
                    title="Delete listing"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
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
  duplicateFrom,
}: {
  userId: string;
  organizer: OrganizerData | null;
  isSubscribed: boolean;
  onSuccess: () => void;
  duplicateFrom: Game | null;
}) {
  const [form, setForm] = useState({
    name: duplicateFrom?.name ? `${duplicateFrom.name} (copy)` : "",
    type: duplicateFrom?.type || "open_play",
    gameStyle: duplicateFrom?.gameStyle || "american",
    venueName: duplicateFrom?.venueName || "",
    address: duplicateFrom?.address || "",
    city: duplicateFrom?.city || "",
    state: duplicateFrom?.state || "",
    dayOfWeek: duplicateFrom?.recurringSchedule?.dayOfWeek || "",
    startTime: duplicateFrom?.recurringSchedule?.startTime || "",
    endTime: duplicateFrom?.recurringSchedule?.endTime || "",
    frequency: duplicateFrom?.recurringSchedule?.frequency || "weekly",
    cost: duplicateFrom?.cost || "",
    description: duplicateFrom?.description || "",
    skillLevels: duplicateFrom?.skillLevels?.join("|") || "beginner|intermediate",
    dropInFriendly: duplicateFrom?.dropInFriendly ?? true,
    isDestinationEvent: false,
    eventDate: "",
    contactEmail: duplicateFrom?.contactEmail || organizer?.contactEmail || "",
    website: duplicateFrom?.website || organizer?.website || "",
    instagram: duplicateFrom?.instagram || organizer?.instagram || "",
    imageUrl: duplicateFrom?.imageUrl || "",
    // League-specific
    leagueStartDate: duplicateFrom?.leagueStartDate || "",
    leagueEndDate: duplicateFrom?.leagueEndDate || "",
    sessionCount: duplicateFrom?.sessionCount?.toString() || "",
    registrationDeadline: duplicateFrom?.registrationDeadline || "",
    commitmentNote: duplicateFrom?.commitmentNote || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadingFlyer, setUploadingFlyer] = useState(false);

  const handleFlyerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organizer) return;
    setUploadingFlyer(true);
    try {
      const { getStorage, ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
      const { getFirebaseApp } = await import("@/lib/firebase");
      const storage = getStorage(getFirebaseApp());
      const storageRef = ref(storage, `event-flyers/${organizer.id}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setForm((prev) => ({ ...prev, imageUrl: url }));
      setMessage("Flyer uploaded!");
    } catch {
      setMessage("Failed to upload flyer.");
    } finally {
      setUploadingFlyer(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.city || !form.state) {
      setMessage("Name, city, and state are required.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      // Auto-geocode address — always include city+state so Nominatim can resolve
      // a bare street address like "15 chestnut avenue" without a city
      let geopoint = { lat: 0, lng: 0 };
      const addressToGeocode = form.address
        ? `${form.address}, ${form.city}, ${form.state}`
        : `${form.city}, ${form.state}`;
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
        eventDate: form.eventDate || null,
        isDestinationEvent: form.isDestinationEvent || false,
        cost: form.cost || "Contact for price",
        description: form.description,
        skillLevels: form.skillLevels.split("|").filter(Boolean),
        dropInFriendly: form.dropInFriendly,
        contactEmail: form.contactEmail,
        website: form.website,
        instagram: form.instagram,
        contactName: organizer?.organizerName || "",
        organizerName: organizer?.organizerName || "",
        ...(form.imageUrl ? { imageUrl: form.imageUrl } : {}),
        ...(form.type === "league" ? {
          leagueStartDate: form.leagueStartDate || null,
          leagueEndDate: form.leagueEndDate || null,
          sessionCount: form.sessionCount ? parseInt(form.sessionCount, 10) : null,
          registrationDeadline: form.registrationDeadline || null,
          commitmentNote: form.commitmentNote,
        } : {}),
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
      <h2 className="text-lg font-semibold text-slate-800 mb-2">
        {duplicateFrom ? "Duplicate Event" : "Add New Event"}
      </h2>
      {duplicateFrom && (
        <p className="text-sm text-skyblue-600 mb-4">
          Based on &quot;{duplicateFrom.name}&quot;. Edit the details below and submit.
        </p>
      )}

      {message && (
        <div className={`p-3 rounded-lg text-sm mb-4 ${message.includes("Failed") || message.includes("wrong") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Event Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                const updates: Partial<typeof form> = { name };
                if (/\b102\b/.test(name)) updates.skillLevels = "beginner|intermediate";
                else if (/\b101\b/.test(name)) updates.skillLevels = "beginner";
                setForm((prev) => ({ ...prev, ...updates }));
              }}
              className="w-full p-2 border border-slate-200 rounded-lg"
              placeholder="e.g. Tuesday Night Mahjong"
            />
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

        {/* League-specific fields */}
        {form.type === "league" && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-purple-800 flex items-center gap-2 text-sm">
              <span className="text-base">🏆</span> League Season Details
            </h3>
            <p className="text-xs text-purple-600">
              League play requires commitment to most or all sessions. Fill in the season info so players know what they&apos;re signing up for.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Season Start Date</label>
                <input type="date" value={form.leagueStartDate} onChange={(e) => updateForm("leagueStartDate", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Season End Date</label>
                <input type="date" value={form.leagueEndDate} onChange={(e) => updateForm("leagueEndDate", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total Sessions</label>
                <input type="number" min="1" max="52" value={form.sessionCount} onChange={(e) => updateForm("sessionCount", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg bg-white" placeholder="e.g. 10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Registration Deadline</label>
                <input type="date" value={form.registrationDeadline} onChange={(e) => updateForm("registrationDeadline", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg bg-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Commitment Requirement</label>
                <input type="text" value={form.commitmentNote} onChange={(e) => updateForm("commitmentNote", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg bg-white" placeholder="e.g. Must attend at least 8 of 10 sessions to be eligible for standings" />
              </div>
            </div>
          </div>
        )}

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

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Skill Level(s)</label>
          <div className="flex flex-wrap gap-2">
            {(["beginner", "intermediate", "advanced"] as const).map((level) => {
              const levels = form.skillLevels.split("|").filter(Boolean);
              const checked = levels.includes(level);
              return (
                <label key={level} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = checked ? levels.filter((l) => l !== level) : [...levels, level];
                      updateForm("skillLevels", next.join("|"));
                    }}
                  />
                  <span className="text-sm text-slate-700 capitalize">{level}</span>
                </label>
              );
            })}
          </div>
          {/\b10[12]\b/.test(form.name) && (
            <p className="text-xs text-skyblue-600 mt-1">Auto-set based on event name</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="dropIn" checked={form.dropInFriendly} onChange={(e) => updateForm("dropInFriendly", e.target.checked)} />
            <label htmlFor="dropIn" className="text-sm text-slate-700">Drop-in friendly</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="destEvent" checked={form.isDestinationEvent} onChange={(e) => updateForm("isDestinationEvent", e.target.checked)} />
            <label htmlFor="destEvent" className="text-sm text-slate-700">Destination / special event</label>
          </div>
        </div>

        {(form.isDestinationEvent || !form.dayOfWeek) && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Event Date</label>
            <input type="date" value={form.eventDate} onChange={(e) => updateForm("eventDate", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" />
          </div>
        )}

        {/* Event flyer upload - subscribers only */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
            <Upload className="w-3 h-3" /> Event Flyer / Photo
          </label>
          {isSubscribed ? (
            <div className="space-y-2">
              {form.imageUrl ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.imageUrl} alt="Event flyer" className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, imageUrl: "" }))}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ) : null}
              <input
                type="file"
                accept="image/*"
                onChange={handleFlyerUpload}
                disabled={uploadingFlyer}
                className="text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-hotpink-100 file:text-hotpink-700 file:font-medium hover:file:bg-hotpink-200"
              />
              {uploadingFlyer && <p className="text-xs text-slate-400">Uploading...</p>}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Flyer uploads are a subscriber perk.{" "}
              <a href="/pricing" className="text-hotpink-500 font-medium hover:text-hotpink-600">Upgrade</a> to add event photos.
            </p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-hotpink-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-hotpink-600 transition disabled:opacity-50 flex items-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add Event
        </button>
      </div>
    </div>
  );
}

// ----- Profile Tab -----

function ProfileTab({
  organizer,
  userId,
  isSubscribed,
  onRefresh,
}: {
  organizer: OrganizerData;
  userId: string;
  isSubscribed: boolean;
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
      const res = await fetch("/api/organizer-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, updates: form }),
      });
      if (res.ok) {
        setMessage("Profile updated!");
        onRefresh();
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to update profile.");
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

      // Update organizer profile with photo (self-service endpoint)
      await fetch("/api/organizer-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          updates: { photoURL: url, photos: [...(organizer.photos || []), url] },
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

        {/* Photo upload - subscribers only */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
            <Upload className="w-3 h-3" /> Profile Photo / Logo
          </label>
          {isSubscribed ? (
            <div className="flex items-center gap-4">
              {organizer.photoURL ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={organizer.photoURL} alt="Current photo" className="w-16 h-16 rounded-full object-cover border-2 border-slate-200" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs">No photo</div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-hotpink-100 file:text-hotpink-700 file:font-medium hover:file:bg-hotpink-200"
                />
                {uploading && <p className="text-xs text-slate-400 mt-1">Uploading...</p>}
                <p className="text-xs text-slate-400 mt-1">This shows on your profile and next to your events in search results</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Photo uploads are available for subscribers.{" "}
              <a href="/pricing" className="text-hotpink-500 font-medium hover:text-hotpink-600">Upgrade</a> to add photos, flyers, and a gallery to your profile.
            </p>
          )}
        </div>

        {/* Venue photo gallery - subscribers only */}
        {isSubscribed && (organizer.photos || []).length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Venue Gallery</label>
            <div className="grid grid-cols-3 gap-2">
              {(organizer.photos || []).map((url, idx) => (
                <div key={idx} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Venue photo ${idx + 1}`} className="w-full h-24 object-cover rounded-lg border border-slate-200" />
                  <button
                    type="button"
                    onClick={async () => {
                      const newPhotos = (organizer.photos || []).filter((_, i) => i !== idx);
                      const newPhotoURL = newPhotos.length > 0 ? newPhotos[newPhotos.length - 1] : "";
                      await fetch("/api/organizer-profile", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          userId,
                          updates: { photos: newPhotos, photoURL: newPhotoURL },
                        }),
                      });
                      onRefresh();
                    }}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove photo"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1">Hover a photo to remove it. The most recent photo is used as your profile photo.</p>
          </div>
        )}

        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.includes("Failed") || message.includes("wrong") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
            {message}
          </div>
        )}

        <button
          onClick={saveProfile}
          disabled={saving}
          className="bg-hotpink-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-hotpink-600 disabled:opacity-50 flex items-center gap-2"
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

      const res = await fetch("/api/organizer-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          updates: { isInstructor, instructorDetails: isInstructor ? details : null },
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
                      ? "bg-hotpink-500 text-white border-hotpink-500"
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
                      ? "bg-hotpink-500 text-white border-hotpink-500"
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
        className="bg-hotpink-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-hotpink-600 disabled:opacity-50 flex items-center gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        Save
      </button>
    </div>
  );
}

// ----- Claim Listings Tab -----

function ClaimListingsTab({
  userId,
  userEmail,
  userName,
  organizerProfileId,
  existingListingIds,
  onSuccess,
}: {
  userId: string;
  userEmail: string;
  userName: string;
  organizerProfileId: string;
  existingListingIds: string[];
  onSuccess: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Load games from Firestore (includes all listings + newly added organizer events)
  useEffect(() => {
    fetch("/api/listings")
      .then((r) => r.json())
      .then((data) => {
        if (data.listings && data.listings.length > 0) {
          setAllGames(data.listings);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { mockGames } = require("@/lib/mock-data");
          setAllGames(mockGames);
        }
      })
      .catch(() => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { mockGames } = require("@/lib/mock-data");
          setAllGames(mockGames);
        } catch {
          setAllGames([]);
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  const filteredGames = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return allGames
      .filter(
        (g: Game) =>
          g.status === "active" &&
          !existingListingIds.includes(g.id) &&
          (g.name.toLowerCase().includes(q) ||
            g.organizerName.toLowerCase().includes(q) ||
            g.contactName.toLowerCase().includes(q) ||
            g.venueName.toLowerCase().includes(q) ||
            g.city.toLowerCase().includes(q))
      )
      .slice(0, 50);
  }, [allGames, searchQuery, existingListingIds]);

  const toggleListing = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleClaim = async () => {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userEmail,
          userName,
          listingIds: selectedIds,
          organizerProfileId,
          message: "Claim from organizer dashboard",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to submit claim.");
      } else {
        setMessage(`Claim submitted for ${selectedIds.length} listing${selectedIds.length > 1 ? "s" : ""}. Pending admin approval.`);
        setSelectedIds([]);
        onSuccess();
      }
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!loaded) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-hotpink-500" /></div>;
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-slate-800 mb-2">Claim Existing Listings</h2>
      <p className="text-sm text-slate-500 mb-4">
        Search for your games that are already listed on MahjNearMe and claim them to manage from your dashboard.
      </p>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by group name, venue, city..."
          className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-softpink-400 focus:outline-none"
        />
      </div>

      {searchQuery.length >= 2 && (
        <div className="space-y-2 max-h-[350px] overflow-y-auto mb-4">
          {filteredGames.length === 0 ? (
            <p className="text-slate-400 text-center py-6 text-sm">No listings found for &quot;{searchQuery}&quot;</p>
          ) : (
            filteredGames.map((game: Game) => (
              <button
                key={game.id}
                onClick={() => toggleListing(game.id)}
                className={`w-full text-left p-3 rounded-lg border-2 transition ${
                  selectedIds.includes(game.id)
                    ? "border-softpink-400 bg-softpink-50"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{game.name}</p>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {game.city}, {game.state}
                      </span>
                      {game.venueName && <span className="truncate">{game.venueName}</span>}
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 mt-1 ${
                    selectedIds.includes(game.id) ? "border-hotpink-500 bg-hotpink-500" : "border-slate-300"
                  }`}>
                    {selectedIds.includes(game.id) && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="bg-skyblue-50 border border-skyblue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-slate-800 mb-3">
            {selectedIds.length} listing{selectedIds.length > 1 ? "s" : ""} selected
          </p>
          <button
            onClick={handleClaim}
            disabled={submitting}
            className="bg-hotpink-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-hotpink-600 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Submit Claim for Approval
          </button>
        </div>
      )}

      {message && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${message.includes("Failed") || message.includes("wrong") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message}
        </div>
      )}
    </div>
  );
}

// ----- Referrals Tab -----

function ReferralsTab({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    hasCode: boolean;
    code: string | null;
    shareLink: string | null;
    referrals: { plan: string; status: string; isVested: boolean; signupDate: string }[];
    activeCount: number;
    vestedCount: number;
    monthlyEarnings: number;
    totalEarned: number;
    totalPaid: number;
    pendingPayout: number;
    canRequestPayout: boolean;
    payoutThreshold: number;
    isPaid: boolean;
    monthlyRate: number;
    annualRate: number;
  } | null>(null);
  const [newCode, setNewCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, [userId]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/organizer-referral?userId=${userId}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch { /* ok */ }
    setLoading(false);
  }

  async function createCode() {
    if (!newCode.trim()) return;
    setCreating(true);
    setMessage("");
    try {
      const res = await fetch("/api/organizer-referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code: newCode }),
      });
      const result = await res.json();
      if (!res.ok) {
        setMessage(result.error || "Failed to create code");
      } else {
        setMessage("Code created!");
        fetchData();
      }
    } catch {
      setMessage("Something went wrong.");
    }
    setCreating(false);
  }

  async function requestPayout() {
    setRequesting(true);
    setMessage("");
    try {
      const res = await fetch("/api/organizer-referral", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const result = await res.json();
      if (!res.ok) {
        setMessage(result.error || "Failed to request payout");
      } else {
        setMessage(`Payout of $${result.amount.toFixed(2)} requested! We will process it shortly.`);
        fetchData();
      }
    } catch {
      setMessage("Something went wrong.");
    }
    setRequesting(false);
  }

  function copyLink() {
    if (data?.shareLink) {
      navigator.clipboard.writeText(data.shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-hotpink-500" /></div>;
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-slate-800 mb-2">Referral Program</h2>
      <p className="text-sm text-slate-500 mb-6">
        Share your code with other mahjong players. They get 15% off their subscription, you earn commissions.
      </p>

      {!data?.hasCode ? (
        /* Create code */
        <div className="bg-white border-2 border-hotpink-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-800 mb-2">Choose your referral code</h3>
          <p className="text-sm text-slate-500 mb-4">Pick something memorable. This is what people will enter at checkout.</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              placeholder="e.g. MAHJ918"
              maxLength={20}
              className="flex-1 p-2.5 border border-slate-200 rounded-lg font-mono text-lg uppercase tracking-wider"
            />
            <button
              onClick={createCode}
              disabled={creating || newCode.length < 3}
              className="bg-hotpink-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-hotpink-600 disabled:opacity-50 flex items-center gap-2"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
              Create Code
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">3-20 characters, letters and numbers only</p>
        </div>
      ) : (
        /* Code stats */
        <div className="space-y-4">
          {/* Code + share */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500">Your code</span>
              <button onClick={copyLink} className="text-xs text-hotpink-500 hover:text-hotpink-600 font-medium flex items-center gap-1">
                <Copy className="w-3 h-3" /> {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
            <p className="text-3xl font-bold text-slate-800 font-mono tracking-wider mb-1">{data.code}</p>
            <p className="text-sm text-slate-400">{data.shareLink}</p>
            <p className="text-xs text-slate-400 mt-2">New subscribers get 15% off when they use your code</p>
          </div>

          {/* Earnings overview */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-800">{data.activeCount}</p>
              <p className="text-xs text-slate-500">Active Referrals</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-600">${data.monthlyEarnings.toFixed(2)}</p>
              <p className="text-xs text-slate-500">Monthly Earnings</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-800">${data.pendingPayout.toFixed(2)}</p>
              <p className="text-xs text-slate-500">Available Balance</p>
            </div>
          </div>

          {/* Commission rates */}
          <div className="bg-skyblue-50 border border-skyblue-200 rounded-lg p-3 text-sm text-skyblue-800">
            <p className="font-medium mb-1">Commission rates</p>
            <p className="text-xs">
              ${data.monthlyRate?.toFixed(2) || "1.00"}/month for each monthly subscriber you refer. ${data.annualRate?.toFixed(2) || "5.00"} for each annual subscriber. 60-day vesting period.
              {!data.isPaid && (
                <span className="block mt-1 text-amber-600">Subscribe to earn higher rates: $1.50/month and $7.50/annual.</span>
              )}
            </p>
          </div>

          {/* Payout button */}
          {data.canRequestPayout && (
            <button
              onClick={requestPayout}
              disabled={requesting}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
              Request Payout (${data.pendingPayout.toFixed(2)})
            </button>
          )}
          {!data.canRequestPayout && data.pendingPayout > 0 && (
            <p className="text-xs text-slate-400 text-center">
              Minimum payout is ${data.payoutThreshold}. Current balance: ${data.pendingPayout.toFixed(2)}
            </p>
          )}

          {/* Referral list */}
          {data.referrals.length > 0 && (
            <div>
              <h3 className="font-medium text-slate-800 mb-2">Your referrals</h3>
              <div className="space-y-1">
                {data.referrals.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${r.status === "active" ? "bg-green-400" : "bg-slate-300"}`} />
                      <span className="text-slate-600">{r.plan === "annual" ? "Annual" : "Monthly"} subscriber</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      {!r.isVested && <span className="text-amber-500">Vesting</span>}
                      {r.isVested && r.status === "active" && (
                        <span className="text-green-600 font-medium">
                          ${r.plan === "monthly" ? (data.monthlyRate?.toFixed(2) || "1.00") : (data.annualRate?.toFixed(2) || "5.00")}{r.plan === "monthly" ? "/mo" : ""}
                        </span>
                      )}
                      <span className="text-slate-400">{new Date(r.signupDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.totalPaid > 0 && (
            <p className="text-xs text-slate-400 text-center">Total paid out: ${data.totalPaid.toFixed(2)}</p>
          )}

          {/* Promotion ideas */}
          <div className="bg-gradient-to-br from-hotpink-50 to-skyblue-50 border border-hotpink-200 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">💬 Promote to your players</h3>
              <p className="text-xs text-slate-500">Copy one of these and share it wherever your players are — Facebook group, email, Instagram, next session.</p>
            </div>

            {[
              {
                label: "Facebook group / email",
                text: `Hey everyone! 🀄 All of my events are now listed on MahjNearMe — the easiest way to find and keep track of our games. Use my code ${data.code} at checkout for 15% off a subscription. Check it out: ${data.shareLink}`,
              },
              {
                label: "Instagram caption",
                text: `Find all my mahjong events in one place on @mahjnearme 🀄✨ New players can use code ${data.code} for 15% off. Link: ${data.shareLink}`,
              },
              {
                label: "Short text / DM",
                text: `My events are on MahjNearMe now! Use code ${data.code} for 15% off: ${data.shareLink}`,
              },
              {
                label: "Giveaway angle 🎁",
                text: `Want to win a free mahjong set? 🀄🎁 MahjNearMe does a monthly giveaway — every subscriber gets an entry automatically. Use my code ${data.code} for 15% off when you sign up: ${data.shareLink}`,
              },
            ].map(({ label, text }) => (
              <div key={label} className="bg-white rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-slate-600">{label}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(text); }}
                    className="text-xs text-hotpink-500 hover:text-hotpink-600 font-medium flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {message && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${message.includes("Failed") || message.includes("wrong") || message.includes("taken") || message.includes("Minimum") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message}
        </div>
      )}
    </div>
  );
}
