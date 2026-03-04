"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-hotpink-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🀄</span>
        </div>
        <h2 className="text-xl font-bold text-charcoal mb-2">Something went wrong</h2>
        <p className="text-slate-500 text-sm mb-6">
          We hit a snag loading this page. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-hotpink-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="bg-skyblue-100 text-charcoal px-6 py-2.5 rounded-xl font-semibold hover:bg-skyblue-200 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
