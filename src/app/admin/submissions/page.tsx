"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Eye, Clock, X, ChevronDown } from "lucide-react";

const initialSubmissions = [
  {
    id: "s1",
    name: "Phoenix Mahj Club",
    organizer: "Susan K.",
    city: "Phoenix, AZ",
    submitted: "2 hours ago",
    type: "Open Play",
    email: "susan.k@example.com",
    description: "Weekly American Mahjong open play at the community center. All levels welcome. Sets provided.",
    venue: "Phoenix Community Center",
    day: "Saturday",
    time: "10:00 AM - 1:00 PM",
    cost: "$5",
  },
  {
    id: "s2",
    name: "Brooklyn Riichi Night",
    organizer: "Yuki T.",
    city: "Brooklyn, NY",
    submitted: "1 day ago",
    type: "Open Play",
    email: "yuki.t@example.com",
    description: "Japanese Riichi Mahjong every Friday night. Automatic tables available. Beginners welcome on first Fridays.",
    venue: "Dice & Board Cafe",
    day: "Friday",
    time: "7:00 PM - 11:00 PM",
    cost: "Free",
  },
  {
    id: "s3",
    name: "Austin Beginner Lessons",
    organizer: "Maria G.",
    city: "Austin, TX",
    submitted: "3 days ago",
    type: "Lessons",
    email: "maria.g@example.com",
    description: "Learn American Mahjong from scratch! 4-week course covering rules, strategy, and hands-on play.",
    venue: "Austin Public Library - Central",
    day: "Wednesday",
    time: "2:00 PM - 4:00 PM",
    cost: "$25 per session",
  },
];

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleApprove = (id: string) => {
    const sub = submissions.find((s) => s.id === id);
    if (!sub) return;
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    setExpandedId(null);
    setToast({ message: `"${sub.name}" has been approved and will be added to listings.`, type: "success" });
  };

  const handleReject = (id: string) => {
    const sub = submissions.find((s) => s.id === id);
    if (!sub) return;
    if (!window.confirm(`Are you sure you want to reject "${sub.name}"?`)) return;
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    setExpandedId(null);
    setToast({ message: `"${sub.name}" has been rejected.`, type: "info" });
  };

  const handleTogglePreview = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-hotpink-50 border-hotpink-200 text-hotpink-700"
              : "bg-skyblue-50 border-skyblue-200 text-skyblue-700"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
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

      <h1 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-2">
        Contact Inquiries
      </h1>
      <p className="text-slate-500 mb-8">Review group listing requests and website inquiries submitted via the contact form.</p>

      <div className="space-y-4">
        {submissions.map((sub) => (
          <div key={sub.id} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg text-charcoal">{sub.name}</h3>
                  <span className="text-xs font-medium bg-skyblue-100 text-skyblue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pending
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  Submitted by {sub.organizer} &middot; {sub.city} &middot; {sub.type} &middot; {sub.submitted}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleTogglePreview(sub.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    expandedId === sub.id
                      ? "bg-skyblue-200 text-skyblue-700"
                      : "hover:bg-skyblue-100 text-slate-500"
                  }`}
                  title="Preview"
                >
                  {expandedId === sub.id ? <ChevronDown className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleApprove(sub.id)}
                  className="flex items-center gap-1.5 bg-skyblue-100 hover:bg-hotpink-200 border border-hotpink-200 rounded-lg px-4 py-2 text-sm font-medium text-hotpink-600 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button
                  onClick={() => handleReject(sub.id)}
                  className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-4 py-2 text-sm font-medium text-red-700 transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>

            {/* Expanded Preview */}
            {expandedId === sub.id && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-xs font-medium text-slate-400 uppercase">Venue</span>
                    <p className="text-charcoal">{sub.venue}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-400 uppercase">Schedule</span>
                    <p className="text-charcoal">{sub.day}, {sub.time}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-400 uppercase">Cost</span>
                    <p className="text-charcoal">{sub.cost}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-400 uppercase">Organizer Email</span>
                    <p className="text-charcoal">{sub.email}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-400 uppercase">Type</span>
                    <p className="text-charcoal">{sub.type}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-400 uppercase">Location</span>
                    <p className="text-charcoal">{sub.city}</p>
                  </div>
                </div>
                {sub.description && (
                  <div className="mt-3">
                    <span className="text-xs font-medium text-slate-400 uppercase">Description</span>
                    <p className="text-sm text-slate-600 mt-1">{sub.description}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {submissions.length === 0 && (
        <div className="text-center py-16">
          <CheckCircle className="w-12 h-12 text-hotpink-200 mx-auto mb-4" />
          <h3 className="font-semibold text-lg text-slate-700">All caught up!</h3>
          <p className="text-slate-500 text-sm">No pending submissions to review.</p>
        </div>
      )}
    </div>
  );
}
