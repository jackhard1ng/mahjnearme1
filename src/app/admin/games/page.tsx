"use client";

import { useState, useRef, useEffect } from "react";
import { mockGames } from "@/lib/mock-data";
import { GAME_TYPE_LABELS, GAME_STYLE_LABELS, SKILL_LEVEL_LABELS, DAYS_OF_WEEK } from "@/lib/constants";
import { getVerificationStatus, getGameTypeLabel, formatSchedule } from "@/lib/utils";
import { GameType, GameStyle, SkillLevel, Game } from "@/types";

// Helper to route admin API calls through the secure proxy
async function adminFetch(route: string, method: string = "GET", body?: unknown): Promise<Response> {
  return fetch("/api/admin-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ route, method, body }),
  });
}

import {
  Plus,
  Upload,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Edit,
  Trash2,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  ChevronDown,
  X,
} from "lucide-react";
import Papa from "papaparse";
import { geocodeAddress } from "@/lib/geocode";

type View = "list" | "add" | "csv" | "bulk";

const emptyForm = {
  name: "",
  organizerName: "",
  type: "open_play" as GameType,
  gameStyle: "american" as GameStyle,
  city: "",
  state: "",
  venueName: "",
  address: "",
  generalArea: "",
  dayOfWeek: "monday",
  startTime: "18:00",
  endTime: "20:00",
  cost: "",
  contactEmail: "",
  description: "",
  skillLevels: ["beginner", "intermediate"] as SkillLevel[],
  dropInFriendly: true,
  setsProvided: true,
};

export default function AdminGamesPage() {
  const [view, setView] = useState<View>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mutable games state — loads from Firestore so organizer-submitted events appear
  const [games, setGames] = useState<Game[]>(mockGames);
  const [organizers, setOrganizers] = useState<{ id: string; name: string; email: string; website: string; instagram: string; city: string; state: string }[]>([]);

  // Load listings from Firestore on mount
  useEffect(() => {
    fetch("/api/listings")
      .then((r) => r.json())
      .then((data) => {
        if (data.listings && data.listings.length > 0) {
          setGames(data.listings as Game[]);
        }
      })
      .catch(() => {}); // keep mockGames on error
  }, []);

  // Load organizers for autofill
  useEffect(() => {
    adminFetch("/api/organizers?all=true")
      .then((r) => r.json())
      .then((data) => {
        if (data.organizers) {
          setOrganizers(data.organizers.map((o: Record<string, unknown>) => ({
            id: o.id,
            name: (o.organizerName as string) || "",
            email: (o.contactEmail as string) || "",
            website: (o.website as string) || "",
            instagram: (o.instagram as string) || "",
            city: ((o.cities as string[]) || [])[0] || "",
            state: ((o.states as string[]) || [])[0] || "",
          })).sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)));
        }
      })
      .catch(() => {});
  }, []);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  // Expanded row (detail view) state
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);

  // Editing state - tracks which game is being edited (null = creating new)
  const [editingGameId, setEditingGameId] = useState<string | null>(null);

  // Auto-dismiss toast
  useState(() => {
    // We use an effect-like pattern with a cleanup via the toast state itself
  });

  // Show toast with auto-dismiss
  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredGames = games.filter((game) => {
    const matchesSearch =
      !searchQuery ||
      game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || game.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];
        const data = results.data as Record<string, string>[];

        // Validate required fields
        data.forEach((row, i) => {
          if (!row.name) errors.push(`Row ${i + 1}: Missing name`);
          if (!row.city) errors.push(`Row ${i + 1}: Missing city`);
          if (!row.state) errors.push(`Row ${i + 1}: Missing state`);
        });

        setCsvErrors(errors);
        setCsvData(data);
      },
      error: (error) => {
        setCsvErrors([`Parse error: ${error.message}`]);
      },
    });
  };

  const handleCsvImport = async () => {
    showToast(`Importing ${csvData.length} games and geocoding addresses...`, "info");

    // Create Game objects and geocode each address
    const newGames: Game[] = await Promise.all(
      csvData.map(async (row, index) => {
        const id = `csv-${Date.now()}-${index}`;
        const skillLevels: SkillLevel[] = row.skillLevels
          ? (row.skillLevels.split("|").filter((s) => ["beginner", "intermediate", "advanced"].includes(s.trim())) as SkillLevel[])
          : ["beginner", "intermediate"];

        const addressToGeocode = row.address || `${row.venueName || ""}, ${row.city || ""}, ${row.state || ""}`;
        const geopoint = await geocodeAddress(addressToGeocode);

        return {
          id,
          name: row.name || "Untitled Game",
          organizerName: row.contactName || "",
          type: (row.type as GameType) || "open_play",
          gameStyle: (row.gameStyle as GameStyle) || "american",
          city: row.city || "",
          state: row.state || "",
          generalArea: row.generalArea || "",
          venueName: row.venueName || "",
          address: row.address || "",
          geopoint,
          isRecurring: row.isRecurring === "true" || row.isRecurring === "1" || !!row.dayOfWeek,
          recurringSchedule: row.dayOfWeek
            ? {
                dayOfWeek: row.dayOfWeek,
                startTime: row.startTime || "18:00",
                endTime: row.endTime || "20:00",
                frequency: (row.frequency as "weekly" | "biweekly" | "monthly") || "weekly",
              }
            : null,
          eventDate: null,
          eventStartTime: null,
          eventEndTime: null,
          cost: row.cost || "Contact for price",
          costAmount: null,
          contactName: row.contactName || "",
          contactEmail: row.contactEmail || "",
          contactPhone: "",
          website: row.website || "",
          instagram: row.instagram || "",
          facebookGroup: "",
          registrationLink: "",
          description: row.description || "",
          howToJoin: row.howToJoin || "",
          whatToBring: row.whatToBring || "",
          skillLevels,
          dropInFriendly: row.dropInFriendly !== "false" && row.dropInFriendly !== "0",
          setsProvided: row.setsProvided !== "false" && row.setsProvided !== "0",
          maxPlayers: row.typicalGroupSize ? null : null,
          typicalGroupSize: row.typicalGroupSize || "",
          imageUrl: "",
          status: "pending",
          verified: false,
          claimedBy: null,
          source: "csv_import",
          promoted: false,
          lastVerified: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Game;
      })
    );

    setGames((prev) => [...newGames, ...prev]);
    showToast(`Successfully imported ${newGames.length} games from CSV.`);
    setCsvData([]);
    setCsvErrors([]);
    setView("list");
  };

  // Quick Add Form state
  const [form, setForm] = useState({ ...emptyForm });

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingGameId(null);
  };

  const handleSaveGame = async () => {
    // Validate required fields
    if (!form.name.trim() || !form.city.trim() || !form.state.trim()) {
      showToast("Name, City, and State are required.", "error");
      return;
    }

    // Auto-geocode the address
    const addressToGeocode = form.address || `${form.venueName}, ${form.city}, ${form.state}`;
    const geopoint = await geocodeAddress(addressToGeocode);

    if (editingGameId) {
      // Update existing game
      setGames((prev) =>
        prev.map((g) =>
          g.id === editingGameId
            ? {
                ...g,
                name: form.name,
                organizerName: form.organizerName,
                type: form.type,
                gameStyle: form.gameStyle,
                city: form.city,
                state: form.state,
                venueName: form.venueName,
                address: form.address,
                generalArea: form.generalArea,
                geopoint,
                cost: form.cost || "Contact for price",
                contactEmail: form.contactEmail,
                description: form.description,
                skillLevels: form.skillLevels,
                dropInFriendly: form.dropInFriendly,
                setsProvided: form.setsProvided,
                isRecurring: true,
                recurringSchedule: {
                  dayOfWeek: form.dayOfWeek,
                  startTime: form.startTime,
                  endTime: form.endTime,
                  frequency: "weekly",
                },
                updatedAt: new Date().toISOString(),
              }
            : g
        )
      );
      // Save to Firestore
      adminFetch("/api/listings", "PUT", {
        id: editingGameId,
        name: form.name,
        organizerName: form.organizerName,
        type: form.type,
        gameStyle: form.gameStyle,
        city: form.city,
        state: form.state,
        venueName: form.venueName,
        address: form.address,
        generalArea: form.generalArea,
        geopoint,
        cost: form.cost || "Contact for price",
        contactEmail: form.contactEmail,
        description: form.description,
        skillLevels: form.skillLevels,
        dropInFriendly: form.dropInFriendly,
        setsProvided: form.setsProvided,
        isRecurring: true,
        recurringSchedule: { dayOfWeek: form.dayOfWeek, startTime: form.startTime, endTime: form.endTime, frequency: "weekly" },
      }).catch(() => {});
      showToast(`"${form.name}" has been updated.`);
    } else {
      // Create new game
      const newGame: Game = {
        id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        name: form.name,
        organizerName: form.organizerName,
        organizerId: null,
        type: form.type,
        gameStyle: form.gameStyle,
        city: form.city,
        state: form.state,
        generalArea: form.generalArea,
        venueName: form.venueName,
        address: form.address,
        geopoint,
        metroRegion: null,
        isRecurring: true,
        recurringSchedule: {
          dayOfWeek: form.dayOfWeek,
          startTime: form.startTime,
          endTime: form.endTime,
          frequency: "weekly",
        },
        eventDate: null,
        eventStartTime: null,
        eventEndTime: null,
        cost: form.cost || "Contact for price",
        costAmount: null,
        contactName: form.organizerName,
        contactEmail: form.contactEmail,
        contactPhone: "",
        website: "",
        instagram: "",
        facebookGroup: "",
        registrationLink: "",
        description: form.description,
        howToJoin: "",
        whatToBring: "",
        skillLevels: form.skillLevels,
        dropInFriendly: form.dropInFriendly,
        setsProvided: form.setsProvided,
        maxPlayers: null,
        typicalGroupSize: "",
        imageUrl: "",
        goingCount: 0,
        beenHereCount: 0,
        headsUpCount: 0,
        status: "active",
        verified: false,
        claimedBy: null,
        source: "manual",
        promoted: false,
        organizerEdited: false,
        lastVerified: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setGames((prev) => [newGame, ...prev]);
      // Save to Firestore
      adminFetch("/api/listings", "POST", newGame).catch(() => {});
      showToast(`"${form.name}" has been created and saved.`);
    }

    resetForm();
    setView("list");
  };

  function handleExportForAudit() {
    const activeGames = games.filter((g) => g.status === "active");
    const items = activeGames.map((g) => {
      const urlsToCheck: { type: string; url: string }[] = [];
      if (g.website) urlsToCheck.push({ type: "website", url: g.website });
      if (g.instagram) {
        const handle = g.instagram.replace(/^@/, "");
        const url = g.instagram.startsWith("http")
          ? g.instagram
          : `https://www.instagram.com/${handle}`;
        urlsToCheck.push({ type: "instagram", url });
      }
      if (g.facebookGroup) urlsToCheck.push({ type: "facebook", url: g.facebookGroup });
      if (g.registrationLink) urlsToCheck.push({ type: "registration", url: g.registrationLink });

      let schedule = "no schedule listed";
      if (g.isRecurring && g.recurringSchedule) {
        schedule = `${g.recurringSchedule.frequency || "weekly"} on ${g.recurringSchedule.dayOfWeek}, ${g.recurringSchedule.startTime || "?"}–${g.recurringSchedule.endTime || "?"}`;
      } else if (g.eventDate) {
        const time = g.eventStartTime ? ` at ${g.eventStartTime}${g.eventEndTime ? "–" + g.eventEndTime : ""}` : "";
        schedule = `${g.eventDate}${time}`;
      }

      return {
        id: g.id,
        name: g.name,
        organizer: g.organizerName,
        type: g.type,
        gameStyle: g.gameStyle,
        city: g.city,
        state: g.state,
        venue: g.venueName,
        address: g.address,
        schedule,
        isRecurring: g.isRecurring,
        eventDate: g.eventDate,
        contactName: g.contactName,
        contactEmail: g.contactEmail,
        contactPhone: g.contactPhone,
        urlsToCheck,
        hasNoUrls: urlsToCheck.length === 0,
        verified: g.verified,
        source: g.source,
        description: g.description,
        audit: {
          status: "",
          notes: "",
          correctedFields: {},
          checkedAt: "",
        },
      };
    });

    // Sort: no URLs first, then by state/city
    items.sort((a, b) => {
      if (a.hasNoUrls !== b.hasNoUrls) return a.hasNoUrls ? -1 : 1;
      if (a.state !== b.state) return a.state.localeCompare(b.state);
      return a.city.localeCompare(b.city);
    });

    const output = {
      exportedAt: new Date().toISOString(),
      totalActive: items.length,
      totalWithUrls: items.filter((v) => !v.hasNoUrls).length,
      totalWithoutUrls: items.filter((v) => v.hasNoUrls).length,
      instructions: {
        purpose:
          "Verify each listing is a real, currently-active mahjong event by visiting the URLs and confirming the event details match what we have on file.",
        steps: [
          "For each listing, visit every URL in urlsToCheck.",
          "Confirm the event exists, is still active/scheduled, and the details (venue, schedule, contact) match our listing.",
          "Set audit.status to one of: verified, cannot_verify, dead_link, event_ended, info_mismatch, suspicious.",
          "If info doesn't match, put the correct values in audit.correctedFields (e.g. { \"address\": \"new address\" }).",
          "Add any notes in audit.notes.",
          "Set audit.checkedAt to the current date.",
          "For listings with hasNoUrls=true, try searching Google for the organizer name + city.",
        ],
        auditStatuses: {
          verified: "Event confirmed active, details match",
          cannot_verify: "No working URL found, couldn't confirm via search either",
          dead_link: "URL(s) are broken / 404 / domain expired",
          event_ended: "Event existed but is no longer running",
          info_mismatch: "Event exists but our details are wrong — see correctedFields",
          suspicious: "Listing looks fake, duplicated, or is not actually a mahjong event",
        },
      },
      listings: items,
    };

    const blob = new Blob([JSON.stringify(output, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `verification-audit-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${items.length} active listings for audit.`);
  }

  const handleVerifyToggle = (gameId: string) => {
    const game = games.find((g) => g.id === gameId);
    if (!game) return;
    const newVerified = !game.verified;
    setGames((prev) =>
      prev.map((g) =>
        g.id === gameId
          ? {
              ...g,
              verified: newVerified,
              lastVerified: newVerified ? new Date().toISOString() : g.lastVerified,
            }
          : g
      )
    );
    showToast(
      newVerified
        ? `"${game.name}" has been verified.`
        : `"${game.name}" has been unverified.`,
      newVerified ? "success" : "info"
    );
  };

  const handleDelete = async (gameId: string) => {
    const game = games.find((g) => g.id === gameId);
    if (!game) return;
    if (!window.confirm(`Are you sure you want to delete "${game.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await adminFetch(`/api/listings?id=${gameId}`, "DELETE");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "Failed to delete listing.", "error");
        return;
      }
      setGames((prev) => prev.filter((g) => g.id !== gameId));
      setExpandedGameId(null);
      showToast(`"${game.name}" has been deleted.`, "info");
    } catch {
      showToast("Failed to delete listing. Please try again.", "error");
    }
  };

  const handleEditGame = (gameId: string) => {
    const game = games.find((g) => g.id === gameId);
    if (!game) return;
    setForm({
      name: game.name,
      organizerName: game.organizerName,
      type: game.type,
      gameStyle: game.gameStyle,
      city: game.city,
      state: game.state,
      venueName: game.venueName,
      address: game.address,
      generalArea: game.generalArea,
      dayOfWeek: game.recurringSchedule?.dayOfWeek || "monday",
      startTime: game.recurringSchedule?.startTime || "18:00",
      endTime: game.recurringSchedule?.endTime || "20:00",
      cost: game.cost,
      contactEmail: game.contactEmail,
      description: game.description,
      skillLevels: game.skillLevels,
      dropInFriendly: game.dropInFriendly,
      setsProvided: game.setsProvided,
    });
    setEditingGameId(gameId);
    setView("add");
  };

  const handleToggleExpand = (gameId: string) => {
    setExpandedGameId((prev) => (prev === gameId ? null : gameId));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-hotpink-50 border-hotpink-200 text-hotpink-700"
              : toast.type === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-skyblue-50 border-skyblue-200 text-skyblue-700"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : toast.type === "error" ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          {toast.message}
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-current opacity-50 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-[family-name:var(--font-heading)] font-bold text-xl sm:text-2xl text-charcoal">
          Game Management
        </h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleExportForAudit()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-skyblue-100 transition-colors"
          >
            <Download className="w-4 h-4" /> Export for Audit
          </button>
          <button
            onClick={() => { resetForm(); setView("csv"); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === "csv" ? "bg-hotpink-500 text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-skyblue-100"
            }`}
          >
            <Upload className="w-4 h-4" /> CSV Upload
          </button>
          <button
            onClick={() => { resetForm(); setView("bulk"); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === "bulk" ? "bg-hotpink-500 text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-skyblue-100"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Paste JSON
          </button>
          <button
            onClick={() => { resetForm(); setView("add"); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              view === "add" ? "bg-hotpink-500 text-white" : "bg-hotpink-500 text-white hover:bg-hotpink-600"
            }`}
          >
            <Plus className="w-4 h-4" /> Quick Add
          </button>
        </div>
      </div>

      {/* CSV Upload View */}
      {view === "csv" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-lg text-charcoal mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-hotpink-500" />
            CSV Bulk Upload
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Upload a CSV file to bulk import game listings. Required columns: name, city, state.
            Skill levels should be pipe-separated (e.g., &quot;beginner|intermediate&quot;).
          </p>

          {/* Download Template */}
          <button
            onClick={() => {
              const template = "name,type,gameStyle,city,state,generalArea,venueName,address,isRecurring,dayOfWeek,startTime,endTime,frequency,cost,contactName,contactEmail,website,instagram,description,howToJoin,whatToBring,skillLevels,dropInFriendly,setsProvided,typicalGroupSize\n";
              const blob = new Blob([template], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "mahjnearme-template.csv";
              a.click();
            }}
            className="flex items-center gap-2 text-sm text-hotpink-500 hover:text-hotpink-600 font-medium mb-4"
          >
            <Download className="w-4 h-4" /> Download CSV Template
          </button>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-skyblue-300 rounded-xl p-8 text-center cursor-pointer hover:border-hotpink-400 transition-colors"
          >
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600 font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-slate-400 mt-1">CSV files only</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCsvUpload}
            />
          </div>

          {/* CSV Preview */}
          {csvData.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-charcoal">
                  Preview ({csvData.length} rows)
                </h3>
                <button onClick={() => { setCsvData([]); setCsvErrors([]); }} className="text-sm text-red-500 hover:text-red-600">
                  Clear
                </button>
              </div>

              {csvErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-red-700 mb-2">
                    <AlertTriangle className="w-4 h-4" /> {csvErrors.length} validation {csvErrors.length === 1 ? "error" : "errors"}
                  </div>
                  <ul className="text-xs text-red-600 space-y-1">
                    {csvErrors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {csvErrors.length > 5 && <li>...and {csvErrors.length - 5} more</li>}
                  </ul>
                </div>
              )}

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-skyblue-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">City</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">State</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Type</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Day</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {csvData.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-skyblue-100">
                        <td className="px-3 py-2">{row.name || "-"}</td>
                        <td className="px-3 py-2">{row.city || "-"}</td>
                        <td className="px-3 py-2">{row.state || "-"}</td>
                        <td className="px-3 py-2">{row.type || "-"}</td>
                        <td className="px-3 py-2">{row.dayOfWeek || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleCsvImport}
                disabled={csvErrors.length > 0}
                className="mt-4 bg-hotpink-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import {csvData.length} Games
              </button>
            </div>
          )}

          <button onClick={() => setView("list")} className="mt-4 text-sm text-slate-500 hover:text-slate-700 font-medium">
            Back to List
          </button>
        </div>
      )}

      {/* Bulk Paste JSON View */}
      {view === "bulk" && <BulkPasteView onImported={(count) => { showToast(`${count} events saved to Firestore.`); setView("list"); }} />}

      {/* Quick Add / Edit Form */}
      {view === "add" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-lg text-charcoal mb-4">
            {editingGameId ? "Edit Game" : "Quick Add Game"}
          </h2>
          {/* Organizer autofill */}
          {!editingGameId && organizers.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-600 mb-1">Select Organizer (auto-fills contact info)</label>
              <select
                onChange={(e) => {
                  const org = organizers.find((o) => o.id === e.target.value);
                  if (org) {
                    setForm({
                      ...form,
                      organizerName: org.name,
                      contactEmail: org.email,
                      city: org.city || form.city,
                      state: org.state || form.state,
                    });
                  }
                }}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                defaultValue=""
              >
                <option value="">-- Choose an organizer or type manually below --</option>
                {organizers.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}{org.city ? ` (${org.city})` : ""}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Organizer *</label>
              <input type="text" value={form.organizerName} onChange={(e) => setForm({...form, organizerName: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">City *</label>
              <input type="text" value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">State *</label>
              <input type="text" value={form.state} onChange={(e) => setForm({...form, state: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Venue Name</label>
              <input type="text" value={form.venueName} onChange={(e) => setForm({...form, venueName: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
              <input type="text" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value as GameType})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                {Object.entries(GAME_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Game Style</label>
              <select value={form.gameStyle} onChange={(e) => setForm({...form, gameStyle: e.target.value as GameStyle})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                {Object.entries(GAME_STYLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Day</label>
              <select value={form.dayOfWeek} onChange={(e) => setForm({...form, dayOfWeek: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                {DAYS_OF_WEEK.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Cost</label>
              <input type="text" value={form.cost} onChange={(e) => setForm({...form, cost: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g., $15 or Free" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Contact Email</label>
              <input type="email" value={form.contactEmail} onChange={(e) => setForm({...form, contactEmail: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Time</label>
              <div className="flex gap-2">
                <input type="time" value={form.startTime} onChange={(e) => setForm({...form, startTime: e.target.value})} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                <input type="time" value={form.endTime} onChange={(e) => setForm({...form, endTime: e.target.value})} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSaveGame}
              className="bg-hotpink-500 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors"
            >
              {editingGameId ? "Update Game" : "Save Game"}
            </button>
            <button onClick={() => { resetForm(); setView("list"); }} className="text-sm text-slate-500 hover:text-slate-700 font-medium">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Game List */}
      {view === "list" && (
        <>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-skyblue-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Game</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Verified</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGames.map((game) => {
                  const verification = getVerificationStatus(game.verified);
                  const isExpanded = expandedGameId === game.id;
                  return (
                    <tr key={game.id} className="hover:bg-skyblue-100 group">
                      <td className="px-4 py-3" colSpan={isExpanded ? 6 : undefined}>
                        {isExpanded ? (
                          /* Expanded detail view */
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-lg text-charcoal">{game.name}</p>
                                <p className="text-sm text-slate-500">by {game.organizerName}</p>
                              </div>
                              <button
                                onClick={() => setExpandedGameId(null)}
                                className="p-1.5 hover:bg-slate-100 rounded"
                              >
                                <X className="w-4 h-4 text-slate-400" />
                              </button>
                            </div>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-xs font-medium text-slate-400 uppercase">Location</span>
                                <p className="text-charcoal">{game.venueName || "No venue"}</p>
                                <p className="text-slate-500">{game.address || `${game.city}, ${game.state}`}</p>
                                {game.generalArea && <p className="text-slate-400">{game.generalArea}</p>}
                              </div>
                              <div>
                                <span className="text-xs font-medium text-slate-400 uppercase">Schedule</span>
                                <p className="text-charcoal">{formatSchedule(game)}</p>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-slate-400 uppercase">Cost</span>
                                <p className="text-charcoal">{game.cost}</p>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-slate-400 uppercase">Type / Style</span>
                                <p className="text-charcoal">{getGameTypeLabel(game.type)} / {GAME_STYLE_LABELS[game.gameStyle] || game.gameStyle}</p>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-slate-400 uppercase">Contact</span>
                                <p className="text-charcoal">{game.contactName || "N/A"}</p>
                                <p className="text-slate-500">{game.contactEmail || "N/A"}</p>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-slate-400 uppercase">Features</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {game.dropInFriendly && (
                                    <span className="text-xs bg-skyblue-100 text-skyblue-600 px-2 py-0.5 rounded-full">Drop-in</span>
                                  )}
                                  {game.setsProvided && (
                                    <span className="text-xs bg-skyblue-100 text-skyblue-600 px-2 py-0.5 rounded-full">Sets provided</span>
                                  )}
                                  {game.skillLevels.map((s) => (
                                    <span key={s} className="text-xs bg-hotpink-100 text-hotpink-600 px-2 py-0.5 rounded-full">{s}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            {game.description && (
                              <div>
                                <span className="text-xs font-medium text-slate-400 uppercase">Description</span>
                                <p className="text-sm text-slate-600 mt-1">{game.description}</p>
                              </div>
                            )}
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                game.status === "active" ? "bg-hotpink-200 text-hotpink-600" :
                                game.status === "pending" ? "bg-skyblue-100 text-skyblue-600" :
                                "bg-white text-slate-500"
                              }`}>
                                {game.status}
                              </span>
                              <span className={`text-xs font-medium ${verification.color}`}>
                                {verification.label}
                              </span>
                              <span className="text-xs text-slate-400">Source: {game.source}</span>
                              <div className="ml-auto flex gap-1">
                                <button
                                  onClick={() => handleEditGame(game.id)}
                                  className="flex items-center gap-1 bg-skyblue-100 hover:bg-skyblue-200 rounded-lg px-3 py-1.5 text-xs font-medium text-skyblue-700 transition-colors"
                                >
                                  <Edit className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button
                                  onClick={() => handleVerifyToggle(game.id)}
                                  className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                    game.verified
                                      ? "bg-red-50 hover:bg-red-100 border border-red-200 text-red-600"
                                      : "bg-skyblue-100 hover:bg-hotpink-200 border border-hotpink-200 text-hotpink-600"
                                  }`}
                                >
                                  {game.verified ? <><XCircle className="w-3.5 h-3.5" /> Unverify</> : <><CheckCircle className="w-3.5 h-3.5" /> Verify</>}
                                </button>
                                <button
                                  onClick={() => handleDelete(game.id)}
                                  className="flex items-center gap-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="font-medium text-charcoal">{game.name}</p>
                            <p className="text-xs text-slate-500">{game.organizerName}</p>
                          </>
                        )}
                      </td>
                      {!isExpanded && (
                        <>
                          <td className="px-4 py-3 text-slate-600">{game.city}, {game.state}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium">{getGameTypeLabel(game.type)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              game.status === "active" ? "bg-hotpink-200 text-hotpink-600" :
                              game.status === "pending" ? "bg-skyblue-100 text-skyblue-600" :
                              "bg-white text-slate-500"
                            }`}>
                              {game.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium ${verification.color}`}>
                              {verification.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleToggleExpand(game.id)}
                                className="p-1.5 hover:bg-skyblue-100 rounded"
                                title="View"
                              >
                                <Eye className="w-4 h-4 text-slate-500" />
                              </button>
                              <button
                                onClick={() => handleEditGame(game.id)}
                                className="p-1.5 hover:bg-skyblue-100 rounded"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4 text-slate-500" />
                              </button>
                              <button
                                onClick={() => handleVerifyToggle(game.id)}
                                className="p-1.5 hover:bg-skyblue-100 rounded"
                                title={game.verified ? "Unverify" : "Verify"}
                              >
                                <CheckCircle className={`w-4 h-4 ${game.verified ? "text-hotpink-500" : "text-slate-400"}`} />
                              </button>
                              <button
                                onClick={() => handleDelete(game.id)}
                                className="p-1.5 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
                {filteredGames.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      No games found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Bulk Paste JSON view.
 * Paste JSON from Claude (extracted from screenshots/flyers) and import all at once.
 */
function BulkPasteView({ onImported }: { onImported: (count: number) => void }) {
  const [jsonText, setJsonText] = useState("");
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<Record<string, unknown>[] | null>(null);
  const [error, setError] = useState("");

  function handlePreview() {
    setError("");
    setPreview(null);
    try {
      const parsed = JSON.parse(jsonText);
      const items = Array.isArray(parsed) ? parsed : parsed.listings || parsed.events || parsed.games || [parsed];
      if (!Array.isArray(items) || items.length === 0) {
        setError("Could not find events in the JSON. Expected an array or an object with a listings/events/games array.");
        return;
      }
      setPreview(items);
    } catch {
      setError("Invalid JSON. Make sure Claude gave you valid JSON output.");
    }
  }

  async function handleImport() {
    if (!preview) return;
    setImporting(true);
    setError("");

    try {
      const res = await adminFetch("/api/listings/import", "POST", { listings: preview });
      const result = await res.json();
      if (result.success) {
        onImported(result.added + result.updated);
      } else {
        setError(result.error || "Import failed");
      }
    } catch {
      setError("Import failed.");
    }
    setImporting(false);
  }

  const exampleJson = `[
  {
    "id": "unique-event-id",
    "name": "Tuesday Night Mahjong",
    "type": "open_play",
    "gameStyle": "american",
    "city": "Dallas",
    "state": "TX",
    "venueName": "The Mahj Spot",
    "address": "123 Main St, Dallas, TX 75201",
    "contactName": "Jane Smith",
    "contactEmail": "jane@example.com",
    "instagram": "@janesmith",
    "isRecurring": true,
    "dayOfWeek": "tuesday",
    "startTime": "18:00",
    "endTime": "20:00",
    "frequency": "weekly",
    "cost": "$5",
    "skillLevels": "beginner|intermediate",
    "description": "Friendly open play for all levels"
  }
]`;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-charcoal mb-1">Bulk Paste Events</h2>
        <p className="text-sm text-slate-500">
          Paste JSON from Claude (extracted from screenshots, flyers, or Instagram posts) and import all events at once. Existing events with the same ID will be updated. Events edited by organizers will not be overwritten.
        </p>
      </div>

      <textarea
        value={jsonText}
        onChange={(e) => { setJsonText(e.target.value); setPreview(null); }}
        placeholder="Paste JSON here..."
        className="w-full h-64 p-3 border border-slate-200 rounded-lg text-sm font-mono resize-none focus:border-hotpink-400 focus:outline-none"
      />

      <div className="flex gap-2">
        <button
          onClick={handlePreview}
          disabled={!jsonText.trim()}
          className="bg-skyblue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-skyblue-600 disabled:opacity-50"
        >
          Preview
        </button>
        {preview && (
          <button
            onClick={handleImport}
            disabled={importing}
            className="bg-hotpink-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-hotpink-600 disabled:opacity-50 flex items-center gap-2"
          >
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Import {preview.length} Event{preview.length !== 1 ? "s" : ""} to Firestore
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}

      {preview && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
            <p className="text-sm font-medium text-slate-700">{preview.length} event{preview.length !== 1 ? "s" : ""} found</p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {preview.map((item, i) => (
              <div key={i} className="px-3 py-2 border-b border-slate-100 last:border-0 text-sm">
                <p className="font-medium text-slate-800">{(item.name as string) || "Untitled"}</p>
                <p className="text-xs text-slate-500">
                  {(item.city as string) || ""}{(item.state as string) ? `, ${item.state}` : ""} {(item.venueName as string) ? `at ${item.venueName}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <details className="text-xs text-slate-400">
        <summary className="cursor-pointer hover:text-slate-600">Example JSON format (tell Claude to use this)</summary>
        <pre className="mt-2 p-3 bg-slate-50 rounded-lg overflow-x-auto text-[11px]">{exampleJson}</pre>
      </details>
    </div>
  );
}
