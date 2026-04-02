"use client";

import { useState } from "react";
import { Game, GameType, GameStyle, SkillLevel } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import {
  Pencil,
  X,
  CheckCircle,
  Loader2,
  ChevronDown,
  MapPin,
  RefreshCw,
} from "lucide-react";

async function adminFetch(route: string, method = "GET", body?: unknown) {
  return fetch("/api/admin-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ route, method, body }),
  });
}

interface EditForm {
  name: string;
  organizerName: string;
  type: GameType;
  gameStyle: GameStyle;
  venueName: string;
  address: string;
  city: string;
  state: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  frequency: string;
  eventDate: string;
  cost: string;
  description: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  instagram: string;
  facebookGroup: string;
  registrationLink: string;
  howToJoin: string;
  whatToBring: string;
  skillLevels: string;
  dropInFriendly: boolean;
  setsProvided: boolean;
  typicalGroupSize: string;
  imageUrl: string;
  status: string;
  verified: boolean;
  promoted: boolean;
  isDestinationEvent: boolean;
  leagueStartDate: string;
  leagueEndDate: string;
  sessionCount: string;
  registrationDeadline: string;
  commitmentNote: string;
}

function gameToForm(g: Game): EditForm {
  return {
    name: g.name || "",
    organizerName: g.organizerName || "",
    type: g.type || "open_play",
    gameStyle: g.gameStyle || "american",
    venueName: g.venueName || "",
    address: g.address || "",
    city: g.city || "",
    state: g.state || "",
    dayOfWeek: g.recurringSchedule?.dayOfWeek || "",
    startTime: g.recurringSchedule?.startTime || "",
    endTime: g.recurringSchedule?.endTime || "",
    frequency: g.recurringSchedule?.frequency || "weekly",
    eventDate: g.eventDate || "",
    cost: g.cost || "",
    description: g.description || "",
    contactName: g.contactName || "",
    contactEmail: g.contactEmail || "",
    contactPhone: g.contactPhone || "",
    website: g.website || "",
    instagram: g.instagram || "",
    facebookGroup: g.facebookGroup || "",
    registrationLink: g.registrationLink || "",
    howToJoin: g.howToJoin || "",
    whatToBring: g.whatToBring || "",
    skillLevels: (g.skillLevels || []).join("|"),
    dropInFriendly: g.dropInFriendly ?? false,
    setsProvided: g.setsProvided ?? false,
    typicalGroupSize: g.typicalGroupSize || "",
    imageUrl: g.imageUrl || "",
    status: g.status || "active",
    verified: g.verified ?? false,
    promoted: g.promoted ?? false,
    isDestinationEvent: g.isDestinationEvent ?? false,
    leagueStartDate: g.leagueStartDate || "",
    leagueEndDate: g.leagueEndDate || "",
    sessionCount: g.sessionCount?.toString() || "",
    registrationDeadline: g.registrationDeadline || "",
    commitmentNote: g.commitmentNote || "",
  };
}

// Small helpers to keep the form clean
function F({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-0.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-hotpink-400" />
    </div>
  );
}

function TA({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-0.5">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3}
        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-hotpink-400" />
    </div>
  );
}

function Sel({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-0.5">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-hotpink-400">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Tog({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full transition-colors ${checked ? "bg-hotpink-500" : "bg-slate-600"} relative flex-shrink-0`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
      <span className="text-sm text-slate-300">{label}</span>
    </label>
  );
}

// Section header
function Section({ title }: { title: string }) {
  return <p className="text-xs font-bold text-slate-500 uppercase tracking-wide pt-2">{title}</p>;
}

/**
 * AdminEditBar — renders only for admins.
 * Shows a fixed bottom bar with an "Edit" button that slides up a dark
 * drawer with full inline editing for every field on the listing.
 */
export default function AdminEditBar({ game, onSaved }: {
  game: Game;
  onSaved?: (updated: Game) => void;
}) {
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<EditForm>(gameToForm(game));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [regeocoding, setRegeocoding] = useState(false);

  // Don't render anything for non-admins
  if (!isAdmin) return null;

  const set = (field: keyof EditForm) => (value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const regeocode = async () => {
    setRegeocoding(true);
    const q = form.address
      ? `${form.address}, ${form.city}, ${form.state}`
      : `${form.city}, ${form.state}`;
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.lat && data.lng) {
        setMessage(`📍 Geocoded: ${data.lat.toFixed(5)}, ${data.lng.toFixed(5)} — save to apply`);
        (form as unknown as Record<string, unknown>)._pendingGeopoint = { lat: data.lat, lng: data.lng };
      } else {
        setMessage("Geocoding failed — try a more specific address");
      }
    } catch { setMessage("Geocoding failed"); }
    setRegeocoding(false);
  };

  const save = async () => {
    setSaving(true);
    setMessage("");

    const payload: Record<string, unknown> = {
      id: game.id,
      name: form.name,
      organizerName: form.organizerName,
      type: form.type,
      gameStyle: form.gameStyle,
      venueName: form.venueName,
      address: form.address,
      city: form.city,
      state: form.state.toUpperCase(),
      cost: form.cost || "Contact for price",
      description: form.description,
      contactName: form.contactName,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      website: form.website,
      instagram: form.instagram,
      facebookGroup: form.facebookGroup,
      registrationLink: form.registrationLink,
      howToJoin: form.howToJoin,
      whatToBring: form.whatToBring,
      skillLevels: form.skillLevels.split("|").filter(Boolean) as SkillLevel[],
      dropInFriendly: form.dropInFriendly,
      setsProvided: form.setsProvided,
      typicalGroupSize: form.typicalGroupSize,
      imageUrl: form.imageUrl,
      status: form.status,
      verified: form.verified,
      promoted: form.promoted,
      isDestinationEvent: form.isDestinationEvent,
      leagueStartDate: form.leagueStartDate || null,
      leagueEndDate: form.leagueEndDate || null,
      sessionCount: form.sessionCount ? parseInt(form.sessionCount, 10) : null,
      registrationDeadline: form.registrationDeadline || null,
      commitmentNote: form.commitmentNote,
      isRecurring: !!form.dayOfWeek,
      recurringSchedule: form.dayOfWeek
        ? { dayOfWeek: form.dayOfWeek, startTime: form.startTime, endTime: form.endTime, frequency: form.frequency }
        : null,
      eventDate: form.eventDate || null,
    };

    // Auto-geocode if address changed or coords are missing
    const addrChanged = form.address !== game.address || form.city !== game.city || form.state !== game.state;
    const noCoords = !game.geopoint || (game.geopoint.lat === 0 && game.geopoint.lng === 0);
    if (addrChanged || noCoords) {
      try {
        const q = form.address
          ? `${form.address}, ${form.city}, ${form.state}`
          : `${form.city}, ${form.state}`;
        const geoRes = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        const geoData = await geoRes.json();
        if (geoData.lat && geoData.lng) payload.geopoint = { lat: geoData.lat, lng: geoData.lng };
      } catch { /* keep existing */ }
    }

    try {
      const res = await adminFetch("/api/listings", "PUT", payload);
      if (res.ok) {
        setMessage("✓ Saved!");
        onSaved?.({ ...game, ...payload } as unknown as Game);
        setTimeout(() => { setOpen(false); setMessage(""); }, 900);
      } else {
        const data = await res.json();
        setMessage(data.error || "Save failed");
      }
    } catch { setMessage("Something went wrong"); }
    setSaving(false);
  };

  const hasCoords = game.geopoint?.lat !== 0 || game.geopoint?.lng !== 0;

  return (
    <>
      {/* Fixed admin bar at the bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-700 px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-hotpink-400 uppercase tracking-wide flex-shrink-0">Admin</span>
          <span className="text-xs text-slate-400 truncate">{game.name}</span>
          {!hasCoords && (
            <span className="flex-shrink-0 text-xs bg-red-900 text-red-300 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5" /> No map
            </span>
          )}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex-shrink-0 flex items-center gap-1.5 bg-hotpink-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-hotpink-600"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
      </div>

      {/* Bottom drawer / slide-up panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed inset-x-0 bottom-0 z-50 bg-slate-900 rounded-t-2xl max-h-[90vh] flex flex-col">
            {/* Handle + header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 flex-shrink-0">
              <div>
                <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-3" />
                <p className="text-sm font-semibold text-white">Edit Listing</p>
                <p className="text-xs text-slate-400">{game.id}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable form body */}
            <div className="overflow-y-auto flex-1 px-4 py-4 space-y-4">

              <Section title="Basics" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2"><F label="Event Name" value={form.name} onChange={set("name")} /></div>
                <F label="Organizer Name" value={form.organizerName} onChange={set("organizerName")} />
                <Sel label="Type" value={form.type} onChange={set("type")} options={[
                  { value: "open_play", label: "Open Play" }, { value: "lesson", label: "Lesson" },
                  { value: "league", label: "League" }, { value: "event", label: "Event" }, { value: "private", label: "Private" },
                ]} />
                <Sel label="Game Style" value={form.gameStyle} onChange={set("gameStyle")} options={[
                  { value: "american", label: "American (NMJL)" }, { value: "chinese", label: "Chinese" },
                  { value: "riichi", label: "Riichi" }, { value: "other", label: "Other" },
                ]} />
                <Sel label="Status" value={form.status} onChange={set("status")} options={[
                  { value: "active", label: "Active" }, { value: "pending", label: "Pending" }, { value: "inactive", label: "Inactive" },
                ]} />
              </div>

              <Section title="Location" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2"><F label="Venue Name" value={form.venueName} onChange={set("venueName")} /></div>
                <div className="sm:col-span-2"><F label="Street Address" value={form.address} onChange={set("address")} placeholder="Auto-geocoded on save" /></div>
                <F label="City" value={form.city} onChange={set("city")} />
                <F label="State" value={form.state} onChange={set("state")} placeholder="e.g. NY" />
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${hasCoords ? "text-green-400" : "text-red-400"}`}>
                  {hasCoords ? `📍 ${game.geopoint.lat.toFixed(4)}, ${game.geopoint.lng.toFixed(4)}` : "⚠️ No coordinates"}
                </span>
                <button onClick={regeocode} disabled={regeocoding}
                  className="text-xs text-hotpink-400 hover:text-hotpink-300 flex items-center gap-0.5">
                  {regeocoding ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Re-geocode
                </button>
              </div>

              <Section title="Schedule" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Sel label="Day" value={form.dayOfWeek} onChange={set("dayOfWeek")} options={[
                  { value: "", label: "One-time" }, { value: "monday", label: "Mon" }, { value: "tuesday", label: "Tue" },
                  { value: "wednesday", label: "Wed" }, { value: "thursday", label: "Thu" }, { value: "friday", label: "Fri" },
                  { value: "saturday", label: "Sat" }, { value: "sunday", label: "Sun" },
                ]} />
                <F label="Start" value={form.startTime} onChange={set("startTime")} type="time" />
                <F label="End" value={form.endTime} onChange={set("endTime")} type="time" />
                <Sel label="Frequency" value={form.frequency} onChange={set("frequency")} options={[
                  { value: "weekly", label: "Weekly" }, { value: "biweekly", label: "Biweekly" }, { value: "monthly", label: "Monthly" },
                ]} />
              </div>
              <F label="Event Date (one-time events)" value={form.eventDate} onChange={set("eventDate")} type="date" />

              <Section title="Details" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <F label="Cost" value={form.cost} onChange={set("cost")} placeholder="e.g. $5, Free" />
                <F label="Typical Group Size" value={form.typicalGroupSize} onChange={set("typicalGroupSize")} />
                <div className="sm:col-span-2">
                  <F label="Skill Levels" value={form.skillLevels} onChange={set("skillLevels")} placeholder="beginner|intermediate|advanced" />
                </div>
                <div className="sm:col-span-2"><F label="Image / Flyer URL" value={form.imageUrl} onChange={set("imageUrl")} /></div>
              </div>
              <TA label="Description" value={form.description} onChange={set("description")} />
              <TA label="How to Join" value={form.howToJoin} onChange={set("howToJoin")} />
              <TA label="What to Bring" value={form.whatToBring} onChange={set("whatToBring")} />
              <div className="flex flex-wrap gap-4">
                <Tog label="Drop-in friendly" checked={form.dropInFriendly} onChange={set("dropInFriendly") as (v: boolean) => void} />
                <Tog label="Sets provided" checked={form.setsProvided} onChange={set("setsProvided") as (v: boolean) => void} />
              </div>

              <Section title="Contact & Links" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <F label="Contact Name" value={form.contactName} onChange={set("contactName")} />
                <F label="Contact Email" value={form.contactEmail} onChange={set("contactEmail")} type="email" />
                <F label="Phone" value={form.contactPhone} onChange={set("contactPhone")} type="tel" />
                <F label="Website" value={form.website} onChange={set("website")} />
                <F label="Instagram" value={form.instagram} onChange={set("instagram")} />
                <F label="Facebook Group" value={form.facebookGroup} onChange={set("facebookGroup")} />
                <div className="sm:col-span-2"><F label="Registration Link" value={form.registrationLink} onChange={set("registrationLink")} /></div>
              </div>

              <Section title="Admin Flags" />
              <div className="flex flex-wrap gap-4">
                <Tog label="Verified" checked={form.verified} onChange={set("verified") as (v: boolean) => void} />
                <Tog label="Featured (Promoted)" checked={form.promoted} onChange={set("promoted") as (v: boolean) => void} />
                <Tog label="Destination Event" checked={form.isDestinationEvent} onChange={set("isDestinationEvent") as (v: boolean) => void} />
              </div>

              {form.type === "league" && (
                <>
                  <Section title="League Season" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <F label="Season Start" value={form.leagueStartDate} onChange={set("leagueStartDate")} type="date" />
                    <F label="Season End" value={form.leagueEndDate} onChange={set("leagueEndDate")} type="date" />
                    <F label="Total Sessions" value={form.sessionCount} onChange={set("sessionCount")} placeholder="e.g. 10" />
                    <F label="Registration Deadline" value={form.registrationDeadline} onChange={set("registrationDeadline")} type="date" />
                    <div className="sm:col-span-2">
                      <F label="Commitment Note" value={form.commitmentNote} onChange={set("commitmentNote")} placeholder="e.g. Must attend 8 of 10 sessions" />
                    </div>
                  </div>
                </>
              )}

              {/* Spacer so save button doesn't cover last field */}
              <div className="h-4" />
            </div>

            {/* Sticky save bar */}
            <div className="flex-shrink-0 px-4 py-3 border-t border-slate-700 bg-slate-900">
              {message && (
                <p className={`text-sm mb-2 font-medium ${message.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
                  {message}
                </p>
              )}
              <div className="flex gap-2">
                <button onClick={save} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-hotpink-500 text-white py-3 rounded-xl text-sm font-semibold hover:bg-hotpink-600 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Save Changes
                </button>
                <button onClick={() => { setOpen(false); setForm(gameToForm(game)); setMessage(""); }}
                  className="px-4 py-3 border border-slate-600 rounded-xl text-sm text-slate-300 hover:bg-slate-800">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
