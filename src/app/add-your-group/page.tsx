"use client";

import { useState, FormEvent } from "react";
import { CheckCircle, Send, MapPin, Globe, Calendar, Users, Star, MessageCircle } from "lucide-react";

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

      {/* Part 2: Verified Organizers */}
      <section className="bg-skyblue-50 border-t border-skyblue-200">
        <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20">
          <div className="text-center mb-8">
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-2xl sm:text-3xl text-charcoal mb-3">
              Run events regularly? Get verified.
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Verified organizers can post and update their own events anytime &mdash; no waiting for us to do it.
            </p>
          </div>

          <div className="mahj-tile p-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-hotpink-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-hotpink-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal">Submit your group above</h3>
                  <p className="text-sm text-slate-500">Fill out the form and we&apos;ll add your listing within 48 hours.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-hotpink-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-hotpink-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal">Request verification</h3>
                  <p className="text-sm text-slate-500">Once your listing is live, claim it from the listing page and we&apos;ll verify you as the organizer.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-hotpink-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-hotpink-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal">Post your own events</h3>
                  <p className="text-sm text-slate-500">Once verified, you can add new events, update schedules, and keep your listing current &mdash; all on your own.</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Questions? Email us at <a href="mailto:hello@mahjnearme.com" className="text-hotpink-500 hover:underline">hello@mahjnearme.com</a>
          </p>
        </div>
      </section>
    </>
  );
}
