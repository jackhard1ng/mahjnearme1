"use client";

import { useState, FormEvent } from "react";
import { CheckCircle, Send, MapPin, ArrowRight, Globe, Calendar, Users, Smartphone, Star, MessageCircle } from "lucide-react";

export default function AddYourGroupPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    groupName: "",
    city: "",
    state: "",
    email: "",
    description: "",
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
          <img src="/images/tiles-overhead.jpg" alt="" className="w-full h-full object-cover opacity-[0.08]" loading="lazy" />
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
              Want your group listed on MahjNearMe?
            </h1>
            <p className="text-lg text-hotpink-500 font-semibold mb-2">It&apos;s free.</p>
            <p className="text-slate-500 max-w-xl mx-auto">
              Tell us about your mahjong group and we&apos;ll add it to our directory within 48 hours. Reach players across the country — at no cost to you.
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
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm"
                      placeholder="e.g., Susan K."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Group Name *</label>
                    <input
                      type="text"
                      required
                      value={form.groupName}
                      onChange={(e) => setForm({ ...form, groupName: e.target.value })}
                      className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm"
                      placeholder="e.g., Tuesday Night Mahj"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm"
                      placeholder="e.g., Tulsa"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm"
                      placeholder="e.g., OK"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Your Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm"
                    placeholder="susan@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tell us about your group *</label>
                  <textarea
                    required
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm"
                    placeholder="What style of mahjong? When and where do you meet? How can new players join?"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-hotpink-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Sending..." : "Submit Your Group"}
                </button>
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
