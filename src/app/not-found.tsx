import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Search, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-hotpink-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🀄</span>
        </div>
        <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-charcoal mb-3">
          Page not found
        </h1>
        <p className="text-slate-500 mb-8">
          We couldn&apos;t find the page you&apos;re looking for. It may have moved or never existed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-hotpink-500 text-white px-5 py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors"
          >
            Back home <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-charcoal px-5 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
          >
            <Search className="w-4 h-4" /> Search games
          </Link>
          <Link
            href="/cities"
            className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-charcoal px-5 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
          >
            <MapPin className="w-4 h-4" /> Browse cities
          </Link>
        </div>
      </div>
    </div>
  );
}
