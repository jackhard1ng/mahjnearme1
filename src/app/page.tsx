import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import { mockGames } from "@/lib/mock-data";
import { FEATURED_CITIES } from "@/lib/constants";
import { Search, MapPin, Sparkles, Globe, ShieldCheck, Bell, ArrowRight, Star, CreditCard } from "lucide-react";

function getStats() {
  const activeGames = mockGames.filter((g) => g.status === "active");
  const cities = new Set(activeGames.map((g) => g.city));
  return { gameCount: activeGames.length, cityCount: cities.size };
}

const stats = getStats();

export default function HomePage() {
  const cities = [
    "New York", "Nashville", "Dallas", "Tulsa", "Denver", "Miami",
    "Phoenix", "Chicago", "Los Angeles", "Seattle", "Atlanta", "Boston",
    "San Francisco", "Portland", "Austin", "San Diego", "Philadelphia",
    "Houston", "Minneapolis", "Tampa",
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden mahj-hero-gradient">
        {/* Floating tile decorations */}
        <div className="absolute top-10 left-[10%] text-5xl opacity-10 animate-float select-none" aria-hidden="true">🀇</div>
        <div className="absolute top-24 right-[15%] text-4xl opacity-10 animate-float select-none" style={{ animationDelay: "1s" }} aria-hidden="true">🀙</div>
        <div className="absolute bottom-12 left-[20%] text-3xl opacity-10 animate-float select-none" style={{ animationDelay: "2s" }} aria-hidden="true">🀀</div>
        <div className="absolute bottom-20 right-[25%] text-4xl opacity-10 animate-float select-none" style={{ animationDelay: "0.5s" }} aria-hidden="true">🀄</div>

        <div className="max-w-5xl mx-auto px-4 pt-16 pb-12 sm:pt-24 sm:pb-16 text-center relative">
          {/* Mahjong tile accent above title */}
          <div className="flex justify-center gap-2 mb-6">
            <span className="text-3xl opacity-60 animate-float" style={{ animationDelay: "0s" }}>🀇</span>
            <span className="text-3xl opacity-60 animate-float" style={{ animationDelay: "0.3s" }}>🀄</span>
            <span className="text-3xl opacity-60 animate-float" style={{ animationDelay: "0.6s" }}>🀙</span>
          </div>
          <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-4xl sm:text-5xl lg:text-6xl text-slate-900 mb-4 tracking-tight">
            Find Mahjong Games<br />
            <span className="bg-gradient-to-r from-jade-600 via-jade-500 to-gold-500 bg-clip-text text-transparent">Anywhere You Go</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-500 mb-8 max-w-2xl mx-auto">
            The only directory of pickup mahjong games, open play sessions, lessons, and events across the United States
          </p>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto mb-6">
            <SearchBar size="large" />
          </div>

          {/* Live Counter */}
          <p className="text-sm text-slate-400">
            <span className="font-semibold text-jade-600">{stats.gameCount} games</span> across{" "}
            <span className="font-semibold text-jade-600">{stats.cityCount} cities</span> and counting
          </p>
        </div>
      </section>

      {/* City Marquee */}
      <section className="py-6 border-y border-ivory-300 overflow-hidden bg-ivory-100">
        <div className="relative">
          <div className="animate-scroll-left whitespace-nowrap flex">
            {[...cities, ...cities].map((city, i) => (
              <Link
                key={i}
                href={`/search?q=${encodeURIComponent(city)}`}
                className="inline-flex items-center px-6 text-slate-500 hover:text-jade-600 transition-colors text-sm font-medium"
              >
                <span className="w-1.5 h-1.5 bg-jade-400 rounded-full mr-3" />
                {city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 section-warm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mahj-divider mb-12">
            <span className="text-2xl">🀄</span>
          </div>
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-center text-slate-900 mb-12">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-jade-100 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-jade-200">
                <Search className="w-7 h-7 text-jade-600" />
              </div>
              <div className="text-xs font-bold text-jade-600 uppercase tracking-wider mb-2">Step 1</div>
              <h3 className="font-semibold text-lg mb-2">Search your city</h3>
              <p className="text-sm text-slate-500">
                Type any city, zip code, or travel destination — or just tap &ldquo;Use My Location&rdquo;
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-mahj-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-mahj-red-200">
                <MapPin className="w-7 h-7 text-mahj-red-500" />
              </div>
              <div className="text-xs font-bold text-mahj-red-500 uppercase tracking-wider mb-2">Step 2</div>
              <h3 className="font-semibold text-lg mb-2">Browse games nearby</h3>
              <p className="text-sm text-slate-500">
                See open play, lessons, leagues, and events on an interactive map — with all the details you need
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gold-100 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-gold-200">
                <Sparkles className="w-7 h-7 text-gold-500" />
              </div>
              <div className="text-xs font-bold text-gold-500 uppercase tracking-wider mb-2">Step 3</div>
              <h3 className="font-semibold text-lg mb-2">Show up and play!</h3>
              <p className="text-sm text-slate-500">
                Get the venue, schedule, contact info, and directions — then go enjoy a game
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 sm:py-20 section-jade">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="mahj-tile p-6">
              <Globe className="w-8 h-8 text-jade-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Games everywhere</h3>
              <p className="text-sm text-slate-500">
                Traveling and want to play? Search any city in the US and find games near your hotel, Airbnb, or destination.
              </p>
            </div>
            <div className="mahj-tile p-6">
              <ShieldCheck className="w-8 h-8 text-jade-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Verified weekly</h3>
              <p className="text-sm text-slate-500">
                Every listing verified weekly — no outdated info, no dead links, no guessing if a game still meets.
              </p>
            </div>
            <div className="mahj-tile p-6">
              <Bell className="w-8 h-8 text-jade-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Never miss a game</h3>
              <p className="text-sm text-slate-500">
                Get alerts when new groups are posted near you. Save your favorite cities and games for quick access.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Story */}
      <section className="py-16 sm:py-20 section-warm">
        <div className="max-w-3xl mx-auto px-4">
          <div className="mahj-tile p-8 sm:p-10 bg-gradient-to-br from-ivory-50 via-jade-50 to-ivory-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-jade-200 rounded-full flex items-center justify-center shrink-0 border-2 border-jade-300">
                <span className="text-2xl font-bold text-jade-800">J</span>
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-heading)] font-bold text-xl text-slate-900">Why we built this</h3>
              </div>
            </div>
            <blockquote className="text-slate-600 leading-relaxed mb-4">
              &ldquo;My mom plays mahjong everywhere we go. On a trip to Nashville, she spent hours searching Facebook groups, Googling different spellings of &lsquo;mahjongg,&rsquo; and DMing strangers on Instagram — just to find a game. We thought, there has to be a better way. So we built one.&rdquo;
            </blockquote>
            <p className="font-semibold text-slate-700">
              — Jack, Founder of MahjNearMe
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-20 section-gold">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mahj-divider mb-6">
            <span className="text-2xl">🀙</span>
          </div>
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-center text-slate-900 mb-12">
            What Players Are Saying
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: "Linda M.", city: "Tulsa, OK", text: "I was traveling to Denver and found 3 games within walking distance of my hotel. This is a game-changer for traveling mahj players!", rating: 5 },
              { name: "Carol S.", city: "Nashville, TN", text: "Finally! A single place to find all the mahjong groups in my area. No more scrolling through endless Facebook posts.", rating: 5 },
              { name: "Barbara T.", city: "Miami, FL", text: "As a snowbird, I play in Miami in winter and Boston in summer. MahjNearMe makes it easy to find games in both cities.", rating: 5 },
            ].map((testimonial, i) => (
              <div key={i} className="mahj-tile p-6">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-gold-400 text-gold-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 mb-4">&ldquo;{testimonial.text}&rdquo;</p>
                <div className="text-sm">
                  <p className="font-semibold text-slate-700">{testimonial.name}</p>
                  <p className="text-slate-400">{testimonial.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 section-warm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Organizer CTA */}
            <div className="rounded-2xl bg-gradient-to-br from-mahj-red-50 via-coral-50 to-ivory-100 p-8 border border-mahj-red-200 text-center">
              <div className="text-3xl mb-3">🀄</div>
              <h3 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-slate-900 mb-3">
                Are you a mahjong organizer?
              </h3>
              <p className="text-slate-500 mb-6">
                List your group for free and reach players across the country.
              </p>
              <Link
                href="/add-your-group"
                className="inline-flex items-center gap-2 bg-mahj-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-mahj-red-600 transition-colors"
              >
                List Your Group <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Player CTA */}
            <div className="rounded-2xl bg-gradient-to-br from-jade-50 via-gold-50 to-ivory-100 p-8 border border-jade-200 text-center">
              <div className="text-3xl mb-3">🀇</div>
              <h3 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-slate-900 mb-3">
                Ready to find your next game?
              </h3>
              <p className="text-slate-500 mb-3">
                Full access for 14 days. Credit card required — cancel anytime.
              </p>
              <div className="flex items-center justify-center gap-1 text-xs text-slate-400 mb-4">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Secure payment via Stripe</span>
              </div>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-jade-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-jade-700 transition-colors"
              >
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Shop Teaser */}
          <div className="text-center mt-10">
            <Link href="/shop" className="text-jade-600 hover:text-jade-700 font-medium transition-colors inline-flex items-center gap-2">
              New to Mahj? Check out our gear picks <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
