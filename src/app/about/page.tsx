import type { Metadata } from "next";
import Link from "next/link";
import { Heart, MapPin, ShieldCheck, Users, BarChart3, Globe, CheckCircle, RefreshCw } from "lucide-react";
import { mockGames } from "@/lib/mock-data";
import { isEventExpired } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About MahjNearMe",
  description: "The story behind MahjNearMe. How struggling to find mahjong games while traveling inspired the only directory of pickup mahjong games in the United States.",
};

function getAboutStats() {
  const active = mockGames.filter((g) => g.status === "active" && !isEventExpired(g));
  const cities = new Set(active.map((g) => g.city));
  const states = new Set(active.map((g) => g.state));
  return {
    games: Math.floor(active.length / 100) * 100,
    cities: cities.size,
    states: states.size,
  };
}

const stats = getAboutStats();

export default function AboutPage() {
  return (
    <>
      {/* Hero image section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/c2d2c03301c201e23fd4816059b397c4.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF1493]/85 via-[#FF69B4]/75 to-[#87CEEB]/80" />
        </div>
        <div className="max-w-3xl mx-auto px-4 pt-16 pb-12 sm:pt-20 sm:pb-16 text-center relative">
          <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-4 tracking-tight drop-shadow-lg">
            About MahjNearMe
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            The story behind the only directory of pickup mahjong games in the United States.
          </p>
        </div>
      </section>

    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="prose prose-slate max-w-none">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm mb-10">
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-xl text-charcoal mb-1">The Story</h2>
            <p className="text-sm text-hotpink-500">From Jack, Founder of MahjNearMe</p>
          </div>
          <div className="text-slate-600 space-y-4">
            <p>
              My mom plays mahjong all the time back home in Tulsa. She never has trouble
              finding a game there. But whenever we&apos;re out of town, it&apos;s a completely
              different story. There&apos;s just no easy place to look. She&apos;ll spend hours
              searching Facebook groups, Googling every spelling of &ldquo;mahjongg,&rdquo;
              and DMing strangers on Instagram just trying to find one game wherever we are.
            </p>
            <p>
              It happened so many times that we finally said, there has to be a better way.
            </p>
            <p>
              MahjNearMe is the first and only comprehensive directory of pickup mahjong games,
              open play sessions, lessons, and events across the United States. Whether you&apos;re
              at home or traveling, you can find a game in minutes instead of hours.
            </p>
          </div>

          {/* Photo */}
          <div className="mt-8 rounded-xl overflow-hidden flex justify-center">
            <img
              src="/images/heidijackhaleyswedding.jfif"
              alt="Jack with his family"
              className="max-w-sm w-full h-auto object-contain rounded-xl"
            />
          </div>
        </div>

        {/* By the Numbers */}
        <div className="bg-gradient-to-br from-hotpink-50 to-skyblue-50 rounded-2xl p-8 border border-hotpink-200 mb-10">
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-6 text-center">
            By the Numbers
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <BarChart3 className="w-6 h-6 text-hotpink-500 mx-auto mb-2" />
              <p className="text-2xl font-extrabold text-charcoal">{stats.games}+</p>
              <p className="text-sm text-slate-500">Listings researched</p>
            </div>
            <div>
              <Globe className="w-6 h-6 text-skyblue-500 mx-auto mb-2" />
              <p className="text-2xl font-extrabold text-charcoal">50</p>
              <p className="text-sm text-slate-500">States covered</p>
            </div>
            <div>
              <MapPin className="w-6 h-6 text-hotpink-500 mx-auto mb-2" />
              <p className="text-2xl font-extrabold text-charcoal">{stats.cities}+</p>
              <p className="text-sm text-slate-500">Cities</p>
            </div>
            <div>
              <RefreshCw className="w-6 h-6 text-skyblue-500 mx-auto mb-2" />
              <p className="text-2xl font-extrabold text-charcoal">Weekly</p>
              <p className="text-sm text-slate-500">Updates</p>
            </div>
          </div>
          <p className="text-center text-sm text-slate-500 mt-5 max-w-md mx-auto">
            Every listing manually researched by our team — not scraped by a bot.
          </p>
        </div>

        <h2 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-6">
          What Makes Us Different
        </h2>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {[
            {
              icon: ShieldCheck,
              title: "Verified & Updated",
              desc: "We verify listings regularly and update the directory weekly with new games and events. No scraping, no bots.",
            },
            {
              icon: MapPin,
              title: "Built for Travelers",
              desc: "Search any city in the US. Perfect for snowbirds, vacationers, and anyone who plays mahj on the go.",
            },
            {
              icon: Users,
              title: "All Styles Welcome",
              desc: "American, Chinese, Riichi: we list games for every style and every skill level.",
            },
            {
              icon: Heart,
              title: "Community-Powered",
              desc: "Groups can get listed for free. Our team verifies every listing to keep the data fresh and accurate.",
            },
          ].map((item) => (
            <div key={item.title} className="mahj-tile p-5">
              <item.icon className="w-6 h-6 text-hotpink-500 mb-3" />
              <h3 className="font-semibold text-charcoal mb-1">{item.title}</h3>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/search"
            className="inline-block bg-hotpink-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors"
          >
            Find a Game Near You
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
