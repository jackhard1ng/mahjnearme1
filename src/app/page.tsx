import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import { mockGames } from "@/lib/mock-data";
import { isEventExpired } from "@/lib/utils";
import { FEATURED_TILES } from "@/lib/featured-tiles";
import { Search, MapPin, Sparkles, ArrowRight } from "lucide-react";
import GamesToday from "@/components/GamesToday";
import SeasonalEvents from "@/components/SeasonalEvents";

async function getLiveGameCount(): Promise<number> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.mahjnearme.com";
    const res = await fetch(`${baseUrl}/api/listings`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = await res.json();
      const now = new Date();
      return (data.listings || []).filter((g: { status: string; isRecurring: boolean; eventDate: string | null }) => {
        if (g.status !== "active") return false;
        if (!g.isRecurring && g.eventDate) {
          return new Date(g.eventDate + "T23:59:59") >= now;
        }
        return true;
      }).length;
    }
  } catch {
    // fall through to mock count
  }
  return mockGames.filter((g) => g.status === "active" && !isEventExpired(g)).length;
}

function getStats() {
  const activeGames = mockGames.filter((g) => g.status === "active" && !isEventExpired(g));
  const states = new Set(activeGames.map((g) => g.state));
  return { gameCount: activeGames.length, stateCount: states.size };
}

/** Count games per city from the live data. */
function getCityCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const g of mockGames) {
    if (g.status !== "active" || isEventExpired(g)) continue;
    const key = `${g.city}|${g.state}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

const cityCounts = getCityCounts();

/** Build the marquee tile data with live counts. */
const tilesWithCounts = FEATURED_TILES.map((t) => {
  const key = `${t.city}|${t.state}`;
  return { ...t, count: cityCounts[key] || 0 };
}).filter((t) => t.count > 0);

export default async function HomePage() {
  const liveGameCount = await getLiveGameCount();

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/c2d2c03301c201e23fd4816059b397c4.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF1493]/85 via-[#FF69B4]/75 to-[#87CEEB]/80" />
        </div>

        <div className="max-w-5xl mx-auto px-4 pt-10 pb-6 sm:pt-24 sm:pb-16 text-center relative">
          <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-3xl sm:text-5xl lg:text-6xl text-white mb-2 sm:mb-4 tracking-tight drop-shadow-lg">
            Find Mahjong Games<br />
            <span className="text-skyblue-200">Anywhere You Go</span>
          </h1>
          <p className="text-sm sm:text-xl text-white/80 mb-4 sm:mb-8 max-w-2xl mx-auto">
            The only directory of pickup mahjong games, open play sessions, lessons, and events across the United States
          </p>

          <div className="max-w-3xl mx-auto mb-4 sm:mb-6">
            <SearchBar size="large" />
          </div>

          <p className="text-xs sm:text-sm text-white/70">
            <span className="font-semibold text-white">{Math.floor(liveGameCount / 100) * 100}+ games</span> across{" "}
            <span className="font-semibold text-white">all 50 states</span>
          </p>
        </div>
      </section>

      {/* City Marquee */}
      <section className="py-5 border-y border-skyblue-200 overflow-hidden bg-skyblue-50">
        <div className="relative">
          <div className="animate-scroll-left whitespace-nowrap flex items-center">
            {[...tilesWithCounts, ...tilesWithCounts, ...tilesWithCounts].map((t, i) => (
              <Link
                key={i}
                href={`/search?q=${encodeURIComponent(t.searchQuery)}`}
                className="inline-flex items-center px-6 text-charcoal hover:text-hotpink-500 transition-colors text-sm font-medium shrink-0 group"
              >
                {t.tile ? (
                  <span className="inline-flex items-center justify-center w-10 h-10 mr-3 shrink-0" style={{ perspective: "200px" }}>
                    <img
                      src={t.tile}
                      alt={`${t.city} tile`}
                      loading="lazy"
                      className="max-h-10 max-w-10 w-auto h-auto animate-tile-rotate drop-shadow-md group-hover:pause object-contain"
                      style={{ animationDelay: `${(i % 12) * 0.35}s` }}
                    />
                  </span>
                ) : (
                  <span className="w-2 h-2 bg-hotpink-400 rounded-full mr-3" />
                )}
                {t.city}, {t.state}
                <span className="ml-2 text-xs text-hotpink-500 font-bold">{t.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Games Near You */}
      <GamesToday />

      {/* Seasonal Events (themed or upcoming fallback) */}
      <SeasonalEvents />

      {/* How It Works */}
      <section className="py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/40a8a8ed77d5469f174ff66a88f95aa5.jpg" alt="" className="w-full h-full object-cover opacity-[0.08]" loading="lazy" />
          <div className="absolute inset-0 bg-[#FFF0F5]/92" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="mahj-divider mb-12">
            <span className="text-2xl">🀄</span>
          </div>
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-center text-charcoal mb-12">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-hotpink-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                <Search className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-charcoal">Search your city</h3>
              <p className="text-sm text-slate-600">
                Type any city, zip code, or travel destination
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-skyblue-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-charcoal">Browse games nearby</h3>
              <p className="text-sm text-slate-600">
                See open play, lessons, leagues, and events on an interactive map
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-hotpink-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-charcoal">Show up and play</h3>
              <p className="text-sm text-slate-600">
                Get the details you need and go play
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-10 sm:py-12 section-blue">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌎</span>
              <span className="text-sm font-medium text-charcoal">Games in every state</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-slate-200" />
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <span className="text-sm font-medium text-charcoal">Researched &amp; curated</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-slate-200" />
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔄</span>
              <span className="text-sm font-medium text-charcoal">New games added from Instagram, meetups, and community centers weekly</span>
            </div>
          </div>
        </div>
      </section>

      {/* Giveaway Banner */}
      <section className="py-10 section-warm">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-gradient-to-r from-hotpink-50 to-skyblue-50 border border-hotpink-200 rounded-xl p-6 sm:p-8 text-center">
            <div className="text-3xl mb-3">🎁</div>
            <p className="font-[family-name:var(--font-heading)] font-bold text-lg text-charcoal mb-2">
              Every month we give away a mahjong prize to one lucky member. Sets, mats, accessories, and more.
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Paid subscribers are automatically entered. Annual members get 2x entries.
            </p>
            <Link
              href="/giveaways"
              className="inline-flex items-center gap-2 text-hotpink-500 font-semibold text-sm hover:text-hotpink-600"
            >
              Learn more about the giveaway <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/8f52f44ed05054e40828936a96d15b75.jpg" alt="" className="w-full h-full object-cover opacity-[0.10]" loading="lazy" />
          <div className="absolute inset-0 bg-[#FFF0F5]/90" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="card-white p-8 text-center">
              <div className="text-3xl mb-3">🀄</div>
              <h3 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-3">
                Don&apos;t see your group?
              </h3>
              <p className="text-slate-600 mb-6">
                Let us know and we&apos;ll add it to the directory for free.
              </p>
              <Link
                href="/add-your-group"
                className="inline-flex items-center gap-2 bg-skyblue-400 text-white px-6 py-3 rounded-xl font-semibold hover:bg-skyblue-500 transition-colors shadow-lg"
              >
                List Your Group <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="card-white p-8 text-center">
              <div className="text-3xl mb-3">🀇</div>
              <h3 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-3">
                Ready to find your next game?
              </h3>
              <p className="text-slate-600 mb-6">
                See all {Math.floor(liveGameCount / 100) * 100}+ games with full details, plus enter our monthly set giveaway.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-hotpink-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors shadow-lg"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            Questions? <Link href="/contact" className="text-hotpink-500 hover:text-hotpink-600 font-medium">Contact us</Link> or DM us on <a href="https://instagram.com/mahjnearme" target="_blank" rel="noopener noreferrer" className="text-hotpink-500 hover:text-hotpink-600 font-medium">Instagram</a>
          </p>
        </div>
      </section>
    </>
  );
}
