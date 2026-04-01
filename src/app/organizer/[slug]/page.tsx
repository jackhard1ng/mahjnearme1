import { Metadata } from "next";
import { getAdminDb } from "@/lib/firebase-admin";
import { Game } from "@/types";
import {
  MapPin,
  Globe,
  Mail,
  Calendar,
  Star,
  GraduationCap,
  ExternalLink,
  ArrowRight,
  Users,
} from "lucide-react";
import Link from "next/link";

interface OrganizerPageProps {
  params: Promise<{ slug: string }>;
}

/** Normalize a string to a clean URL slug */
function toSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/(^-|-$)/g, "");
}

/** Clean emoji and special chars from display text */
function cleanText(s: string): string {
  if (!s) return "";
  return s
    .replace(/[\u{1F300}-\u{1FAD6}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, "")
    .replace(/\|/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function getOrganizerBySlug(slug: string) {
  const db = getAdminDb();
  const normalized = toSlug(slug);
  const lowered = slug.toLowerCase();

  // Try multiple lookup strategies
  const queries = [
    // 1. Exact slug
    () => db.collection("organizers").where("slug", "==", normalized).limit(1).get(),
    // 2. Lowercased slug
    () => db.collection("organizers").where("slug", "==", lowered).limit(1).get(),
    // 3. Original slug as-is
    () => db.collection("organizers").where("slug", "==", slug).limit(1).get(),
    // 4. nameKey with spaces
    () => db.collection("organizers").where("nameKey", "==", slug.replace(/-/g, " ").toLowerCase().trim()).limit(1).get(),
    // 5. nameKey with dashes
    () => db.collection("organizers").where("nameKey", "==", normalized).limit(1).get(),
  ];

  for (const query of queries) {
    try {
      const snap = await query();
      if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() } as Record<string, unknown> & { id: string };
    } catch { /* continue */ }
  }

  // 6. Try Instagram handle variants
  const igVariants = new Set([
    normalized,
    lowered,
    normalized.replace(/-/g, "."),
    lowered.replace(/-/g, "."),
    `@${normalized}`,
    `@${lowered}`,
    `@${normalized.replace(/-/g, ".")}`,
    `@${lowered.replace(/-/g, ".")}`,
  ]);
  for (const ig of igVariants) {
    try {
      const snap = await db.collection("organizers").where("instagram", "==", ig).limit(1).get();
      if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() } as Record<string, unknown> & { id: string };
    } catch { /* continue */ }
  }

  // 7. Try by Firestore document ID
  try {
    const docSnap = await db.collection("organizers").doc(slug).get();
    if (docSnap.exists) return { id: docSnap.id, ...docSnap.data() } as Record<string, unknown> & { id: string };
  } catch { /* not a valid doc ID */ }

  // 8. Try organizerName match (last resort)
  try {
    const nameToMatch = slug.replace(/-/g, " ").toLowerCase().trim();
    const allSnap = await db.collection("organizers").get();
    for (const doc of allSnap.docs) {
      const data = doc.data();
      const orgName = ((data.organizerName as string) || "").toLowerCase();
      const orgSlug = ((data.slug as string) || "").toLowerCase();
      const orgNameKey = ((data.nameKey as string) || "").toLowerCase();
      if (orgName.includes(nameToMatch) || orgSlug.includes(normalized) || orgNameKey.includes(normalized)) {
        return { id: doc.id, ...data } as Record<string, unknown> & { id: string };
      }
    }
  } catch { /* continue */ }

  return null;
}

async function getOrganizerListings(organizer: Record<string, unknown>): Promise<Game[]> {
  const listingIds = (organizer.listingIds as string[]) || [];
  const orgName = (organizer.organizerName as string) || "";
  const nameKey = (organizer.nameKey as string) || "";

  // Try Firestore first
  if (listingIds.length > 0) {
    try {
      const db = getAdminDb();
      const listings: Game[] = [];
      for (let i = 0; i < listingIds.length; i += 30) {
        const batch = listingIds.slice(i, i + 30);
        const snap = await db.collection("listings").where("__name__", "in", batch).get();
        for (const doc of snap.docs) {
          const data = doc.data();
          if (data.status === "active") {
            listings.push({ id: doc.id, ...data } as unknown as Game);
          }
        }
      }
      if (listings.length > 0) return listings;
    } catch { /* fall through */ }
  }

  // Fallback: match from static JSON by organizer/contact name
  try {
    const { loadListings } = require("@/lib/listings-data");
    const allGames: Game[] = loadListings();
    return allGames.filter((g) => {
      const cn = (g.contactName || "").toLowerCase().trim();
      const on = (g.organizerName || "").toLowerCase().trim();
      return cn === nameKey || on === nameKey || cn === orgName.toLowerCase() || on === orgName.toLowerCase();
    });
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: OrganizerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const organizer = await getOrganizerBySlug(slug);

  if (!organizer) {
    return { title: "Organizer Not Found | MahjNearMe" };
  }

  const name = organizer.organizerName as string;
  const cities = (organizer.cities as string[]) || [];
  const isInstructor = organizer.isInstructor as boolean;
  const metaStates = (organizer.states as string[]) || [];
  const metaStateAbbr = metaStates.length > 0 ? metaStates[0] : "";
  const cityText = cities.length > 0 ? ` in ${cities.slice(0, 2).join(", ")}${metaStateAbbr ? `, ${metaStateAbbr}` : ""}` : "";
  const role = isInstructor ? "Mahjong Instructor" : "Mahjong Organizer";

  return {
    title: `${name} | ${role}${cityText} | MahjNearMe`,
    description: `${name} hosts mahjong games${cityText}. View their profile, schedule, and contact info on MahjNearMe.`,
  };
}

export default async function OrganizerProfilePage({ params }: OrganizerPageProps) {
  const { slug } = await params;
  const organizer = await getOrganizerBySlug(slug);

  if (!organizer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Organizer Not Found</h1>
        <p className="text-slate-600 mb-6">This organizer profile doesn&apos;t exist or the link may have changed.</p>
        <Link href="/search" className="text-hotpink-500 hover:text-hotpink-600 font-medium">
          Search for Games
        </Link>
      </div>
    );
  }

  const name = organizer.organizerName as string;
  const personalName = organizer.personalName as string;
  const bio = organizer.bio as string;
  const email = organizer.contactEmail as string;
  const website = organizer.website as string;
  const instagram = organizer.instagram as string;
  const facebookGroup = organizer.facebookGroup as string;
  const photoURL = organizer.photoURL as string | null;
  const photos = (organizer.photos as string[]) || [];
  const featured = organizer.featured as boolean;
  const isInstructor = organizer.isInstructor as boolean;
  const instructorDetails = organizer.instructorDetails as {
    teachingStyles?: string[];
    certifications?: string;
    serviceArea?: string;
    gameStylesTaught?: string[];
  } | null;
  const cities = (organizer.cities as string[]) || [];
  const states = (organizer.states as string[]) || [];

  // Build location display: "Tulsa, OK" or "Tulsa, Claremore, OK"
  const stateAbbr = states.length > 0 ? states[0] : "";
  const locationText = cities.length > 0
    ? `${cities.slice(0, 3).join(", ")}${stateAbbr ? `, ${stateAbbr}` : ""}`
    : stateAbbr || "";

  const listings = await getOrganizerListings(organizer);
  const storedListingCount = (organizer.listingCount as number) || 0;
  const displayEventCount = listings.length > 0 ? listings.length : storedListingCount;

  const primaryCity = cities[0] || "";
  const searchLink = primaryCity
    ? `/search?q=${encodeURIComponent(primaryCity)}`
    : "/search";

  // JSON-LD structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": isInstructor ? "LocalBusiness" : "Organization",
    name,
    ...(personalName && personalName !== name ? { alternateName: personalName } : {}),
    description: cleanText(bio) || `${name} hosts mahjong games${locationText ? ` in ${locationText}` : ""}.`,
    ...(website ? { url: website.startsWith("http") ? website : `https://${website}` } : {}),
    ...(email ? { email } : {}),
    ...(photoURL ? { image: photoURL } : {}),
    ...(locationText ? {
      address: {
        "@type": "PostalAddress",
        addressLocality: cities[0] || "",
        addressRegion: stateAbbr || "",
        addressCountry: "US",
      },
    } : {}),
    ...(isInstructor ? {
      "@type": "LocalBusiness",
      priceRange: "$$",
      additionalType: "https://schema.org/EducationalOrganization",
      knowsAbout: ["Mahjong", "American Mahjong", "Mahjong lessons"],
      ...(instructorDetails?.serviceArea ? { areaServed: cleanText(instructorDetails.serviceArea) } : {}),
    } : {}),
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* SEO structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Profile Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {photoURL ? (
            <div className="flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoURL} alt={name} className="w-24 h-24 rounded-full object-cover border-2 border-slate-200" />
            </div>
          ) : (
            <div className="flex-shrink-0 w-24 h-24 rounded-full bg-hotpink-100 flex items-center justify-center">
              <GraduationCap className="w-10 h-10 text-hotpink-400" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{name}</h1>
              {personalName && personalName !== name && (
                <span className="text-slate-500 text-sm font-normal">by {personalName}</span>
              )}
              {featured && (
                <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-500" /> Featured
                </span>
              )}
              {isInstructor && (
                <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" /> Instructor
                </span>
              )}
            </div>

            {locationText && (
              <p className="text-slate-500 flex items-center gap-1 mb-3">
                <MapPin className="w-4 h-4" />
                {locationText}
              </p>
            )}

            {bio && <p className="text-slate-600 mb-4">{cleanText(bio)}</p>}

            <div className="flex flex-wrap gap-3">
              {website && (
                <a href={website.startsWith("http") ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-hotpink-500 hover:text-hotpink-600 font-medium">
                  <Globe className="w-4 h-4" /> Website
                </a>
              )}
              {instagram && (
                <a href={instagram.startsWith("http") ? instagram : `https://instagram.com/${instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-hotpink-500 hover:text-hotpink-600 font-medium">
                  Instagram
                </a>
              )}
              {facebookGroup && (
                <a href={facebookGroup.startsWith("http") ? facebookGroup : `https://facebook.com/groups/${facebookGroup}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-hotpink-500 hover:text-hotpink-600 font-medium">
                  Facebook
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 text-sm text-hotpink-500 hover:text-hotpink-600 font-medium">
                  <Mail className="w-4 h-4" /> Contact
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Instructor booking CTA */}
      {isInstructor && (
        <div className="bg-gradient-to-r from-purple-500 to-hotpink-500 rounded-xl p-5 mb-6 text-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-lg flex items-center gap-2">
                <GraduationCap className="w-5 h-5" /> Book a Mahjong Lesson
              </h2>
              <p className="text-white/80 text-sm mt-1">
                {name} offers mahjong lessons{instructorDetails?.serviceArea ? ` in ${cleanText(instructorDetails.serviceArea)}` : ""}.
                {instructorDetails?.teachingStyles?.length ? ` Available for ${instructorDetails.teachingStyles.join(", ")} lessons.` : ""}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {website && (
                <a href={website.startsWith("http") ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-white text-purple-700 px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-purple-50 transition">
                  <Globe className="w-4 h-4" /> Book Online
                </a>
              )}
              {email && (
                <a href={`mailto:${email}?subject=Mahjong Lesson Inquiry`} className="inline-flex items-center gap-1.5 bg-white/20 text-white border border-white/30 px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-white/30 transition">
                  <Mail className="w-4 h-4" /> Email
                </a>
              )}
              {!website && !email && instagram && (
                <a href={instagram.startsWith("http") ? instagram : `https://instagram.com/${instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-white text-purple-700 px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-purple-50 transition">
                  DM on Instagram
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructor details */}
      {isInstructor && instructorDetails && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-purple-800 flex items-center gap-2 mb-3">
            <GraduationCap className="w-5 h-5" /> Instructor Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {instructorDetails.teachingStyles && instructorDetails.teachingStyles.length > 0 && (
              <div><span className="font-medium text-purple-700">Lesson Types: </span><span className="text-purple-600">{instructorDetails.teachingStyles.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", ")}</span></div>
            )}
            {instructorDetails.gameStylesTaught && instructorDetails.gameStylesTaught.length > 0 && (
              <div><span className="font-medium text-purple-700">Styles Taught: </span><span className="text-purple-600">{instructorDetails.gameStylesTaught.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", ")}</span></div>
            )}
            {instructorDetails.certifications && (
              <div><span className="font-medium text-purple-700">Certifications: </span><span className="text-purple-600">{cleanText(instructorDetails.certifications)}</span></div>
            )}
            {instructorDetails.serviceArea && (
              <div><span className="font-medium text-purple-700">Service Area: </span><span className="text-purple-600">{cleanText(instructorDetails.serviceArea)}</span></div>
            )}
          </div>
        </div>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Photos</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {photos.map((url, i) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img key={i} src={url} alt={`${name} photo ${i + 1}`} className="w-48 h-32 rounded-lg object-cover flex-shrink-0" />
            ))}
          </div>
        </div>
      )}

      {/* Events */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Games & Events ({displayEventCount})
          </h2>
          {listings.length > 0 && (
            <Link href={searchLink} className="text-sm text-hotpink-500 hover:text-hotpink-600 font-medium flex items-center gap-1">
              See all in search <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            {storedListingCount > 0 ? (
              <>
                <p className="text-slate-500 mb-3">This organizer has {storedListingCount} event{storedListingCount !== 1 ? "s" : ""} on MahjNearMe.</p>
                <Link href={searchLink} className="inline-flex items-center gap-1 bg-hotpink-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-hotpink-600 transition text-sm">
                  View events in search <ArrowRight className="w-3 h-3" />
                </Link>
              </>
            ) : (
              <>
                <p className="text-slate-400 mb-2">No events listed yet.</p>
                <p className="text-slate-400 text-sm">Check back soon or contact this organizer directly.</p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              {listings.slice(0, 5).map((game) => (
                <Link key={game.id} href={`/games/${game.state?.toLowerCase()}/${encodeURIComponent(game.city?.toLowerCase().replace(/\s+/g, "-"))}/${game.id}`} className="block border border-slate-100 rounded-lg p-3 hover:border-hotpink-200 transition">
                  <h3 className="font-medium text-slate-800 text-sm">{game.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{game.city}, {game.state}</span>
                    {game.venueName && <span>{game.venueName}</span>}
                    {game.recurringSchedule && (
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{game.recurringSchedule.dayOfWeek} {game.recurringSchedule.startTime && `at ${game.recurringSchedule.startTime}`}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            {listings.length > 5 && <p className="text-center text-sm text-slate-400 mb-4">Showing 5 of {listings.length} events</p>}
            <Link href={searchLink} className="block w-full text-center bg-hotpink-500 text-white py-3 rounded-lg font-semibold hover:bg-hotpink-600 transition">
              See all events from {name} <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
