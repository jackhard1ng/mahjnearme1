import { Metadata } from "next";
import { getAdminDb } from "@/lib/firebase-admin";
import { Game } from "@/types";
import {
  MapPin,
  Globe,
  Mail,
  Calendar,
  Star,
  Users,
  GraduationCap,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface OrganizerPageProps {
  params: Promise<{ slug: string }>;
}

async function getOrganizerBySlug(slug: string) {
  const db = getAdminDb();
  const snap = await db
    .collection("organizers")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as Record<string, unknown> & { id: string };
}

async function getOrganizerListings(listingIds: string[]): Promise<Game[]> {
  if (!listingIds.length) return [];
  const db = getAdminDb();
  const listings: Game[] = [];

  for (let i = 0; i < listingIds.length; i += 30) {
    const batch = listingIds.slice(i, i + 30);
    const snap = await db
      .collection("listings")
      .where("__name__", "in", batch)
      .get();
    for (const doc of snap.docs) {
      const data = doc.data();
      if (data.status === "active") {
        listings.push({ id: doc.id, ...data } as unknown as Game);
      }
    }
  }

  return listings;
}

export async function generateMetadata({ params }: OrganizerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const organizer = await getOrganizerBySlug(slug);

  if (!organizer) {
    return { title: "Organizer Not Found | MahjNearMe" };
  }

  const name = organizer.organizerName as string;
  const cities = (organizer.cities as string[]) || [];
  const cityText = cities.length > 0 ? ` in ${cities.slice(0, 3).join(", ")}` : "";

  return {
    title: `${name} | Mahjong Organizer${cityText} | MahjNearMe`,
    description: `${name} hosts mahjong games${cityText}. View their schedule, events, and contact info on MahjNearMe.`,
  };
}

export default async function OrganizerProfilePage({ params }: OrganizerPageProps) {
  const { slug } = await params;
  const organizer = await getOrganizerBySlug(slug);

  if (!organizer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Organizer Not Found</h1>
        <p className="text-slate-600 mb-6">This organizer profile doesn&apos;t exist.</p>
        <Link href="/search" className="text-softpink-500 hover:text-softpink-600 font-medium">
          Search for Games
        </Link>
      </div>
    );
  }

  const name = organizer.organizerName as string;
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
  const listingIds = (organizer.listingIds as string[]) || [];

  const listings = await getOrganizerListings(listingIds);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {photoURL && (
          <div className="flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoURL}
              alt={name}
              className="w-24 h-24 rounded-full object-cover border-2 border-slate-200"
            />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-slate-800">{name}</h1>
            {featured && (
              <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-500" /> Featured
              </span>
            )}
            {isInstructor && (
              <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <GraduationCap className="w-3 h-3" /> Instructor
              </span>
            )}
          </div>

          {cities.length > 0 && (
            <p className="text-slate-500 flex items-center gap-1 mb-2">
              <MapPin className="w-4 h-4" />
              {cities.slice(0, 5).join(", ")}
              {cities.length > 5 ? ` +${cities.length - 5} more` : ""}
            </p>
          )}

          {bio && <p className="text-slate-600 mb-3">{bio}</p>}

          <div className="flex flex-wrap gap-3">
            {website && (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-softpink-500 hover:text-softpink-600 flex items-center gap-1"
              >
                <Globe className="w-4 h-4" /> Website
              </a>
            )}
            {instagram && (
              <a
                href={
                  instagram.startsWith("http")
                    ? instagram
                    : `https://instagram.com/${instagram.replace("@", "")}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-softpink-500 hover:text-softpink-600 flex items-center gap-1"
              >
                Instagram
              </a>
            )}
            {facebookGroup && (
              <a
                href={facebookGroup.startsWith("http") ? facebookGroup : `https://facebook.com/groups/${facebookGroup}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-softpink-500 hover:text-softpink-600 flex items-center gap-1"
              >
                Facebook
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="text-sm text-softpink-500 hover:text-softpink-600 flex items-center gap-1"
              >
                <Mail className="w-4 h-4" /> Contact
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Instructor details */}
      {isInstructor && instructorDetails && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-8">
          <h2 className="font-semibold text-purple-800 flex items-center gap-2 mb-3">
            <GraduationCap className="w-5 h-5" /> Mahjong Instructor
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {instructorDetails.teachingStyles && instructorDetails.teachingStyles.length > 0 && (
              <div>
                <span className="font-medium text-purple-700">Lesson Types: </span>
                <span className="text-purple-600">
                  {instructorDetails.teachingStyles
                    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                    .join(", ")}
                </span>
              </div>
            )}
            {instructorDetails.gameStylesTaught && instructorDetails.gameStylesTaught.length > 0 && (
              <div>
                <span className="font-medium text-purple-700">Styles Taught: </span>
                <span className="text-purple-600">
                  {instructorDetails.gameStylesTaught
                    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                    .join(", ")}
                </span>
              </div>
            )}
            {instructorDetails.certifications && (
              <div>
                <span className="font-medium text-purple-700">Certifications: </span>
                <span className="text-purple-600">{instructorDetails.certifications}</span>
              </div>
            )}
            {instructorDetails.serviceArea && (
              <div>
                <span className="font-medium text-purple-700">Service Area: </span>
                <span className="text-purple-600">{instructorDetails.serviceArea}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Photos gallery */}
      {photos.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Photos</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {photos.map((url, i) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={i}
                src={url}
                alt={`${name} photo ${i + 1}`}
                className="w-48 h-32 rounded-lg object-cover flex-shrink-0"
              />
            ))}
          </div>
        </div>
      )}

      {/* Listings */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" /> Games & Events ({listings.length})
        </h2>

        {listings.length === 0 ? (
          <p className="text-slate-400 py-8 text-center">No active listings yet.</p>
        ) : (
          <div className="space-y-3">
            {listings.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.state?.toLowerCase()}/${encodeURIComponent(game.city?.toLowerCase().replace(/\s+/g, "-"))}/${game.id}`}
                className="block border border-slate-200 rounded-lg p-4 hover:border-softpink-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-slate-800">{game.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {game.city}, {game.state}
                      </span>
                      {game.venueName && <span>{game.venueName}</span>}
                      {game.recurringSchedule && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {game.recurringSchedule.dayOfWeek}{" "}
                          {game.recurringSchedule.startTime && `at ${game.recurringSchedule.startTime}`}
                        </span>
                      )}
                      {game.type && (
                        <span className="capitalize bg-slate-100 px-2 py-0.5 rounded text-xs">
                          {game.type.replace("_", " ")}
                        </span>
                      )}
                    </div>
                    {game.description && (
                      <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                        {game.description}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
