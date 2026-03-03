"use client";

import { CheckCircle, XCircle, Eye, Clock } from "lucide-react";

const mockSubmissions = [
  { id: "s1", name: "Phoenix Mahj Club", organizer: "Susan K.", city: "Phoenix, AZ", submitted: "2 hours ago", type: "Open Play" },
  { id: "s2", name: "Brooklyn Riichi Night", organizer: "Yuki T.", city: "Brooklyn, NY", submitted: "1 day ago", type: "Open Play" },
  { id: "s3", name: "Austin Beginner Lessons", organizer: "Maria G.", city: "Austin, TX", submitted: "3 days ago", type: "Lessons" },
];

export default function AdminSubmissionsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-2">
        Organizer Submissions
      </h1>
      <p className="text-slate-500 mb-8">Review and approve new group submissions.</p>

      <div className="space-y-4">
        {mockSubmissions.map((sub) => (
          <div key={sub.id} className="bg-lavender-100 border border-lavender-200 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg text-charcoal">{sub.name}</h3>
                  <span className="text-xs font-medium bg-gold-100 text-gold-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pending
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  Submitted by {sub.organizer} &middot; {sub.city} &middot; {sub.type} &middot; {sub.submitted}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-skyblue-100 rounded-lg" title="Preview">
                  <Eye className="w-4 h-4 text-slate-500" />
                </button>
                <button className="flex items-center gap-1.5 bg-mint-100 hover:bg-mint-200 border border-mint-300 rounded-lg px-4 py-2 text-sm font-medium text-mint-600 transition-colors">
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-4 py-2 text-sm font-medium text-red-700 transition-colors">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {mockSubmissions.length === 0 && (
        <div className="text-center py-16">
          <CheckCircle className="w-12 h-12 text-mint-300 mx-auto mb-4" />
          <h3 className="font-semibold text-lg text-slate-700">All caught up!</h3>
          <p className="text-slate-500 text-sm">No pending submissions to review.</p>
        </div>
      )}
    </div>
  );
}
