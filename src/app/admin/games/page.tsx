"use client";

import { useState, useRef } from "react";
import { mockGames } from "@/lib/mock-data";
import { GAME_TYPE_LABELS, GAME_STYLE_LABELS, SKILL_LEVEL_LABELS, DAYS_OF_WEEK } from "@/lib/constants";
import { getVerificationStatus, getGameTypeLabel } from "@/lib/utils";
import { GameType, GameStyle, SkillLevel, Game } from "@/types";
import {
  Plus,
  Upload,
  Search,
  CheckCircle,
  XCircle,
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

type View = "list" | "add" | "csv";

export default function AdminGamesPage() {
  const [view, setView] = useState<View>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredGames = mockGames.filter((game) => {
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

  const handleCsvImport = () => {
    // In production, this would create Firestore documents
    alert(`Would import ${csvData.length} games to Firestore`);
    setCsvData([]);
    setView("list");
  };

  // Quick Add Form state
  const [form, setForm] = useState({
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
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-slate-900">
          Game Management
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => setView("csv")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === "csv" ? "bg-jade-600 text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Upload className="w-4 h-4" /> CSV Upload
          </button>
          <button
            onClick={() => setView("add")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              view === "add" ? "bg-jade-600 text-white" : "bg-jade-600 text-white hover:bg-jade-700"
            }`}
          >
            <Plus className="w-4 h-4" /> Quick Add
          </button>
        </div>
      </div>

      {/* CSV Upload View */}
      {view === "csv" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-lg text-slate-800 mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-jade-600" />
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
            className="flex items-center gap-2 text-sm text-jade-600 hover:text-jade-700 font-medium mb-4"
          >
            <Download className="w-4 h-4" /> Download CSV Template
          </button>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-jade-400 transition-colors"
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
                <h3 className="font-semibold text-slate-800">
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
                  <thead className="bg-slate-50">
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
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-2">{row.name || "—"}</td>
                        <td className="px-3 py-2">{row.city || "—"}</td>
                        <td className="px-3 py-2">{row.state || "—"}</td>
                        <td className="px-3 py-2">{row.type || "—"}</td>
                        <td className="px-3 py-2">{row.dayOfWeek || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleCsvImport}
                disabled={csvErrors.length > 0}
                className="mt-4 bg-jade-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-jade-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Quick Add Form */}
      {view === "add" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-lg text-slate-800 mb-4">Quick Add Game</h2>
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
            <button className="bg-jade-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-jade-700 transition-colors">
              Save Game
            </button>
            <button onClick={() => setView("list")} className="text-sm text-slate-500 hover:text-slate-700 font-medium">
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
              <thead className="bg-slate-50 border-b border-slate-200">
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
                  const verification = getVerificationStatus(game.lastVerified);
                  return (
                    <tr key={game.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{game.name}</p>
                        <p className="text-xs text-slate-500">{game.organizerName}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{game.city}, {game.state}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium">{getGameTypeLabel(game.type)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          game.status === "active" ? "bg-green-100 text-green-700" :
                          game.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-700"
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
                          <button className="p-1.5 hover:bg-slate-100 rounded" title="View">
                            <Eye className="w-4 h-4 text-slate-500" />
                          </button>
                          <button className="p-1.5 hover:bg-slate-100 rounded" title="Edit">
                            <Edit className="w-4 h-4 text-slate-500" />
                          </button>
                          <button className="p-1.5 hover:bg-green-50 rounded" title="Verify">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </button>
                          <button className="p-1.5 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
