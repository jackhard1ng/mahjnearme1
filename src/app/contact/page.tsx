"use client";

import { useState, useRef, FormEvent } from "react";
import { Send, CheckCircle } from "lucide-react";

const MIN_MESSAGE_LENGTH = 10;

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  // Honeypot field value — should always stay empty for real users
  const [honeypot, setHoneypot] = useState("");

  // Timestamp set on mount — used for time-based bot detection
  const loadTime = useRef(Date.now());

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side message length check
    if (form.message.trim().length < MIN_MESSAGE_LENGTH) {
      setError(`Message must be at least ${MIN_MESSAGE_LENGTH} characters.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
          formType: "website-inquiry",
          _hp_email: honeypot,
          _ts: loadTime.current,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <CheckCircle className="w-12 h-12 text-hotpink-500 mx-auto mb-4" />
        <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-charcoal mb-3">
          Message Sent!
        </h1>
        <p className="text-slate-500">
          Thanks for reaching out! We&apos;ll get back to you within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl sm:text-4xl text-charcoal mb-3">
        Contact Us
      </h1>
      <p className="text-slate-500 mb-8">
        Have a question, suggestion, or found a game we should list? We&apos;d love to hear from you.
      </p>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm" />
            </div>
          </div>

          {/* Honeypot — invisible to real users, bots auto-fill it */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", top: "-9999px", opacity: 0, height: 0, overflow: "hidden" }}>
            <label htmlFor="hp_email">Leave this empty</label>
            <input
              type="email"
              id="hp_email"
              name="email_confirm"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <select value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm">
              <option value="">Select a topic...</option>
              <option value="general">General Question</option>
              <option value="listing">Submit a Game / Listing Issue</option>
              <option value="account">Account / Subscription Help</option>
              <option value="partnership">Partnership / Press</option>
              <option value="bug">Report a Bug</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
            <textarea
              required
              rows={5}
              minLength={MIN_MESSAGE_LENGTH}
              value={form.message}
              onChange={(e) => { setForm({...form, message: e.target.value}); setError(""); }}
              className="w-full border border-skyblue-300 rounded-lg px-3 py-2.5 text-sm"
              placeholder="How can we help?"
            />
            <p className="text-xs text-slate-400 mt-1">Minimum {MIN_MESSAGE_LENGTH} characters</p>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-hotpink-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> {submitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>

      <div className="mt-8 text-center text-sm text-slate-500">
        <p>You can also reach us at <a href="mailto:hello@mahjnearme.com" className="text-hotpink-500 hover:text-hotpink-600 font-medium">hello@mahjnearme.com</a></p>
      </div>
    </div>
  );
}
