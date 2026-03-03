"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Eye,
  Edit,
  CheckCircle,
  TrendingUp,
  Plus,
  BarChart3,
  MessageSquare,
  ShieldCheck,
  Star,
  XCircle,
} from "lucide-react";

export default function OrganizerDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="animate-shimmer h-96 rounded-xl" />
      </div>
    );
  }

  // Mock organizer verification status
  const isVerifiedOrganizer = true;

  // Mock organizer data
  const listings = [
    {
      id: "1",
      name: "Tuesday Night Mahj at McNellie's",
      city: "Tulsa, OK",
      type: "Open Play",
      views: 142,
      clicks: 38,
      verified: true,
      promoted: false,
      status: "active" as const,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-charcoal">
            Organizer Dashboard
          </h1>
          <p className="text-slate-500 mt-1">Manage your mahjong group listings</p>
        </div>
        {isVerifiedOrganizer ? (
          <Link
            href="/add-your-group"
            className="flex items-center gap-2 bg-hotpink-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add New Listing
          </Link>
        ) : (
          <span className="text-sm text-slate-500 bg-skyblue-100 px-4 py-2 rounded-lg">
            Verification required to post
          </span>
        )}
      </div>

      {/* Verification Status Banner */}
      {isVerifiedOrganizer ? (
        <div className="bg-skyblue-100 border border-hotpink-200 rounded-xl p-4 mb-8 flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-hotpink-500 shrink-0" />
          <div>
            <p className="font-semibold text-hotpink-600 text-sm">Verified Organizer</p>
            <p className="text-hotpink-600 text-xs mt-0.5">
              You can post and edit listings freely. Listings you post from MahjNearMe are automatically featured and shown first in search results.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-skyblue-100 border border-skyblue-200 rounded-xl p-4 mb-8 flex items-center gap-3">
          <XCircle className="w-6 h-6 text-skyblue-600 shrink-0" />
          <div>
            <p className="font-semibold text-skyblue-800 text-sm">Pending Verification</p>
            <p className="text-skyblue-700 text-xs mt-0.5">
              Your organizer account is awaiting admin verification. Once verified, you&apos;ll be able to post and manage listings directly.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Views", value: "142", icon: Eye, color: "text-hotpink-500" },
          { label: "Click-throughs", value: "38", icon: TrendingUp, color: "text-hotpink-400" },
          { label: "Active Listings", value: "1", icon: LayoutDashboard, color: "text-skyblue-500" },
          { label: "Reviews", value: "3", icon: MessageSquare, color: "text-skyblue-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <BarChart3 className="w-4 h-4 text-slate-300" />
            </div>
            <p className="text-2xl font-bold text-charcoal">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Listings */}
      <h2 className="font-semibold text-xl text-charcoal mb-4">Your Listings</h2>
      <div className="space-y-4">
        {listings.map((listing) => (
          <div key={listing.id} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg text-charcoal">{listing.name}</h3>
                <p className="text-sm text-slate-500">{listing.city} &middot; {listing.type}</p>
              </div>
              <div className="flex items-center gap-3">
                {listing.verified ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-hotpink-600 bg-skyblue-100 border border-hotpink-200 rounded-full px-3 py-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-1">
                    <XCircle className="w-3.5 h-3.5" /> Unverified
                  </span>
                )}
                {listing.promoted && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-skyblue-600 bg-skyblue-100 border border-skyblue-200 rounded-full px-3 py-1">
                    <Star className="w-3.5 h-3.5" /> Featured
                  </span>
                )}
                <button className="flex items-center gap-1.5 bg-skyblue-100 hover:bg-skyblue-200 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors">
                  <Edit className="w-4 h-4" /> Edit
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white">
              <div>
                <p className="text-sm text-slate-500">Views (30d)</p>
                <p className="text-lg font-semibold text-charcoal">{listing.views}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Click-throughs</p>
                <p className="text-lg font-semibold text-charcoal">{listing.clicks}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <p className="text-lg font-semibold text-hotpink-500 capitalize">{listing.status}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button className="text-sm text-slate-500 hover:text-slate-700 font-medium">
                View as Player
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Reviews */}
      <h2 className="font-semibold text-xl text-charcoal mb-4 mt-10">Recent Reviews</h2>
      <div className="space-y-3">
        {[
          { user: "Linda M.", rating: 5, comment: "Super welcoming group! Great for beginners.", date: "2 days ago" },
          { user: "Carol S.", rating: 5, comment: "Love the venue and the vibe. Will definitely come back!", date: "1 week ago" },
          { user: "Barbara T.", rating: 4, comment: "Fun group but gets a little crowded. Arrive early for a seat!", date: "2 weeks ago" },
        ].map((review, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-charcoal text-sm">{review.user}</span>
                <div className="flex">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <span key={j} className="text-skyblue-500 text-sm">&#9733;</span>
                  ))}
                </div>
              </div>
              <span className="text-xs text-slate-400">{review.date}</span>
            </div>
            <p className="text-sm text-slate-600">{review.comment}</p>
            <button className="text-xs text-hotpink-500 hover:text-hotpink-600 font-medium mt-2">Reply</button>
          </div>
        ))}
      </div>
    </div>
  );
}
