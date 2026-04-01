"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search,
  GraduationCap,
  MapPin,
  Star,
  Globe,
  Mail,
  Loader2,
  Filter,
  Lock,
  ArrowRight,
} from "lucide-react";

interface Instructor {
  id: string;
  organizerName: string;
  slug: string;
  bio: string;
  contactEmail: string;
  website: string;
  instagram: string;
  photoURL: string | null;
  cities: string[];
  states: string[];
  featured: boolean;
  instructorDetails: {
    teachingStyles: string[];
    certifications: string;
    serviceArea: string;
    gameStylesTaught: string[];
  } | null;
}

export default function InstructorsPage() {
  const { hasAccess, loading: authLoading } = useAuth();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [styleFilter, setStyleFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchInstructors() {
      try {
        const res = await fetch("/api/organizers/instructors");
        if (res.ok) {
          const data = await res.json();
          setInstructors(data.instructors || []);
        }
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }
    fetchInstructors();
  }, []);

  const filtered = useMemo(() => {
    let result = instructors;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.organizerName.toLowerCase().includes(q) ||
          i.cities.some((c) => c.toLowerCase().includes(q)) ||
          i.states.some((s) => s.toLowerCase().includes(q)) ||
          (i.instructorDetails?.serviceArea || "").toLowerCase().includes(q) ||
          (i.instructorDetails?.certifications || "").toLowerCase().includes(q)
      );
    }

    if (styleFilter !== "all") {
      result = result.filter((i) =>
        i.instructorDetails?.gameStylesTaught?.includes(styleFilter)
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((i) =>
        i.instructorDetails?.teachingStyles?.includes(typeFilter)
      );
    }

    // Featured instructors first
    return result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }, [instructors, searchQuery, styleFilter, typeFilter]);

  if (!authLoading && !hasAccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Lock className="w-12 h-12 text-purple-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Find a Mahjong Instructor
        </h1>
        <p className="text-slate-600 mb-6">
          Browse certified instructors who offer private lessons, group classes, and more.
          Available for subscribers.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-hotpink-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition"
        >
          Get Started <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-xs text-slate-400 mt-4">
          Are you an instructor?{" "}
          <Link href="/for-organizers" className="text-hotpink-500 hover:text-hotpink-600 font-medium">
            Apply to get listed
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Find a Mahjong Instructor
        </h1>
        <p className="text-slate-600">
          Learn mahjong from experienced instructors near you. Browse by
          location, teaching style, and game variant.
        </p>
      </div>

      {/* Search & filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, city, or state..."
            className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-softpink-400 focus:outline-none"
          />
        </div>
        <select
          value={styleFilter}
          onChange={(e) => setStyleFilter(e.target.value)}
          className="px-3 py-2.5 border-2 border-slate-200 rounded-lg text-sm"
        >
          <option value="all">All Game Styles</option>
          <option value="american">American (NMJL)</option>
          <option value="chinese">Chinese</option>
          <option value="riichi">Riichi / Japanese</option>
          <option value="other">Other</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 border-2 border-slate-200 rounded-lg text-sm"
        >
          <option value="all">All Lesson Types</option>
          <option value="private">Private</option>
          <option value="group">Group</option>
          <option value="corporate">Corporate</option>
          <option value="kids">Kids / Youth</option>
          <option value="online">Online</option>
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-hotpink-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <GraduationCap className="w-12 h-12 mx-auto mb-3" />
          <p>No instructors found matching your search.</p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-hotpink-500 mt-2 text-sm"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {filtered.length} instructor{filtered.length !== 1 ? "s" : ""} found
          </p>
          {filtered.map((instructor) => (
            <InstructorCard key={instructor.id} instructor={instructor} />
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-12 bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
        <GraduationCap className="w-8 h-8 text-purple-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-purple-800 mb-2">
          Are you a mahjong instructor?
        </h2>
        <p className="text-purple-600 text-sm mb-4">
          Claim your listings and turn on the instructor toggle to get listed
          here. It&apos;s free!
        </p>
        <Link
          href="/claim-listing"
          className="inline-block bg-purple-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-600 transition"
        >
          Get Listed
        </Link>
      </div>
    </div>
  );
}

function InstructorCard({ instructor }: { instructor: Instructor }) {
  const details = instructor.instructorDetails;

  return (
    <Link
      href={`/organizer/${instructor.slug}`}
      className="block border border-slate-200 rounded-lg p-4 hover:border-purple-300 transition"
    >
      <div className="flex gap-4">
        {instructor.photoURL && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={instructor.photoURL}
            alt={instructor.organizerName}
            className="w-16 h-16 rounded-full object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-800">
              {instructor.organizerName}
            </h3>
            {instructor.featured && (
              <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-500" /> Featured
              </span>
            )}
          </div>

          {instructor.cities.length > 0 && (
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {instructor.cities.slice(0, 3).join(", ")}
              {instructor.cities.length > 3
                ? ` +${instructor.cities.length - 3} more`
                : ""}
            </p>
          )}

          {details?.serviceArea && (
            <p className="text-sm text-slate-500 mt-0.5">
              Service area: {details.serviceArea}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5 mt-2">
            {details?.teachingStyles?.map((style) => (
              <span
                key={style}
                className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full capitalize"
              >
                {style}
              </span>
            ))}
            {details?.gameStylesTaught?.map((style) => (
              <span
                key={style}
                className="bg-skyblue-100 text-skyblue-700 text-xs px-2 py-0.5 rounded-full capitalize"
              >
                {style}
              </span>
            ))}
          </div>

          {details?.certifications && (
            <p className="text-xs text-slate-400 mt-1">
              {details.certifications}
            </p>
          )}

          {instructor.bio && (
            <p className="text-sm text-slate-500 mt-2 line-clamp-2">
              {instructor.bio}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
