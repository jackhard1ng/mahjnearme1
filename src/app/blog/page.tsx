import Link from "next/link";
import Image from "next/image";
import { getAllPosts } from "@/lib/blog";
import { ArrowRight, BookOpen } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Mahjong Tips, City Guides & News",
  description: "Tips for finding mahjong games, city guides, and news from the MahjNearMe community.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl sm:text-4xl text-charcoal mb-3">
        Blog
      </h1>
      <p className="text-slate-500 mb-10">
        Tips, city guides, and news from the MahjNearMe community.
      </p>

      {posts.length === 0 ? (
        <div className="mahj-tile p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="font-semibold text-xl text-charcoal mb-2">Coming soon</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            We&apos;re working on city guides, mahjong tips, and community stories. Check back soon!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block mahj-tile p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start gap-4">
                {post.image && (
                  <Image
                    src={post.image}
                    alt={post.title}
                    width={96}
                    height={96}
                    sizes="96px"
                    className="w-24 h-24 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-hotpink-500 uppercase tracking-wider">{post.category}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(post.date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <h2 className="font-bold text-lg text-charcoal group-hover:text-hotpink-500 transition-colors mb-1">
                    {post.title}
                  </h2>
                  <p className="text-sm text-slate-500 line-clamp-2">{post.description}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-hotpink-500 mt-2">
                    Read more <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
