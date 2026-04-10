"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Edit3,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Star,
  XCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { Game, GameType, GameStyle, SkillLevel } from "@/types";

import { adminFetch } from "@/lib/admin-fetch";

// All editable fields for an event
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
  skillLevels: string; // pipe-separated
  dropInFriendly: boolean;
  setsProvided: boolean;
  typicalGroupSize: string;
  imageUrl: string;
  status: string;
  verified: boolean;
  promoted: boolean;
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
  };
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-0.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-hotpink-400"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-0.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-hotpink-400"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-0.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-hotpink-400"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full transition-colors ${checked ? "bg-hotpink-500" : "bg-slate-200"} flex-shrink-0 relative`}
      >
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

// ---- Event Card ----

function EventCard({
  game,
  onSaved,
  onDeleted,
}: {
  game: Game;
  onSaved: (updated: Game) => void;
  onDeleted: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<EditForm>(gameToForm(game));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [regeocoding, setRegeocoding] = useState(false);

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
        setMessage(`Geocoded: ${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`);
        // Will be saved with next save
        (form as unknown as Record<string, unknown>)._pendingGeopoint = { lat: data.lat, lng: data.lng };
      } else {
        setMessage("Geocoding failed — check the address");
      }
    } catch {
      setMessage("Geocoding failed");
    } finally {
      setRegeocoding(false);
    }
  };

  const deleteListing = async () => {
    setDeleting(true);
    try {
      const res = await adminFetch(`/api/listings?id=${game.id}`, "DELETE");
      if (res.ok) {
        onDeleted(game.id);
      } else {
        const data = await res.json();
        setMessage(data.error || "Delete failed");
        setConfirmDelete(false);
      }
    } catch {
      setMessage("Something went wrong");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setMessage("");

    // Build the payload — all fields
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
      isRecurring: !!form.dayOfWeek,
      recurringSchedule: form.dayOfWeek
        ? { dayOfWeek: form.dayOfWeek, startTime: form.startTime, endTime: form.endTime, frequency: form.frequency }
        : null,
      eventDate: form.eventDate || null,
    };

    // Re-geocode if address changed
    const addrChanged =
      form.address !== game.address ||
      form.city !== game.city ||
      form.state !== game.state;

    if (addrChanged || (game.geopoint.lat === 0 && game.geopoint.lng === 0)) {
      try {
        const q = form.address
          ? `${form.address}, ${form.city}, ${form.state}`
          : `${form.city}, ${form.state}`;
        const geoRes = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        const geoData = await geoRes.json();
        if (geoData.lat && geoData.lng) {
          payload.geopoint = { lat: geoData.lat, lng: geoData.lng };
        }
      } catch {
        // Keep existing geopoint
      }
    }

    try {
      const res = await adminFetch("/api/listings", "PUT", payload);
      if (res.ok) {
        setMessage("Saved!");
        onSaved({ ...game, ...payload } as unknown as Game);
        setTimeout(() => { setOpen(false); setMessage(""); }, 800);
      } else {
        const data = await res.json();
        setMessage(data.error || "Save failed");
      }
    } catch {
      setMessage("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const hasCoords = game.geopoint.lat !== 0 || game.geopoint.lng !== 0;

  return (
    <div className={`bg-white border rounded-xl overflow-hidden ${open ? "border-hotpink-300 shadow-md" : "border-slate-200"}`}>
      {/* Header row */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-3 p-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800 text-sm leading-tight">{game.name}</span>
            {game.promoted && <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />Featured</span>}
            {game.verified && !game.promoted && <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><ShieldCheck className="w-2.5 h-2.5" />Verified</span>}
            {!hasCoords && <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />No map</span>}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {game.city}, {game.state} · {game.type.replace("_", " ")} · {game.status}
          </p>
        </div>
        <div className="flex-shrink-0 text-slate-400">
          {open ? <ChevronUp className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
        </div>
      </button>

      {/* Edit form */}
      {open && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-5">

          {/* Basics */}
          <section>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Basics</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Field label="Event Name" value={form.name} onChange={set("name")} />
              </div>
              <Field label="Organizer Name" value={form.organizerName} onChange={set("organizerName")} />
              <SelectField label="Type" value={form.type} onChange={set("type")} options={[
                { value: "open_play", label: "Open Play" },
                { value: "lesson", label: "Lesson" },
                { value: "league", label: "League" },
                { value: "event", label: "Event" },
                { value: "private", label: "Private" },
              ]} />
              <SelectField label="Game Style" value={form.gameStyle} onChange={set("gameStyle")} options={[
                { value: "american", label: "American (NMJL)" },
                { value: "chinese", label: "Chinese" },
                { value: "riichi", label: "Riichi / Japanese" },
                { value: "other", label: "Other / Mixed" },
              ]} />
              <SelectField label="Status" value={form.status} onChange={set("status")} options={[
                { value: "active", label: "Active" },
                { value: "pending", label: "Pending" },
                { value: "inactive", label: "Inactive" },
              ]} />
            </div>
          </section>

          {/* Location */}
          <section>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Location</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Field label="Venue Name" value={form.venueName} onChange={set("venueName")} />
              </div>
              <div className="sm:col-span-2">
                <Field label="Street Address" value={form.address} onChange={set("address")} placeholder="Auto-geocoded on save" />
              </div>
              <Field label="City" value={form.city} onChange={set("city")} />
              <Field label="State" value={form.state} onChange={set("state")} placeholder="e.g. NY" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs ${hasCoords ? "text-green-600" : "text-red-500"}`}>
                {hasCoords
                  ? `📍 ${game.geopoint.lat.toFixed(4)}, ${game.geopoint.lng.toFixed(4)}`
                  : "⚠️ No coordinates — save to auto-geocode"}
              </span>
              <button
                onClick={regeocode}
                disabled={regeocoding}
                className="text-xs text-hotpink-500 hover:text-hotpink-700 flex items-center gap-0.5"
              >
                {regeocoding ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Re-geocode
              </button>
            </div>
          </section>

          {/* Schedule */}
          <section>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Schedule</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SelectField label="Day" value={form.dayOfWeek} onChange={set("dayOfWeek")} options={[
                { value: "", label: "One-time" },
                { value: "monday", label: "Mon" },
                { value: "tuesday", label: "Tue" },
                { value: "wednesday", label: "Wed" },
                { value: "thursday", label: "Thu" },
                { value: "friday", label: "Fri" },
                { value: "saturday", label: "Sat" },
                { value: "sunday", label: "Sun" },
              ]} />
              <Field label="Start" value={form.startTime} onChange={set("startTime")} type="time" />
              <Field label="End" value={form.endTime} onChange={set("endTime")} type="time" />
              <SelectField label="Frequency" value={form.frequency} onChange={set("frequency")} options={[
                { value: "weekly", label: "Weekly" },
                { value: "biweekly", label: "Biweekly" },
                { value: "monthly", label: "Monthly" },
              ]} />
            </div>
            <div className="mt-3">
              <Field label="Event Date (one-time events)" value={form.eventDate} onChange={set("eventDate")} type="date" />
            </div>
          </section>

          {/* Details */}
          <section>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Cost" value={form.cost} onChange={set("cost")} placeholder="e.g. $5, Free" />
              <Field label="Typical Group Size" value={form.typicalGroupSize} onChange={set("typicalGroupSize")} />
              <Field label="Skill Levels (pipe-separated)" value={form.skillLevels} onChange={set("skillLevels")} placeholder="beginner|intermediate|advanced" />
              <Field label="Image / Flyer URL" value={form.imageUrl} onChange={set("imageUrl")} />
            </div>
            <div className="mt-3 space-y-2">
              <TextArea label="Description" value={form.description} onChange={set("description")} />
              <TextArea label="How to Join" value={form.howToJoin} onChange={set("howToJoin")} />
              <TextArea label="What to Bring" value={form.whatToBring} onChange={set("whatToBring")} />
            </div>
            <div className="mt-3 flex flex-wrap gap-4">
              <Toggle label="Drop-in friendly" checked={form.dropInFriendly} onChange={set("dropInFriendly") as (v: boolean) => void} />
              <Toggle label="Sets provided" checked={form.setsProvided} onChange={set("setsProvided") as (v: boolean) => void} />
            </div>
          </section>

          {/* Contact */}
          <section>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Contact & Links</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Contact Name" value={form.contactName} onChange={set("contactName")} />
              <Field label="Contact Email" value={form.contactEmail} onChange={set("contactEmail")} type="email" />
              <Field label="Phone" value={form.contactPhone} onChange={set("contactPhone")} type="tel" />
              <Field label="Website" value={form.website} onChange={set("website")} />
              <Field label="Instagram" value={form.instagram} onChange={set("instagram")} />
              <Field label="Facebook Group" value={form.facebookGroup} onChange={set("facebookGroup")} />
              <div className="sm:col-span-2">
                <Field label="Registration Link" value={form.registrationLink} onChange={set("registrationLink")} />
              </div>
            </div>
          </section>

          {/* Flags */}
          <section>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Admin Flags</p>
            <div className="flex flex-wrap gap-4">
              <Toggle label="Verified" checked={form.verified} onChange={set("verified") as (v: boolean) => void} />
              <Toggle label="Featured (Promoted)" checked={form.promoted} onChange={set("promoted") as (v: boolean) => void} />
            </div>
          </section>

          {/* Save */}
          {message && (
            <p className={`text-sm font-medium ${message.includes("Saved") ? "text-green-600" : "text-red-500"}`}>
              {message}
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 bg-hotpink-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-hotpink-600 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Save Changes
            </button>
            <button
              onClick={() => { setOpen(false); setForm(gameToForm(game)); setMessage(""); }}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={deleteListing}
                  disabled={deleting}
                  className="px-3 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50 flex items-center gap-1"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                </button>
                <button onClick={() => setConfirmDelete(false)} className="px-2 py-2.5 text-sm text-slate-500 hover:text-slate-700">
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-2.5 border border-red-200 text-red-400 hover:text-red-600 hover:border-red-400 rounded-xl transition"
                title="Delete listing"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Page ----

export default function AdminEventsPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "inactive">("active");
  const [sourceFilter, setSourceFilter] = useState<"all" | "organizer" | "json">("all");
  const [missingCoordsOnly, setMissingCoordsOnly] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeProgress, setGeocodeProgress] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Cache-bust: the /api/listings endpoint has a 60-second CDN cache.
      // Without a unique query param, a refresh after a delete/edit serves
      // the stale CDN response and the change appears to be "undone".
      const bust = `_t=${Date.now()}`;
      const res = await fetch(`/api/listings?status=all&${bust}`);
      const data = await res.json();
      // /api/listings only returns active; also fetch pending via admin proxy
      const adminRes = await adminFetch(`/api/listings?${bust}`);
      const adminData = await adminRes.json();
      // Merge: prefer admin data which may include pending
      const all = adminData.listings || data.listings || [];
      setGames(all as Game[]);
    } catch {
      // Fallback to public endpoint
      fetch(`/api/listings?_t=${Date.now()}`)
        .then((r) => r.json())
        .then((d) => setGames(d.listings || []))
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = games.filter((g) => {
    const q = search.toLowerCase().replace(/^@/, "");
    const matchSearch = !q ||
      (g.name || "").toLowerCase().includes(q) ||
      (g.city || "").toLowerCase().includes(q) ||
      (g.organizerName || "").toLowerCase().includes(q) ||
      (g.instagram || "").toLowerCase().replace(/^@/, "").includes(q) ||
      (g.contactEmail || "").toLowerCase().includes(q) ||
      (g.venueName || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || g.status === statusFilter;
    const matchSource = sourceFilter === "all" ||
      (sourceFilter === "organizer" && g.source === "organizer_submitted") ||
      (sourceFilter === "json" && g.source !== "organizer_submitted");
    const noCoords = !g.geopoint || (g.geopoint.lat === 0 && g.geopoint.lng === 0);
    const matchCoords = !missingCoordsOnly || noCoords;
    return matchSearch && matchStatus && matchSource && matchCoords;
  });

  const noCoords = games.filter((g) => !g.geopoint || (g.geopoint.lat === 0 && g.geopoint.lng === 0)).length;

  const batchGeocode = async () => {
    const missing = games.filter((g) => !g.geopoint || (g.geopoint.lat === 0 && g.geopoint.lng === 0));
    if (missing.length === 0) return;
    setGeocoding(true);
    let done = 0;
    let succeeded = 0;
    for (const g of missing) {
      const q = g.address ? `${g.address}, ${g.city}, ${g.state}` : `${g.city}, ${g.state}`;
      if (!g.city && !g.address) { done++; continue; }
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (data.lat && data.lng) {
          await adminFetch("/api/listings", "PUT", { id: g.id, geopoint: { lat: data.lat, lng: data.lng } });
          setGames((prev) => prev.map((x) => x.id === g.id ? { ...x, geopoint: { lat: data.lat, lng: data.lng } } : x));
          succeeded++;
        }
      } catch { /* skip */ }
      done++;
      setGeocodeProgress(`${done}/${missing.length} geocoded (${succeeded} found)`);
      // Nominatim rate limit: 1 req/sec
      await new Promise((r) => setTimeout(r, 1100));
    }
    setGeocoding(false);
    setGeocodeProgress(`Done — ${succeeded} of ${missing.length} geocoded`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">Events</h1>
        <div className="flex items-center gap-2">
          {noCoords > 0 && (
            <button
              onClick={batchGeocode}
              disabled={geocoding}
              className="text-xs bg-red-100 text-red-600 hover:bg-red-200 px-2 py-1 rounded-full flex items-center gap-1 transition disabled:opacity-50"
            >
              {geocoding ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
              {geocoding ? geocodeProgress : `${noCoords} missing coords — fix all`}
            </button>
          )}
          {geocodeProgress && !geocoding && (
            <span className="text-xs text-green-600">{geocodeProgress}</span>
          )}
          <button onClick={load} className="text-slate-400 hover:text-slate-600">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, city, or organizer…"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-hotpink-400"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "active", "pending", "inactive"] as const).map((f) => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition ${statusFilter === f ? "bg-hotpink-500 text-white border-hotpink-500" : "border-slate-200 bg-white text-slate-600"}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <div className="w-px bg-slate-200 mx-0.5" />
          <button onClick={() => setSourceFilter(sourceFilter === "organizer" ? "all" : "organizer")}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${sourceFilter === "organizer" ? "bg-blue-500 text-white border-blue-500" : "border-slate-200 bg-white text-slate-600"}`}>
            Organizer-added
          </button>
          <button onClick={() => setMissingCoordsOnly(!missingCoordsOnly)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${missingCoordsOnly ? "bg-red-500 text-white border-red-500" : "border-slate-200 bg-white text-slate-600"}`}>
            No map pin
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-3">{filtered.length} of {games.length} events</p>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-hotpink-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <XCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No events match your filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((game) => (
            <EventCard
              key={game.id}
              game={game}
              onSaved={(updated) =>
                setGames((prev) => prev.map((g) => (g.id === updated.id ? updated : g)))
              }
              onDeleted={(id) =>
                setGames((prev) => prev.filter((g) => g.id !== id))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
