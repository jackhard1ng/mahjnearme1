import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Mahjong Tips, Guides & News",
  description: "Tips for finding games, beginner guides, city spotlights, and news from the mahjong community. The MahjNearMe blog.",
};

const posts = [
  {
    slug: "how-to-find-mahjong-while-traveling",
    title: "How to Find Mahjong Games While Traveling",
    excerpt: "Traveling and want to play? Here's your complete guide to finding pickup mahjong games in any city, whether you're on vacation, visiting family, or snowbirding for the season.",
    category: "Guide",
    readTime: "5 min",
    date: "March 1, 2026",
  },
  {
    slug: "beginners-guide-american-mahjong",
    title: "Beginner's Guide to American Mahjong",
    excerpt: "New to mahj? Here's everything you need to know before your first game — from how to read the NMJL card to what to bring and what to expect.",
    category: "Guide",
    readTime: "8 min",
    date: "February 25, 2026",
  },
  {
    slug: "first-open-play-session",
    title: "What to Expect at Your First Open Play Session",
    excerpt: "Walking into a room full of strangers can be intimidating. Here's exactly what a typical open play session looks like and how to feel comfortable from minute one.",
    category: "Tips",
    readTime: "4 min",
    date: "February 18, 2026",
  },
  {
    slug: "american-vs-chinese-vs-riichi",
    title: "American vs. Chinese vs. Riichi Mahjong: What's the Difference?",
    excerpt: "There are many styles of mahjong played around the world. Here's a quick breakdown of the three most popular styles in the US and what makes each one unique.",
    category: "Education",
    readTime: "6 min",
    date: "February 10, 2026",
  },
  {
    slug: "mahjong-etiquette-tips",
    title: "Mahjong Etiquette: Tips for Joining a New Group",
    excerpt: "From table manners to communication tips, here's how to be a great guest at any mahjong group — especially if it's your first time playing with them.",
    category: "Tips",
    readTime: "4 min",
    date: "February 3, 2026",
  },
];

export default function BlogPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl sm:text-4xl text-charcoal mb-3">
        The MahjNearMe Blog
      </h1>
      <p className="text-slate-500 mb-10">
        Tips, guides, and stories from the mahjong community.
      </p>

      <div className="space-y-6">
        {posts.map((post, i) => (
          <article
            key={post.slug}
            className={`mahj-tile overflow-hidden ${
              i === 0 ? "p-8" : "p-6"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-semibold text-hotpink-500 bg-softpink-100 px-2.5 py-0.5 rounded-full">
                {post.category}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {post.readTime}
              </span>
              <span className="text-xs text-slate-400">{post.date}</span>
            </div>
            <h2 className={`font-[family-name:var(--font-heading)] font-bold text-charcoal mb-2 ${
              i === 0 ? "text-2xl" : "text-lg"
            }`}>
              {post.title}
            </h2>
            <p className={`text-slate-500 mb-4 ${i === 0 ? "" : "text-sm"}`}>
              {post.excerpt}
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-hotpink-500 hover:text-hotpink-600 cursor-pointer">
              Read More <ArrowRight className="w-4 h-4" />
            </span>
          </article>
        ))}
      </div>
    </div>
  );
}
