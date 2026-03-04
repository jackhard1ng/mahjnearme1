"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, ArrowRight, Search, MapPin, Heart } from "lucide-react";

export default function WelcomePage() {
  const { user, updateUserProfile } = useAuth();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // After successful Stripe checkout, update local profile to reflect trial
    if (user) {
      const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      updateUserProfile({
        accountType: "trial",
        subscriptionStatus: "trialing",
        trialEndsAt: trialEnd,
      });
      setVerified(true);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">
        <div className="mahj-tile p-8 sm:p-10">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>

          <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-charcoal mb-3">
            Welcome to MahjNearMe!
          </h1>

          <p className="text-slate-600 mb-2">
            Your 14-day free trial is now active.
          </p>
          <p className="text-sm text-slate-500 mb-8">
            You won&apos;t be charged until <strong>{trialEndDate}</strong>. Cancel anytime from your account settings.
          </p>

          <div className="space-y-4 mb-8 text-left">
            <h3 className="font-semibold text-charcoal text-center">Here&apos;s what you can do now:</h3>
            <div className="flex items-start gap-3 bg-softpink-50 rounded-lg p-3">
              <Search className="w-5 h-5 text-hotpink-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-charcoal text-sm">Search for Games</p>
                <p className="text-xs text-slate-500">Find mahjong games near you with full details</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-skyblue-50 rounded-lg p-3">
              <MapPin className="w-5 h-5 text-skyblue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-charcoal text-sm">Explore Cities</p>
                <p className="text-xs text-slate-500">Browse games across different cities and states</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-softpink-50 rounded-lg p-3">
              <Heart className="w-5 h-5 text-hotpink-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-charcoal text-sm">Save Your Favorites</p>
                <p className="text-xs text-slate-500">Save cities and favorite games for quick access</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 bg-hotpink-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors"
            >
              Find Games <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/account"
              className="inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
            >
              View Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
