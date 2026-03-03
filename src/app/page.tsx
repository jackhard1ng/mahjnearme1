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
      {/* Hero Section - Photo background with gradient overlay */}
      <section className="relative overflow-hidden">
        {/* Background photo */}
        <div className="absolute inset-0">
          <img src="/images/c2d2c03301c201e23fd4816059b397c4.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF1493]/85 via-[#FF69B4]/75 to-[#87CEEB]/80" />
        </div>

        <div className="max-w-5xl mx-auto px-4 pt-16 pb-12 sm:pt-24 sm:pb-16 text-center relative">
          <div className="flex justify-center gap-2 mb-6">
            <span className="text-3xl opacity-70 animate-float" style={{ animationDelay: "0s" }}>🀇</span>
            <span className="text-3xl opacity-70 animate-float" style={{ animationDelay: "0.3s" }}>🀄</span>
            <span className="text-3xl opacity-70 animate-float" style={{ animationDelay: "0.6s" }}>🀙</span>
          </div>
          <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white mb-4 tracking-tight drop-shadow-lg">
            Find Mahjong Games<br />
            <span className="text-skyblue-200">Anywhere You Go</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            The only directory of pickup mahjong games, open play sessions, lessons, and events across the United States
          </p>

          <div className="max-w-3xl mx-auto mb-6">
            <SearchBar size="large" />
          </div>

          <p className="text-sm text-white/70">
            <span className="font-semibold text-white">{stats.gameCount} games</span> across{" "}
            <span className="font-semibold text-white">{stats.cityCount} cities</span> and counting
          </p>
        </div>
      </section>

      {/* City Marquee - soft blue section */}
      <section className="py-6 border-y border-skyblue-200 overflow-hidden bg-skyblue-50">
        <div className="relative">
          <div className="animate-scroll-left whitespace-nowrap flex">
            {[...cities, ...cities].map((city, i) => (
              <Link
                key={i}
                href={`/search?q=${encodeURIComponent(city)}`}
                className="inline-flex items-center px-6 text-charcoal hover:text-hotpink-500 transition-colors text-sm font-medium"
              >
                <span className="w-1.5 h-1.5 bg-hotpink-400 rounded-full mr-3" />
                {city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - soft pink section */}
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
              <div className="text-xs font-bold text-hotpink-500 uppercase tracking-wider mb-2">Step 1</div>
              <h3 className="font-semibold text-lg mb-2 text-charcoal">Search your city</h3>
              <p className="text-sm text-slate-600">
                Type any city, zip code, or travel destination — or just tap &ldquo;Use My Location&rdquo;
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-skyblue-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <div className="text-xs font-bold text-skyblue-500 uppercase tracking-wider mb-2">Step 2</div>
              <h3 className="font-semibold text-lg mb-2 text-charcoal">Browse games nearby</h3>
              <p className="text-sm text-slate-600">
                See open play, lessons, leagues, and events on an interactive map — with all the details you need
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-hotpink-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div className="text-xs font-bold text-hotpink-500 uppercase tracking-wider mb-2">Step 3</div>
              <h3 className="font-semibold text-lg mb-2 text-charcoal">Show up and play!</h3>
              <p className="text-sm text-slate-600">
                Get the venue, schedule, contact info, and directions — then go enjoy a game
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props - soft blue section, white cards */}
      <section className="py-16 sm:py-20 section-blue">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="card-white p-6">
              <Globe className="w-8 h-8 text-hotpink-500 mb-4" />
              <h3 className="font-semibold text-lg mb-2 text-charcoal">Games everywhere</h3>
              <p className="text-sm text-slate-600">
                Traveling and want to play? Search any city in the US and find games near your hotel, Airbnb, or destination.
              </p>
            </div>
            <div className="card-white p-6">
              <ShieldCheck className="w-8 h-8 text-skyblue-500 mb-4" />
              <h3 className="font-semibold text-lg mb-2 text-charcoal">Verified listings</h3>
              <p className="text-sm text-slate-600">
                Every listing is verified — no outdated info, no dead links, no guessing if a game still meets.
              </p>
            </div>
            <div className="card-white p-6">
              <Bell className="w-8 h-8 text-hotpink-500 mb-4" />
              <h3 className="font-semibold text-lg mb-2 text-charcoal">Never miss a game</h3>
              <p className="text-sm text-slate-600">
                Get alerts when new groups are posted near you. Save your favorite cities and games for quick access.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Story - soft pink section */}
      <section className="py-16 sm:py-20 section-pink">
        <div className="max-w-3xl mx-auto px-4">
          <div className="card-white p-8 sm:p-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-hotpink-500 rounded-full flex items-center justify-center shrink-0 shadow-lg">
                <span className="text-2xl font-bold text-white">J</span>
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-heading)] font-bold text-xl text-charcoal">Why we built this</h3>
              </div>
            </div>
            <blockquote className="text-slate-600 leading-relaxed mb-4">
              &ldquo;My mom plays mahjong everywhere we go. On a trip to Nashville, she spent hours searching Facebook groups, Googling different spellings of &lsquo;mahjongg,&rsquo; and DMing strangers on Instagram — just to find a game. We thought, there has to be a better way. So we built one.&rdquo;
            </blockquote>
            <p className="font-semibold text-charcoal">
              — Jack, Founder of MahjNearMe
            </p>
            <div className="mt-6 rounded-2xl overflow-hidden shadow-lg" style={{ boxShadow: '0 8px 24px rgba(255,20,147,0.15)' }}>
              <img src="/images/40a8a8ed77d5469f174ff66a88f95aa5.jpg" alt="Mahjong game night" className="w-full h-48 object-cover" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - soft blue section */}
      <section className="py-16 sm:py-20 section-blue">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mahj-divider mb-6">
            <span className="text-2xl">🀙</span>
          </div>
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-center text-charcoal mb-12">
            What Players Are Saying
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: "Linda M.", city: "Tulsa, OK", text: "I was traveling to Denver and found 3 games within walking distance of my hotel. This is a game-changer for traveling mahj players!", rating: 5 },
              { name: "Carol S.", city: "Nashville, TN", text: "Finally! A single place to find all the mahjong groups in my area. No more scrolling through endless Facebook posts.", rating: 5 },
              { name: "Barbara T.", city: "Miami, FL", text: "As a snowbird, I play in Miami in winter and Boston in summer. MahjNearMe makes it easy to find games in both cities.", rating: 5 },
            ].map((testimonial, i) => (
              <div key={i} className="card-white p-6">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-gold-300 text-gold-300" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 mb-4">&ldquo;{testimonial.text}&rdquo;</p>
                <div className="text-sm">
                  <p className="font-semibold text-charcoal">{testimonial.name}</p>
                  <p className="text-slate-500">{testimonial.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - soft pink section */}
      <section className="py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/8f52f44ed05054e40828936a96d15b75.jpg" alt="" className="w-full h-full object-cover opacity-[0.10]" loading="lazy" />
          <div className="absolute inset-0 bg-[#FFF0F5]/90" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Add a Group CTA */}
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
                Add a Group <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Player CTA */}
            <div className="card-white p-8 text-center">
              <div className="text-3xl mb-3">🀇</div>
              <h3 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-3">
                Ready to find your next game?
              </h3>
              <p className="text-slate-600 mb-3">
                Full access for 14 days. Credit card required — cancel anytime.
              </p>
              <div className="flex items-center justify-center gap-1 text-xs text-slate-500 mb-4">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Secure payment via Stripe</span>
              </div>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-hotpink-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors shadow-lg"
              >
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link href="/shop" className="text-hotpink-500 hover:text-hotpink-700 font-medium transition-colors inline-flex items-center gap-2">
              New to Mahj? Check out our gear picks <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
