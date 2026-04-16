import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist. Browse mahjong games, groups, and instructors near you on MahjNearMe.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 bg-hotpink-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🀄</span>
        </div>
        <p className="text-sm font-semibold text-hotpink-500 uppercase tracking-wider mb-2">404</p>
        <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl sm:text-4xl text-charcoal mb-3">
          We couldn't find that page
        </h1>
        <p className="text-slate-500 mb-8">
          The page may have moved, or the link might be broken. Try one of these instead:
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/"
            className="bg-hotpink-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/search"
            className="bg-skyblue-100 text-charcoal px-6 py-2.5 rounded-xl font-semibold hover:bg-skyblue-200 transition-colors"
          >
            Find Games
          </Link>
          <Link
            href="/cities"
            className="bg-white border border-slate-200 text-charcoal px-6 py-2.5 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
          >
            Browse Cities
          </Link>
        </div>
      </div>
    </div>
  );
}
