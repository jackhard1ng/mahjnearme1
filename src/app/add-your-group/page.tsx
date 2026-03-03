"use client";

import { useState, FormEvent } from "react";
import { GameType, GameStyle, SkillLevel, Frequency } from "@/types";
import { GAME_TYPE_LABELS, GAME_STYLE_LABELS, SKILL_LEVEL_LABELS, DAYS_OF_WEEK } from "@/lib/constants";
import { CheckCircle, Send, MapPin, Clock, Users, Info, ArrowLeft, ArrowRight } from "lucide-react";

export default function AddYourGroupPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
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
    isRecurring: true,
    dayOfWeek: "monday",
    startTime: "18:00",
    endTime: "20:00",
    frequency: "weekly" as Frequency,
    cost: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    instagram: "",
    facebookGroup: "",
    description: "",
    howToJoin: "",
    whatToBring: "",
    skillLevels: [] as SkillLevel[],
    dropInFriendly: true,
    setsProvided: true,
    typicalGroupSize: "",
  });

  const updateField = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSkillLevel = (level: SkillLevel) => {
    setForm((prev) => ({
      ...prev,
      skillLevels: prev.skillLevels.includes(level)
        ? prev.skillLevels.filter((l) => l !== level)
        : [...prev.skillLevels, level],
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // In production, submit to Firestore pending queue
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-slate-900 mb-3">
          Submission Received!
        </h1>
        <p className="text-slate-500 mb-6">
          Thank you for listing your group on MahjNearMe. We&apos;ll review your submission and have it live within 24-48 hours.
          You&apos;ll receive an email when your listing is approved.
        </p>
        <p className="text-sm text-slate-400 mb-8">
          Want to manage your listing? Create an organizer account to claim it.
        </p>
        <a href="/signup" className="inline-block bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-700 transition-colors">
          Create Organizer Account
        </a>
      </div>
    );
  }

  const totalSteps = 3;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-slate-900 mb-2">
        List Your Mahjong Group
      </h1>
      <p className="text-slate-500 mb-8">
        Submit your group for free to reach mahjong players across the country. We&apos;ll review and publish within 24-48 hours.
      </p>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step > i + 1 ? "bg-teal-600 text-white" : step === i + 1 ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-500"
            }`}>
              {step > i + 1 ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            {i < totalSteps - 1 && (
              <div className={`flex-1 h-1 rounded ${step > i + 1 ? "bg-teal-600" : "bg-slate-200"}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-xl text-slate-800 flex items-center gap-2">
              <Info className="w-5 h-5 text-teal-600" /> Basic Information
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Group/Event Name *</label>
                <input type="text" required value={form.name} onChange={(e) => updateField("name", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g., Tuesday Night Mahj" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Organizer Name *</label>
                <input type="text" required value={form.organizerName} onChange={(e) => updateField("organizerName", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g., Mahj918" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
                <select value={form.type} onChange={(e) => updateField("type", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm">
                  {Object.entries(GAME_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Game Style *</label>
                <select value={form.gameStyle} onChange={(e) => updateField("gameStyle", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm">
                  {Object.entries(GAME_STYLE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Skill Levels (select all that apply) *</label>
              <div className="flex gap-3">
                {(Object.entries(SKILL_LEVEL_LABELS) as [SkillLevel, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => toggleSkillLevel(val)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      form.skillLevels.includes(val) ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <input type="checkbox" id="dropIn" checked={form.dropInFriendly} onChange={(e) => updateField("dropInFriendly", e.target.checked)} className="rounded border-slate-300" />
                <label htmlFor="dropIn" className="text-sm text-slate-700">Drop-in friendly (no RSVP required)</label>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="sets" checked={form.setsProvided} onChange={(e) => updateField("setsProvided", e.target.checked)} className="rounded border-slate-300" />
                <label htmlFor="sets" className="text-sm text-slate-700">Mahjong sets provided</label>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Location & Schedule */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-xl text-slate-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-600" /> Location & Schedule
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Venue Name *</label>
                <input type="text" required value={form.venueName} onChange={(e) => updateField("venueName", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g., McNellie's South City" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">General Area</label>
                <input type="text" value={form.generalArea} onChange={(e) => updateField("generalArea", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g., South Tulsa" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Address *</label>
              <input type="text" required value={form.address} onChange={(e) => updateField("address", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g., 7031 S Zurich Ave, Tulsa, OK 74136" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                <input type="text" required value={form.city} onChange={(e) => updateField("city", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
                <input type="text" required value={form.state} onChange={(e) => updateField("state", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g., OK" />
              </div>
            </div>

            <hr className="border-slate-100" />

            <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" /> Schedule
            </h3>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Day of Week *</label>
                <select value={form.dayOfWeek} onChange={(e) => updateField("dayOfWeek", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm">
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day} value={day}>{day.charAt(0).toUpperCase() + day.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Time *</label>
                <input type="time" required value={form.startTime} onChange={(e) => updateField("startTime", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Time *</label>
                <input type="time" required value={form.endTime} onChange={(e) => updateField("endTime", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Frequency *</label>
              <select value={form.frequency} onChange={(e) => updateField("frequency", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm">
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every other week</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cost</label>
                <input type="text" value={form.cost} onChange={(e) => updateField("cost", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g., $15 or Free" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Typical Group Size</label>
                <input type="text" value={form.typicalGroupSize} onChange={(e) => updateField("typicalGroupSize", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g., 3-5 tables" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Details & Contact */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-xl text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" /> Details & Contact
            </h2>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
              <textarea required rows={3} value={form.description} onChange={(e) => updateField("description", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" placeholder="Tell potential players about your group..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">How to Join</label>
              <input type="text" value={form.howToJoin} onChange={(e) => updateField("howToJoin", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g., Just show up! or RSVP via email" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">What to Bring</label>
              <input type="text" value={form.whatToBring} onChange={(e) => updateField("whatToBring", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g., Bring your NMJL card" />
            </div>

            <hr className="border-slate-100" />

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name *</label>
                <input type="text" required value={form.contactName} onChange={(e) => updateField("contactName", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email *</label>
                <input type="email" required value={form.contactEmail} onChange={(e) => updateField("contactEmail", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input type="tel" value={form.contactPhone} onChange={(e) => updateField("contactPhone", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                <input type="url" value={form.website} onChange={(e) => updateField("website", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" placeholder="https://" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Instagram</label>
                <input type="text" value={form.instagram} onChange={(e) => updateField("instagram", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" placeholder="@handle" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Facebook Group URL</label>
                <input type="url" value={form.facebookGroup} onChange={(e) => updateField("facebookGroup", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
          {step > 1 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button type="button" onClick={() => setStep(step + 1)} className="flex items-center gap-2 bg-teal-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="submit" className="flex items-center gap-2 bg-teal-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors">
              <Send className="w-4 h-4" /> Submit for Review
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
