import type { Metadata } from "next";
import Link from "next/link";
import { Heart, MapPin, ShieldCheck, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About MahjNearMe",
  description: "The story behind MahjNearMe — how a trip to Nashville inspired the only directory of pickup mahjong games in the United States.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl sm:text-4xl text-slate-900 mb-6">
        About MahjNearMe
      </h1>

      <div className="prose prose-slate max-w-none">
        <div className="bg-gradient-to-br from-teal-50 to-white rounded-2xl p-8 border border-teal-100 mb-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-teal-200 rounded-full flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-teal-800">J</span>
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-heading)] font-bold text-xl text-slate-900 mb-0">The Story</h2>
              <p className="text-sm text-teal-600">From Jack, Founder of MahjNearMe</p>
            </div>
          </div>
          <div className="text-slate-600 space-y-4">
            <p>
              My mom plays mahjong everywhere we go. On a trip to Nashville, she spent hours searching
              Facebook groups, Googling different spellings of &ldquo;mahjongg,&rdquo; and DMing strangers on
              Instagram &mdash; just to find a game.
            </p>
            <p>
              We thought, there has to be a better way. So we built one.
            </p>
            <p>
              MahjNearMe is the first and only comprehensive directory of pickup mahjong games,
              open play sessions, lessons, and events across the United States. Whether you&apos;re
              at home or traveling, you can find a game in minutes instead of hours.
            </p>
          </div>
        </div>

        <h2 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-slate-900 mb-6">
          What Makes Us Different
        </h2>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {[
            {
              icon: ShieldCheck,
              title: "Verified Weekly",
              desc: "Every listing is verified regularly. No outdated info, no dead links, no guessing if a game still meets.",
            },
            {
              icon: MapPin,
              title: "Built for Travelers",
              desc: "Search any city in the US. Perfect for snowbirds, vacationers, and anyone who plays mahj on the go.",
            },
            {
              icon: Users,
              title: "All Styles Welcome",
              desc: "American, Chinese, Riichi — we list games for every style and every skill level.",
            },
            {
              icon: Heart,
              title: "Community-Powered",
              desc: "Organizers list and manage their own groups for free. Our community keeps the data fresh.",
            },
          ].map((item) => (
            <div key={item.title} className="bg-white border border-slate-200 rounded-xl p-5">
              <item.icon className="w-6 h-6 text-teal-600 mb-3" />
              <h3 className="font-semibold text-slate-800 mb-1">{item.title}</h3>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/search"
            className="inline-block bg-teal-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-teal-700 transition-colors"
          >
            Find a Game Near You
          </Link>
        </div>
      </div>
    </div>
  );
}
