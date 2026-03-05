"use client";

import { useState, useMemo, FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { findMetroForCity } from "@/lib/metro-regions";
import {
  CheckCircle,
  Send,
  MapPin,
  Clock,
  Shield,
  Users,
  Heart,
  ArrowRight,
  Loader2,
  Info,
} from "lucide-react";

const CONNECTION_OPTIONS = [
  { value: "regular_player", label: "I'm a regular player" },
  { value: "multiple_venues", label: "I play at multiple venues" },
  { value: "active_in_groups", label: "I'm active in local mahjong groups" },
  { value: "help_new_players", label: "I help new players find games" },
];

export default function ContributePage() {
  const { user, userProfile, isContributor } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    city: "",
    connections: [] as string[],
    story: "",
  });

  const hasAlreadyApplied = userProfile?.contributorAppliedAt !== null && userProfile?.contributorAppliedAt !== undefined;
  const isPendingReview = userProfile?.contributorStatus === "pending";
  const isApproved = isContributor;

  const resolvedMetro = useMemo(() => {
    if (!form.city) return null;
    // Try to find metro from the city name (strip state suffix if present)
    const cityPart = form.city.split(",")[0].trim();
    return findMetroForCity(cityPart);
  }, [form.city]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/contributor-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          userId: user.uid,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/c2d2c03301c201e23fd4816059b397c4.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF1493]/85 via-[#FF69B4]/75 to-[#87CEEB]/80" />
        </div>

        <div className="max-w-4xl mx-auto px-4 pt-16 pb-12 sm:pt-24 sm:pb-16 text-center relative">
          <div className="flex justify-center gap-2 mb-4">
            <span className="text-2xl opacity-50">🀇</span>
            <span className="text-2xl opacity-50">🀄</span>
            <span className="text-2xl opacity-50">🀙</span>
          </div>
          <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white mb-4 tracking-tight drop-shadow-lg">
            Become a Community{" "}
            <span className="text-skyblue-200">Contributor</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
            Help keep your metro area&apos;s mahjong listings accurate and get free
            full access to MahjNearMe in return.
          </p>
        </div>
      </section>

      {/* What Contributors Do */}
      <section className="py-12 sm:py-16 section-warm">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-center text-charcoal mb-3">
            What is a Community Contributor?
          </h2>
          <p className="text-center text-slate-500 mb-10 max-w-2xl mx-auto">
            Contributors are real mahjong players &mdash; not staff &mdash; who
            know the local scene and help keep their metro region&apos;s listings
            up-to-date. Think of it as being the go-to person for mahjong info
            in your area.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="mahj-tile p-6 text-center">
              <div className="w-12 h-12 bg-hotpink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-hotpink-500" />
              </div>
              <h3 className="font-semibold text-charcoal mb-2">
                Local Expert
              </h3>
              <p className="text-sm text-slate-500">
                You play at multiple venues and know the mahjong scene in your
                metro area.
              </p>
            </div>

            <div className="mahj-tile p-6 text-center">
              <div className="w-12 h-12 bg-skyblue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-skyblue-500" />
              </div>
              <h3 className="font-semibold text-charcoal mb-2">
                Verified Listings
              </h3>
              <p className="text-sm text-slate-500">
                Your name appears on every city page in your metro as the
                person who keeps listings accurate.
              </p>
            </div>

            <div className="mahj-tile p-6 text-center">
              <div className="w-12 h-12 bg-hotpink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-hotpink-500" />
              </div>
              <h3 className="font-semibold text-charcoal mb-2">
                ~30 Min/Month
              </h3>
              <p className="text-sm text-slate-500">
                A small commitment. No technical skills needed &mdash; just
                knowledge of your local games.
              </p>
            </div>

            <div className="mahj-tile p-6 text-center">
              <div className="w-12 h-12 bg-skyblue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-skyblue-500" />
              </div>
              <h3 className="font-semibold text-charcoal mb-2">
                Free Full Access
              </h3>
              <p className="text-sm text-slate-500">
                Enjoy every feature on MahjNearMe for free, as long as
                you&apos;re an active contributor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-12 sm:py-16 section-mint">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-center text-charcoal mb-10">
            How It Works
          </h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-hotpink-500 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-charcoal text-lg">
                  Apply below
                </h3>
                <p className="text-slate-500">
                  Tell us about yourself and your mahjong life. It takes less
                  than a minute.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-hotpink-500 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-charcoal text-lg">
                  Get instant access
                </h3>
                <p className="text-slate-500">
                  You&apos;ll get a 14-day free trial immediately while we
                  review your application. No credit card needed.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-hotpink-500 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-charcoal text-lg">
                  Start contributing
                </h3>
                <p className="text-slate-500">
                  Once approved, you&apos;re on the full paid plan for free &mdash; permanently.
                  Your name appears on every city page in your metro and you
                  become a moderator in your metro&apos;s community forum.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-12 sm:py-16 section-warm">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-center text-charcoal mb-8">
            Apply to Contribute
          </h2>

          {!user ? (
            <div className="mahj-tile p-8 text-center">
              <Users className="w-12 h-12 text-hotpink-400 mx-auto mb-4" />
              <h3 className="font-semibold text-lg text-charcoal mb-2">
                Sign in to apply
              </h3>
              <p className="text-slate-500 mb-6">
                You need a MahjNearMe account to become a contributor.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/signup"
                  className="bg-hotpink-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors"
                >
                  Sign Up Free
                </Link>
                <Link
                  href="/login"
                  className="bg-white text-hotpink-500 border-2 border-hotpink-300 px-6 py-3 rounded-xl font-semibold hover:bg-hotpink-50 transition-colors"
                >
                  Log In
                </Link>
              </div>
            </div>
          ) : isApproved ? (
            <div className="mahj-tile p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-2">
                You&apos;re a Contributor!
              </h3>
              <p className="text-slate-500 mb-6">
                Thank you for helping keep the{" "}
                {userProfile?.contributorMetro || userProfile?.contributorCity || "your metro"} area&apos;s listings
                accurate. You have permanent free full access.
              </p>
              <Link
                href="/community"
                className="inline-flex items-center gap-2 bg-hotpink-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors"
              >
                Visit Community Forum <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : hasAlreadyApplied || submitted ? (
            <div className="mahj-tile p-8 text-center">
              <div className="w-16 h-16 bg-skyblue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-skyblue-500" />
              </div>
              <h3 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-2">
                {submitted
                  ? "Application Submitted!"
                  : "Application Under Review"}
              </h3>
              <p className="text-slate-500 mb-4">
                {isPendingReview
                  ? "Your contributor application is being reviewed. Enjoy full access while you wait!"
                  : submitted
                    ? "You've been granted a 14-day free trial while we review your application. No credit card needed!"
                    : "We've already received your application. We'll be in touch soon."}
              </p>
              {(isPendingReview || submitted) && (
                <div className="bg-skyblue-50 border border-skyblue-200 rounded-lg p-4 text-sm text-skyblue-600">
                  Your contributor application is under review. Enjoy full
                  access while you wait.
                </div>
              )}
            </div>
          ) : (
            <div className="mahj-tile p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) =>
                      setForm({ ...form, city: e.target.value })
                    }
                    className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm"
                    placeholder="e.g., Tulsa, OK"
                  />
                  {resolvedMetro && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-skyblue-600 bg-skyblue-50 rounded-lg px-3 py-2">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      You&apos;ll be contributing for the <strong>{resolvedMetro.metro}</strong> metro region
                      ({resolvedMetro.cities.slice(0, 4).join(", ")}{resolvedMetro.cities.length > 4 ? ", and more" : ""})
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    How are you connected to mahjong in your area? *
                  </label>
                  <div className="space-y-2">
                    {CONNECTION_OPTIONS.map(({ value, label }) => (
                      <label
                        key={value}
                        className="flex items-center gap-3 text-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={form.connections.includes(value)}
                          onChange={(e) => {
                            const connections = e.target.checked
                              ? [...form.connections, value]
                              : form.connections.filter((c) => c !== value);
                            setForm({ ...form, connections });
                          }}
                          className="rounded border-skyblue-300 text-hotpink-500 focus:ring-hotpink-400"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tell us about your mahjong life in{" "}
                    {resolvedMetro ? `the ${resolvedMetro.metro} area` : form.city || "your area"} *
                  </label>
                  <p className="text-xs text-slate-400 mb-2">
                    Where do you play? How did you find your games? What&apos;s
                    the scene like?
                  </p>
                  <textarea
                    required
                    rows={4}
                    value={form.story}
                    onChange={(e) =>
                      setForm({ ...form, story: e.target.value })
                    }
                    className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm"
                    placeholder="I play at three different spots in town..."
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={
                    submitting || form.connections.length === 0
                  }
                  className="flex items-center gap-2 bg-hotpink-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors disabled:opacity-50 w-full justify-center"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />{" "}
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Submit Application
                    </>
                  )}
                </button>

                <p className="text-xs text-slate-400 text-center">
                  You&apos;ll get instant 14-day full access while we review
                  your application.
                </p>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* CTA: List Your Group */}
      <section className="py-12 sm:py-16 section-mint">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="card-white p-8">
            <div className="text-3xl mb-3">🀄</div>
            <h3 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-3">
              Run a mahjong group?
            </h3>
            <p className="text-slate-500 mb-6">
              Contributing is about verifying and keeping listings current. If
              you want to list your own game or group, head over to our listing
              form.
            </p>
            <Link
              href="/add-your-group"
              className="inline-flex items-center gap-2 bg-skyblue-400 text-white px-6 py-3 rounded-xl font-semibold hover:bg-skyblue-500 transition-colors"
            >
              List Your Group <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
