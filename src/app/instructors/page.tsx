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
  Lock,
  ArrowRight,
  ExternalLink,
  Users,
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
  verified: boolean;
  listingCount: number;
  hasUser: boolean;
  instructorDetails: {
    teachingStyles: string[];
    certifications: string;
    serviceArea: string;
    gameStylesTaught: string[];
  } | null;
}

/** Clean up raw Instagram bios for display */
function cleanBio(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/[\u{1F300}-\u{1FAD6}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, "")
    .replace(/\|/g, ",")
    .replace(/\s{2,}/g, " ")
    .replace(/,\s*,/g, ",")
    .trim();
}

const TEACHING_STYLE_LABELS: Record<string, string> = {
  private: "Private Lessons",
  group: "Group Classes",
  corporate: "Corporate Events",
  kids: "Kids / Youth",
  online: "Online / Virtual",
};

const GAME_STYLE_LABELS: Record<string, string> = {
  american: "American (NMJL)",
  chinese: "Chinese",
  riichi: "Riichi",
  other: "Other",
};

export default function InstructorsPage() {
  const { hasAccess, isOrganizer, loading: authLoading } = useAuth();
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

      // Common area aliases: search term -> also match these terms
      const areaAliases: Record<string, string[]> = {
        miami: ["south florida", "fort lauderdale", "boca raton", "west palm beach", "broward", "dade"],
        "fort lauderdale": ["south florida", "miami", "broward"],
        "south florida": ["miami", "fort lauderdale", "boca raton", "west palm beach"],
        dallas: ["dfw", "fort worth", "plano", "frisco", "arlington", "north texas"],
        "fort worth": ["dfw", "dallas", "north texas"],
        houston: ["htx", "katy", "woodlands", "sugar land"],
        chicago: ["chicagoland", "northwest suburbs", "north shore"],
        "new york": ["nyc", "brooklyn", "manhattan", "queens", "bronx", "long island"],
        nyc: ["new york", "brooklyn", "manhattan"],
        brooklyn: ["nyc", "new york"],
        "los angeles": ["la", "west la", "pasadena", "santa monica"],
        "san francisco": ["sf", "bay area", "oakland"],
        dc: ["dmv", "nova", "northern virginia", "maryland"],
        washington: ["dc", "dmv", "nova"],
        atlanta: ["atl", "alpharetta", "roswell", "buckhead"],
        denver: ["front range", "colorado"],
        phoenix: ["scottsdale", "mesa", "chandler", "arizona"],
        seattle: ["puget sound", "bellevue", "washington"],
      };

      const expandedTerms = [q, ...(areaAliases[q] || [])];

      result = result.filter((i) => {
        const name = i.organizerName.toLowerCase();
        const cities = i.cities.map((c) => c.toLowerCase());
        const states = i.states.map((s) => s.toLowerCase());
        const serviceArea = (i.instructorDetails?.serviceArea || "").toLowerCase();
        const certs = (i.instructorDetails?.certifications || "").toLowerCase();

        return expandedTerms.some((term) =>
          name.includes(term) ||
          cities.some((c) => c.includes(term)) ||
          states.some((s) => s.includes(term)) ||
          serviceArea.includes(term) ||
          certs.includes(term)
        );
      });
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

    // Featured first, then verified, then by listing count
    // Within each tier, randomize order so no instructor always appears first
    return result.sort((a, b) => {
      if (a.featured !== b.featured) return b.featured ? 1 : -1;
      if (a.verified !== b.verified) return b.verified ? 1 : -1;
      if (a.listingCount !== b.listingCount) return (b.listingCount || 0) - (a.listingCount || 0);
      return 0; // stable within same tier — shuffled below
    });
  }, [instructors, searchQuery, styleFilter, typeFilter]);

  // Shuffle within each group so order is random on every page load
  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const featuredInstructors = shuffle(filtered.filter((i) => i.featured));
  const verifiedInstructors = shuffle(filtered.filter((i) => (i.verified || i.hasUser) && !i.featured));
  const otherInstructors = shuffle(filtered.filter((i) => !i.verified && !i.hasUser && !i.featured));
  // Verified organizers (free or paid) can browse the full instructor directory
  const showFullDirectory = hasAccess || isOrganizer;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Find a Mahjong Instructor
        </h1>
        <p className="text-slate-600 mb-4">
          Browse by location, teaching style, and game variant.
        </p>
        <Link
          href="/for-organizers"
          className="inline-flex items-center gap-2 bg-purple-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-purple-600 transition text-sm"
        >
          <GraduationCap className="w-4 h-4" /> Are you an instructor? Apply to get listed
        </Link>
      </div>

      {/* Search & filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, city, or state..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:border-hotpink-400 focus:outline-none text-sm"
            />
          </div>
          <select
            value={styleFilter}
            onChange={(e) => setStyleFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white"
          >
            <option value="all">All Game Styles</option>
            <option value="american">American (NMJL)</option>
            <option value="chinese">Chinese</option>
            <option value="riichi">Riichi / Japanese</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white"
          >
            <option value="all">All Lesson Types</option>
            <option value="private">Private Lessons</option>
            <option value="group">Group Classes</option>
            <option value="corporate">Corporate Events</option>
            <option value="kids">Kids / Youth</option>
            <option value="online">Online</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-hotpink-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No instructors found matching your search.</p>
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-hotpink-500 mt-2 text-sm font-medium">
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Featured - visible to everyone */}
          {featuredInstructors.length > 0 && (
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featuredInstructors.map((instructor) => (
                  <InstructorCard key={instructor.id} instructor={instructor} />
                ))}
              </div>
            </div>
          )}

          {/* Verified + Unverified - subscribers only; cards still clickable so people can view individual profiles */}
          {!showFullDirectory && (verifiedInstructors.length > 0 || otherInstructors.length > 0) && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50 blur-[2px]">
                {[...verifiedInstructors, ...otherInstructors].slice(0, 4).map((instructor) => (
                  <InstructorCard key={instructor.id} instructor={instructor} />
                ))}
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 text-center">
                <Lock className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 mb-0.5">
                  {verifiedInstructors.length + otherInstructors.length}+ instructor{verifiedInstructors.length + otherInstructors.length !== 1 ? "s" : ""} in the full directory
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  Subscribe to browse. Already know who you&apos;re looking for? Click their card above to view their profile.
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 bg-hotpink-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-hotpink-600 transition text-sm"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Full directory for subscribers (verified + unverified) */}
          {showFullDirectory && (verifiedInstructors.length > 0 || otherInstructors.length > 0) && (
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...verifiedInstructors, ...otherInstructors].map((instructor) => (
                  <InstructorCard key={instructor.id} instructor={instructor} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}

function InstructorCard({ instructor }: { instructor: Instructor }) {
  const details = instructor.instructorDetails;
  const bio = cleanBio(instructor.bio);
  const location = instructor.cities.length > 0
    ? instructor.cities.slice(0, 2).join(", ")
    : details?.serviceArea || "";

  const hasContact = instructor.website || instructor.contactEmail || instructor.instagram;

  // Three tiers: featured (paid), verified (free with account), unverified (listed by admin)
  const isFeatured = instructor.featured;
  const isVerified = instructor.hasUser || instructor.verified;
  const borderClass = isFeatured
    ? "border-amber-300 bg-amber-50/30"
    : isVerified
    ? "border-slate-200 bg-white"
    : "border-slate-100 bg-slate-50/50";

  return (
    <div className={`border rounded-xl overflow-hidden hover:shadow-sm transition ${borderClass}`}>
      {/* Featured banner */}
      {isFeatured && (
        <div className="bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-1 flex items-center gap-1.5">
          <Star className="w-3 h-3 fill-white text-white" />
          <span className="text-white text-xs font-bold">Featured & Verified Instructor</span>
        </div>
      )}
      {/* Card content - clickable to profile */}
      <Link href={`/organizer/${instructor.slug}`} className="block p-4">
        <div className="flex gap-3">
          {/* Avatar / placeholder */}
          <div className="flex-shrink-0 relative">
            {instructor.photoURL ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={instructor.photoURL}
                alt={instructor.organizerName}
                className={`w-14 h-14 rounded-full object-cover border-2 ${isFeatured ? "border-amber-300" : "border-purple-100"}`}
              />
            ) : (
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isFeatured ? "bg-amber-100" : "bg-purple-100"}`}>
                <GraduationCap className={`w-6 h-6 ${isFeatured ? "text-amber-500" : "text-purple-400"}`} />
              </div>
            )}
            {(isVerified || isFeatured) && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full p-0.5" title="Verified account">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-800">{instructor.organizerName}</h3>
              {(isVerified || isFeatured) && (
                <span className="text-green-600 text-[10px] font-semibold flex items-center gap-0.5">
                  Verified
                </span>
              )}
            </div>

            {location && (
              <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{location}</span>
              </p>
            )}

            {details?.certifications && (
              <p className="text-xs text-purple-600 font-medium mt-1">{details.certifications}</p>
            )}
          </div>
        </div>

        {/* Tags */}
        {details && (details.teachingStyles?.length > 0 || details.gameStylesTaught?.length > 0) && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {details.teachingStyles?.map((style) => (
              <span key={style} className="bg-purple-50 text-purple-700 text-[11px] font-medium px-2 py-0.5 rounded-full border border-purple-200">
                {TEACHING_STYLE_LABELS[style] || style}
              </span>
            ))}
            {details.gameStylesTaught?.map((style) => (
              <span key={style} className="bg-skyblue-50 text-skyblue-700 text-[11px] font-medium px-2 py-0.5 rounded-full border border-skyblue-200">
                {GAME_STYLE_LABELS[style] || style}
              </span>
            ))}
          </div>
        )}

        {/* Bio */}
        {bio && (
          <p className="text-sm text-slate-600 mt-3 line-clamp-2">{bio}</p>
        )}

        {/* Listing count */}
        {instructor.listingCount > 0 && (
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <Users className="w-3 h-3" /> {instructor.listingCount} event{instructor.listingCount !== 1 ? "s" : ""} listed
          </p>
        )}
      </Link>

      {/* Action footer */}
      <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50 flex items-center justify-between">
        <div>
          {!instructor.hasUser && (
            <Link
              href="/for-organizers"
              className="text-[11px] text-purple-500 hover:text-purple-600 font-medium"
            >
              Is this you? Claim your profile
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          {instructor.website && (
            <a
              href={instructor.website.startsWith("http") ? instructor.website : `https://${instructor.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-purple-500 hover:text-purple-600 font-medium flex items-center gap-1"
            >
              <Globe className="w-3 h-3" /> Website
            </a>
          )}
          {instructor.contactEmail && (
            <a
              href={`mailto:${instructor.contactEmail}?subject=Mahjong Lesson Inquiry`}
              className="text-xs text-purple-500 hover:text-purple-600 font-medium flex items-center gap-1"
            >
              <Mail className="w-3 h-3" /> Email
            </a>
          )}
          {!instructor.website && !instructor.contactEmail && instructor.instagram && (
            <a
              href={`https://instagram.com/${instructor.instagram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-purple-500 hover:text-purple-600 font-medium"
            >
              @{instructor.instagram.replace("@", "")}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
