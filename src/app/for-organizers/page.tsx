"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import {
  CheckCircle,
  Star,
  GraduationCap,
  Calendar,
  Edit3,
  Users,
  Zap,
  ArrowRight,
  Loader2,
  AlertCircle,
  Globe,
  Instagram,
} from "lucide-react";

type ApplyRole = "organizer" | "instructor" | "both" | null;

export default function ForOrganizersPage() {
  const { user, userProfile, isOrganizer } = useAuth();
  const [selectedRole, setSelectedRole] = useState<ApplyRole>(null);

  if (isOrganizer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-4">
          You&apos;re an Organizer
        </h1>
        <p className="text-slate-600 mb-6">
          Head to your dashboard to manage listings, add events, and update your
          profile.
        </p>
        <Link
          href="/organizer"
          className="inline-flex items-center gap-2 bg-softpink-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-softpink-600 transition"
        >
          Go to Dashboard <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3">
          For Organizers & Instructors
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Manage your mahjong games, reach new players, and grow your community.
          Free for all organizers and instructors.
        </p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { icon: Calendar, title: "Manage Listings", desc: "Claim existing listings or add new events to the directory" },
          { icon: Users, title: "Public Profile", desc: "Get a profile page to share with your community" },
          { icon: Edit3, title: "Keep Info Fresh", desc: "Update schedules, venues, and contact details anytime" },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white border border-slate-200 rounded-lg p-4 text-center">
            <Icon className="w-8 h-8 text-softpink-500 mx-auto mb-2" />
            <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
            <p className="text-sm text-slate-500">{desc}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-skyblue-50 border border-skyblue-200 rounded-xl p-5 mb-10">
        <h3 className="font-semibold text-slate-800 mb-3">How it works</h3>
        <ol className="space-y-2 text-sm text-slate-700">
          <li className="flex gap-2">
            <span className="bg-skyblue-200 text-skyblue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
            Apply below as an organizer, instructor, or both
          </li>
          <li className="flex gap-2">
            <span className="bg-skyblue-200 text-skyblue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
            We review your application (usually within 24 hours)
          </li>
          <li className="flex gap-2">
            <span className="bg-skyblue-200 text-skyblue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
            Once approved, you get your dashboard where you can claim existing listings or add new events
          </li>
        </ol>
      </div>

      {/* Role selection */}
      <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">
        Apply now
      </h2>
      <p className="text-center text-slate-500 text-sm mb-6">
        Choose what best describes you
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Organizer */}
        <div className={`text-left border-2 rounded-xl p-5 transition ${
          selectedRole === "organizer" ? "border-softpink-500 bg-softpink-50" : "border-slate-200 bg-white"
        }`}>
          <Calendar className="w-7 h-7 text-softpink-500 mb-2" />
          <h3 className="font-semibold text-slate-800 mb-1">Organizer</h3>
          <p className="text-sm text-slate-500 mb-3">
            I run mahjong games, meetups, or events and want to manage my listings.
          </p>
          <button
            onClick={() => setSelectedRole(selectedRole === "organizer" ? null : "organizer")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedRole === "organizer"
                ? "bg-softpink-500 text-white"
                : "bg-softpink-100 text-softpink-700 hover:bg-softpink-200"
            }`}
          >
            {selectedRole === "organizer" ? <><CheckCircle className="w-4 h-4" /> Selected</> : <>Apply as Organizer <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>

        {/* Instructor */}
        <div className={`text-left border-2 rounded-xl p-5 transition ${
          selectedRole === "instructor" ? "border-purple-500 bg-purple-50" : "border-slate-200 bg-white"
        }`}>
          <GraduationCap className="w-7 h-7 text-purple-500 mb-2" />
          <h3 className="font-semibold text-slate-800 mb-1">Instructor</h3>
          <p className="text-sm text-slate-500 mb-3">
            I teach mahjong lessons and want to be listed in the instructor directory.
          </p>
          <button
            onClick={() => setSelectedRole(selectedRole === "instructor" ? null : "instructor")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedRole === "instructor"
                ? "bg-purple-500 text-white"
                : "bg-purple-100 text-purple-700 hover:bg-purple-200"
            }`}
          >
            {selectedRole === "instructor" ? <><CheckCircle className="w-4 h-4" /> Selected</> : <>Apply as Instructor <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>

        {/* Both */}
        <div className={`text-left border-2 rounded-xl p-5 transition ${
          selectedRole === "both" ? "border-amber-500 bg-amber-50" : "border-slate-200 bg-white"
        }`}>
          <div className="flex gap-1 mb-2">
            <Calendar className="w-7 h-7 text-softpink-500" />
            <GraduationCap className="w-7 h-7 text-purple-500" />
          </div>
          <h3 className="font-semibold text-slate-800 mb-1">Both</h3>
          <p className="text-sm text-slate-500 mb-3">
            I run games and teach lessons. I want to manage events and be in the instructor directory.
          </p>
          <button
            onClick={() => setSelectedRole(selectedRole === "both" ? null : "both")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedRole === "both"
                ? "bg-amber-500 text-white"
                : "bg-amber-100 text-amber-700 hover:bg-amber-200"
            }`}
          >
            {selectedRole === "both" ? <><CheckCircle className="w-4 h-4" /> Selected</> : <>Apply as Both <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>

      {/* Apply form */}
      {selectedRole && (
        user && userProfile ? (
          <ApplyForm
            userId={user.uid}
            userEmail={userProfile.email}
            userName={userProfile.displayName}
            role={selectedRole}
            onClose={() => setSelectedRole(null)}
          />
        ) : (
          <div className="bg-white border-2 border-softpink-200 rounded-xl p-6 mb-8 text-center">
            <p className="text-slate-600 mb-4">Sign in to submit your application.</p>
            <Link
              href="/login?redirect=/for-organizers"
              className="inline-flex items-center gap-2 bg-softpink-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-softpink-600 transition"
            >
              Sign In to Apply <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )
      )}

      {/* Find instructors link */}
      <div className="text-center my-8">
        <p className="text-slate-500 text-sm">
          Looking for a mahjong instructor?{" "}
          <Link href="/instructors" className="text-softpink-500 font-medium hover:text-softpink-600">
            Browse the instructor directory
          </Link>
        </p>
      </div>

      {/* Subscriber upsell */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
        <Star className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <h3 className="font-semibold text-slate-800 mb-2">Upgrade for more</h3>
        <p className="text-sm text-slate-600 mb-1">
          Subscribed organizers and instructors ($4.99/mo or $39.99/yr) get:
        </p>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-amber-800 mt-2">
          <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Instant edits (no approval wait)</span>
          <span className="flex items-center gap-1"><Star className="w-3 h-3" /> Featured badge on listings and instructor profile</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Priority placement in search results</span>
        </div>
        <p className="text-xs text-amber-600 mt-3">
          Free organizers and instructors get all core features. Subscribing is optional.
        </p>
      </div>
    </div>
  );
}

function ApplyForm({
  userId,
  userEmail,
  userName,
  role,
  onClose,
}: {
  userId: string;
  userEmail: string;
  userName: string;
  role: "organizer" | "instructor" | "both";
  onClose: () => void;
}) {
  const showInstructorFields = role === "instructor" || role === "both";
  const roleLabel = role === "organizer" ? "Organizer" : role === "instructor" ? "Instructor" : "Organizer & Instructor";

  const [form, setForm] = useState({
    organizerName: userName || "",
    city: "",
    state: "",
    bio: "",
    contactEmail: userEmail || "",
    website: "",
    instagram: "",
    facebookGroup: "",
    teachingStyles: [] as string[],
    certifications: "",
    serviceArea: "",
    gameStylesTaught: [] as string[],
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const toggleTeachingStyle = (s: string) =>
    setForm((f) => ({ ...f, teachingStyles: f.teachingStyles.includes(s) ? f.teachingStyles.filter((x) => x !== s) : [...f.teachingStyles, s] }));

  const toggleGameStyle = (s: string) =>
    setForm((f) => ({ ...f, gameStylesTaught: f.gameStylesTaught.includes(s) ? f.gameStylesTaught.filter((x) => x !== s) : [...f.gameStylesTaught, s] }));

  const handleSubmit = async () => {
    if (!form.organizerName || !form.city || !form.state) {
      setError("Name, city, and state are required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/organizer-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userEmail,
          userName,
          role,
          organizerName: form.organizerName,
          city: form.city,
          state: form.state,
          bio: form.bio,
          website: form.website,
          instagram: form.instagram,
          facebookGroup: form.facebookGroup,
          contactEmail: form.contactEmail,
          isInstructor: showInstructorFields,
          instructorDetails: showInstructorFields
            ? { teachingStyles: form.teachingStyles, certifications: form.certifications, serviceArea: form.serviceArea, gameStylesTaught: form.gameStylesTaught }
            : null,
          message: form.message,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit application.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8 mb-8 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800 mb-2">Application Submitted</h3>
        <p className="text-slate-600">We&apos;ll review your application and get back to you by email. Usually within 24 hours.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-softpink-200 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Apply as {roleLabel}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">Cancel</button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Your Name / Group Name *</label>
            <input type="text" value={form.organizerName} onChange={(e) => setForm({ ...form, organizerName: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="e.g. Jane Smith or Dallas Mahjong Club" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email *</label>
            <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
            <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
            <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="e.g. TX" maxLength={2} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">About You / Your Group</label>
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg h-20 resize-none" placeholder="Tell us about your mahjong group or teaching practice..." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Globe className="w-3 h-3" /> Website</label>
            <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Instagram className="w-3 h-3" /> Instagram</label>
            <input type="text" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="@handle" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Facebook Group</label>
            <input type="text" value={form.facebookGroup} onChange={(e) => setForm({ ...form, facebookGroup: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg" />
          </div>
        </div>

        {/* Instructor fields */}
        {showInstructorFields && (
          <div className="border-t border-purple-200 pt-4">
            <h4 className="font-medium text-purple-800 flex items-center gap-1.5 mb-3">
              <GraduationCap className="w-4 h-4" /> Instructor Details
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Teaching Styles</label>
                <div className="flex flex-wrap gap-2">
                  {["private", "group", "corporate", "kids", "online"].map((s) => (
                    <button key={s} type="button" onClick={() => toggleTeachingStyle(s)} className={`px-3 py-1.5 rounded-full text-sm border transition capitalize ${form.teachingStyles.includes(s) ? "bg-purple-500 text-white border-purple-500" : "border-slate-300 text-slate-600 hover:border-purple-300"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Game Styles Taught</label>
                <div className="flex flex-wrap gap-2">
                  {[{ value: "american", label: "American (NMJL)" }, { value: "chinese", label: "Chinese" }, { value: "riichi", label: "Riichi / Japanese" }, { value: "other", label: "Other" }].map((s) => (
                    <button key={s.value} type="button" onClick={() => toggleGameStyle(s.value)} className={`px-3 py-1.5 rounded-full text-sm border transition ${form.gameStylesTaught.includes(s.value) ? "bg-purple-500 text-white border-purple-500" : "border-slate-300 text-slate-600 hover:border-purple-300"}`}>{s.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Certifications</label>
                <input type="text" value={form.certifications} onChange={(e) => setForm({ ...form, certifications: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="e.g. Oh My Mahjong certified" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Service Area</label>
                <input type="text" value={form.serviceArea} onChange={(e) => setForm({ ...form, serviceArea: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="e.g. Dallas/Fort Worth and beyond" />
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Anything else you want us to know?</label>
          <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-lg h-16 resize-none" />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={submitting} className="w-full bg-softpink-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-softpink-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
          {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>) : (<><CheckCircle className="w-4 h-4" /> Submit Application</>)}
        </button>
      </div>
    </div>
  );
}
