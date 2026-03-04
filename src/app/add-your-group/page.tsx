"use client";

import { useState, FormEvent } from "react";
import { CheckCircle, Send, MapPin, ArrowRight, Globe, Calendar, Users, Smartphone, Star, MessageCircle } from "lucide-react";

export default function AddYourGroupPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    // Contact info
    name: "",
    email: "",
    phone: "",
    // Group basics
    groupName: "",
    gameStyle: "american",
    eventTypes: [] as string[],
    // Location
    city: "",
    state: "",
    venueName: "",
    address: "",
    // Schedule
    isRecurring: "yes",
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    frequency: "weekly",
    // Details
    cost: "",
    skillLevels: [] as string[],
    dropInFriendly: "yes",
    setsProvided: "no",
    typicalGroupSize: "",
    // Online presence
    website: "",
    instagram: "",
    facebookGroup: "",
    registrationLink: "",
    // Description
    description: "",
    howToJoin: "",
    whatToBring: "",
    anythingElse: "",
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, formType: "group-listing" }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Website inquiry form state
  const [websiteSubmitted, setWebsiteSubmitted] = useState(false);
  const [websiteSubmitting, setWebsiteSubmitting] = useState(false);
  const [websiteError, setWebsiteError] = useState("");
  const [websiteForm, setWebsiteForm] = useState({
    name: "",
    email: "",
    description: "",
  });

  const handleWebsiteSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setWebsiteSubmitting(true);
    setWebsiteError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: websiteForm.name,
          email: websiteForm.email,
          description: websiteForm.description,
          formType: "website-inquiry",
        }),
      });
      if (!res.ok) throw new Error();
      setWebsiteSubmitted(true);
    } catch {
      setWebsiteError("Something went wrong. Please try again.");
    } finally {
      setWebsiteSubmitting(false);
    }
  };

  return (
    <>
      {/* Part 1: List Your Group */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/8f52f44ed05054e40828936a96d15b75.jpg" alt="" className="w-full h-full object-cover opacity-[0.08]" loading="lazy" />
          <div className="absolute inset-0 bg-[#FFF0F5]/92" />
        </div>

        <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20 relative">
          <div className="text-center mb-10">
            <div className="flex justify-center gap-2 mb-4">
              <span className="text-2xl opacity-60">🀇</span>
              <span className="text-2xl opacity-60">🀄</span>
              <span className="text-2xl opacity-60">🀙</span>
            </div>
            <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-3xl sm:text-4xl text-charcoal mb-3">
              Don&apos;t see your group?
            </h1>
            <p className="text-lg text-hotpink-500 font-semibold mb-2">Let us know — we&apos;ll add it for free.</p>
            <p className="text-slate-500 max-w-xl mx-auto">
              We&apos;re building the most complete directory of mahjong games in the country. If your group isn&apos;t listed yet, tell us about it and we&apos;ll have it up within 48 hours.
            </p>
          </div>

          {submitted ? (
            <div className="mahj-tile p-10 text-center">
              <div className="w-16 h-16 bg-hotpink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-hotpink-500" />
              </div>
              <h2 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-3">
                Message sent!
              </h2>
              <p className="text-slate-500">
                We&apos;ll add your group within 48 hours. You&apos;ll receive a confirmation email once your listing is live.
              </p>
            </div>
          ) : (
            <div className="mahj-tile p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Section 1: Contact Info */}
                <fieldset>
                  <legend className="font-semibold text-charcoal mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-hotpink-500" /> Your Contact Info
                  </legend>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Your Name *</label>
                      <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g., Susan K." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                      <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm" placeholder="susan@example.com" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone <span className="text-slate-400">(optional)</span></label>
                    <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm" placeholder="(555) 123-4567" />
                  </div>
                </fieldset>

                <hr className="border-skyblue-200" />

                {/* Section 2: Group Basics */}
                <fieldset>
                  <legend className="font-semibold text-charcoal mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-hotpink-500" /> Group Details
                  </legend>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Group / Event Name *</label>
                      <input type="text" required value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g., Tuesday Night Mahj, Tulsa Tiles Club" />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mahjong Style *</label>
                        <select value={form.gameStyle} onChange={(e) => setForm({ ...form, gameStyle: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm bg-white">
                          <option value="american">American (NMJL)</option>
                          <option value="chinese">Chinese</option>
                          <option value="riichi">Riichi (Japanese)</option>
                          <option value="other">Other / Multiple</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Typical Group Size</label>
                        <input type="text" value={form.typicalGroupSize} onChange={(e) => setForm({ ...form, typicalGroupSize: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g., 8-16 players" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">What do you offer? *</label>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { value: "open_play", label: "Open Play" },
                          { value: "lesson", label: "Lessons" },
                          { value: "league", label: "League" },
                          { value: "event", label: "Tournaments / Events" },
                          { value: "private", label: "Private Parties" },
                        ].map(({ value, label }) => (
                          <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.eventTypes.includes(value)}
                              onChange={(e) => {
                                const types = e.target.checked
                                  ? [...form.eventTypes, value]
                                  : form.eventTypes.filter((t) => t !== value);
                                setForm({ ...form, eventTypes: types });
                              }}
                              className="rounded border-skyblue-300 text-hotpink-500 focus:ring-hotpink-400"
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Skill Levels Welcome</label>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { value: "beginner", label: "Beginners" },
                          { value: "intermediate", label: "Intermediate" },
                          { value: "advanced", label: "Advanced" },
                        ].map(({ value, label }) => (
                          <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.skillLevels.includes(value)}
                              onChange={(e) => {
                                const levels = e.target.checked
                                  ? [...form.skillLevels, value]
                                  : form.skillLevels.filter((l) => l !== value);
                                setForm({ ...form, skillLevels: levels });
                              }}
                              className="rounded border-skyblue-300 text-hotpink-500 focus:ring-hotpink-400"
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Drop-in friendly?</label>
                        <select value={form.dropInFriendly} onChange={(e) => setForm({ ...form, dropInFriendly: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm bg-white">
                          <option value="yes">Yes — newcomers can just show up</option>
                          <option value="no">No — RSVP or registration required</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Do you provide mahjong sets?</label>
                        <select value={form.setsProvided} onChange={(e) => setForm({ ...form, setsProvided: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm bg-white">
                          <option value="yes">Yes</option>
                          <option value="no">No — players bring their own</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </fieldset>

                <hr className="border-skyblue-200" />

                {/* Section 3: Location */}
                <fieldset>
                  <legend className="font-semibold text-charcoal mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-hotpink-500" /> Location
                  </legend>
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                        <input type="text" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g., Tulsa" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
                        <input type="text" required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g., OK" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Venue Name <span className="text-slate-400">(if applicable)</span></label>
                      <input type="text" value={form.venueName} onChange={(e) => setForm({ ...form, venueName: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g., Community Center, Coffee Shop, Private Home" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Address <span className="text-slate-400">(optional — we can use city/state if private)</span></label>
                      <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g., 123 Main St, Tulsa, OK 74103" />
                    </div>
                  </div>
                </fieldset>

                <hr className="border-skyblue-200" />

                {/* Section 4: Schedule */}
                <fieldset>
                  <legend className="font-semibold text-charcoal mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-hotpink-500" /> Schedule
                  </legend>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Is this a recurring event?</label>
                      <select value={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm bg-white">
                        <option value="yes">Yes — happens regularly</option>
                        <option value="no">No — one-time or occasional event</option>
                      </select>
                    </div>
                    {form.isRecurring === "yes" && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Day of the Week</label>
                          <select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm bg-white">
                            <option value="">Select a day</option>
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
                          <label className="block text-sm font-medium text-slate-700 mb-1">How often?</label>
                          <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm bg-white">
                            <option value="weekly">Every week</option>
                            <option value="biweekly">Every other week</option>
                            <option value="monthly">Once a month</option>
                            <option value="other">Other / varies</option>
                          </select>
                        </div>
                      </div>
                    )}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                        <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                        <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cost</label>
                      <input type="text" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g., Free, $10 per session, $25/month" />
                    </div>
                  </div>
                </fieldset>

                <hr className="border-skyblue-200" />

                {/* Section 5: Where to Find You */}
                <fieldset>
                  <legend className="font-semibold text-charcoal mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-hotpink-500" /> Where Can People Find You?
                  </legend>
                  <p className="text-xs text-slate-500 mb-3">Share any links so players can learn more about your group.</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                      <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm" placeholder="https://yourgroup.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Instagram</label>
                      <input type="text" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm" placeholder="@yourgroup" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Facebook Group</label>
                      <input type="text" value={form.facebookGroup} onChange={(e) => setForm({ ...form, facebookGroup: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm" placeholder="Facebook group name or URL" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Registration / Sign-up Link</label>
                      <input type="url" value={form.registrationLink} onChange={(e) => setForm({ ...form, registrationLink: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm" placeholder="Link where players sign up or RSVP" />
                    </div>
                  </div>
                </fieldset>

                <hr className="border-skyblue-200" />

                {/* Section 6: Description */}
                <fieldset>
                  <legend className="font-semibold text-charcoal mb-3 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-hotpink-500" /> Tell Us More
                  </legend>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Describe your group / event *</label>
                      <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm" placeholder="What makes your group special? What can new players expect?" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">How do new players join?</label>
                      <input type="text" value={form.howToJoin} onChange={(e) => setForm({ ...form, howToJoin: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g., Just show up! / DM us on Instagram / Register online" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">What should players bring?</label>
                      <input type="text" value={form.whatToBring} onChange={(e) => setForm({ ...form, whatToBring: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g., NMJL card, your own set, just yourself!" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Anything else we should know?</label>
                      <textarea rows={2} value={form.anythingElse} onChange={(e) => setForm({ ...form, anythingElse: e.target.value })} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm" placeholder="Multiple locations, seasonal schedules, special upcoming events, etc." />
                    </div>
                  </div>
                </fieldset>

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-hotpink-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors disabled:opacity-50 w-full justify-center sm:w-auto"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Sending..." : "Submit Your Group"}
                </button>

                <p className="text-xs text-slate-400 text-center">
                  We&apos;ll review your submission and add it within 48 hours. We may reach out if we have questions.
                </p>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* Divider */}
      <div className="mahj-divider py-8 bg-white">
        <span className="text-2xl">🀄</span>
      </div>

      {/* Part 2: Mahj918 Case Study */}
      <section className="py-16 sm:py-20 section-blue">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-[family-name:var(--font-heading)] font-extrabold text-3xl sm:text-4xl text-charcoal mb-3">
              Want your own website like this?
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              We built Mahj918 — a custom website for one of Tulsa&apos;s biggest mahjong communities. Here&apos;s what we created.
            </p>
          </div>

          {/* Case Study Card */}
          <div className="mahj-tile overflow-hidden">
            {/* Screenshot / Hero */}
            <div className="bg-gradient-to-br from-hotpink-500 via-hotpink-400 to-skyblue-400 p-8 sm:p-12">
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-2xl mx-auto">
                <div className="bg-slate-100 px-4 py-2 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-slate-400 text-center">
                    mahj918.com
                  </div>
                </div>
                <div className="p-6 sm:p-8 text-center">
                  <div className="flex justify-center gap-2 mb-3">
                    <span className="text-xl">🀇</span>
                    <span className="text-xl">🀄</span>
                    <span className="text-xl">🀙</span>
                  </div>
                  <h3 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-2">
                    Mahj918
                  </h3>
                  <p className="text-slate-500 text-sm mb-4">
                    Tulsa&apos;s home for American Mahjong
                  </p>
                  <div className="flex justify-center gap-3">
                    <span className="bg-hotpink-100 text-hotpink-600 px-3 py-1 rounded-full text-xs font-medium">Open Play</span>
                    <span className="bg-skyblue-100 text-skyblue-600 px-3 py-1 rounded-full text-xs font-medium">Lessons</span>
                    <span className="bg-softpink-100 text-hotpink-500 px-3 py-1 rounded-full text-xs font-medium">Events</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="p-8 sm:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-hotpink-100 rounded-xl flex items-center justify-center">
                  <Globe className="w-5 h-5 text-hotpink-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-charcoal">Mahj918</h3>
                  <a href="https://mahj918.com" target="_blank" rel="noopener noreferrer" className="text-sm text-hotpink-500 hover:text-hotpink-600 font-medium">
                    Visit mahj918.com <ArrowRight className="w-3 h-3 inline" />
                  </a>
                </div>
              </div>

              <p className="text-slate-600 mb-8 leading-relaxed">
                Mahj918 needed a professional online presence for their growing mahjong community in Tulsa, Oklahoma. We designed and built a fully custom website that serves as their digital hub — handling everything from event schedules to new player onboarding.
              </p>

              {/* Features Grid */}
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {[
                  { icon: Calendar, title: "Event Calendar", desc: "Interactive schedule with upcoming games, lessons, and special events" },
                  { icon: MapPin, title: "Venue & Directions", desc: "Maps, parking info, and everything players need to find the game" },
                  { icon: Users, title: "New Player Onboarding", desc: "Welcome page with FAQs, what to bring, and how to get started" },
                  { icon: Smartphone, title: "Mobile-First Design", desc: "Beautiful on every device — designed for players on the go" },
                  { icon: Star, title: "Custom Branding", desc: "Unique design that reflects the personality of the group" },
                  { icon: MessageCircle, title: "Contact & RSVP", desc: "Easy ways for players to reach out and sign up for events" },
                ].map((feature) => (
                  <div key={feature.title} className="flex items-start gap-3 bg-skyblue-50 rounded-xl p-4">
                    <feature.icon className="w-5 h-5 text-hotpink-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-charcoal">{feature.title}</p>
                      <p className="text-xs text-slate-500">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="bg-gradient-to-br from-softpink-100 to-skyblue-50 border border-hotpink-200 rounded-xl p-8 text-center">
                <h3 className="font-[family-name:var(--font-heading)] font-bold text-xl text-charcoal mb-2">
                  Interested? Let&apos;s talk.
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  We build custom websites for mahjong groups and communities. Tell us about your group and we&apos;ll be in touch.
                </p>

                {websiteSubmitted ? (
                  <div className="flex items-center justify-center gap-2 text-hotpink-600 font-medium">
                    <CheckCircle className="w-5 h-5" />
                    Message sent! We&apos;ll be in touch soon.
                  </div>
                ) : (
                  <form onSubmit={handleWebsiteSubmit} className="max-w-md mx-auto space-y-3">
                    <input
                      type="text"
                      required
                      value={websiteForm.name}
                      onChange={(e) => setWebsiteForm({ ...websiteForm, name: e.target.value })}
                      className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm"
                      placeholder="Your name"
                    />
                    <input
                      type="email"
                      required
                      value={websiteForm.email}
                      onChange={(e) => setWebsiteForm({ ...websiteForm, email: e.target.value })}
                      className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm"
                      placeholder="Your email"
                    />
                    <textarea
                      rows={3}
                      value={websiteForm.description}
                      onChange={(e) => setWebsiteForm({ ...websiteForm, description: e.target.value })}
                      className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm"
                      placeholder="Tell us about your group (optional)"
                    />
                    {websiteError && (
                      <p className="text-sm text-red-600">{websiteError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={websiteSubmitting}
                      className="flex items-center gap-2 mx-auto bg-hotpink-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {websiteSubmitting ? "Sending..." : "Get in Touch"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
