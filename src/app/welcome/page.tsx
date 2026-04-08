"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, ArrowRight, Search, MapPin, Heart, Gift } from "lucide-react";
import { reportSubscriptionConversion } from "@/lib/gtag";

export default function WelcomePage() {
  const { user, userProfile, updateUserProfile } = useAuth();
  const [verified, setVerified] = useState(false);
  const router = useRouter();
  const [postCheckoutRedirect, setPostCheckoutRedirect] = useState<string | null>(null);
  const [stripeSessionId, setStripeSessionId] = useState<string | null>(null);
  const conversionFiredRef = useRef(false);

  useEffect(() => {
    // Check for stored redirect destination from pre-signup flow
    const stored = sessionStorage.getItem("postCheckoutRedirect");
    if (stored) {
      setPostCheckoutRedirect(stored);
      sessionStorage.removeItem("postCheckoutRedirect");
    }

    // Capture the Stripe checkout session id from the success_url. We use this
    // both to gate conversion firing (so a user who navigates to /welcome
    // directly doesn't trigger a fake conversion) and as the dedup key passed
    // to Google Ads as `transaction_id`.
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setStripeSessionId(params.get("session_id"));
    }
  }, []);

  useEffect(() => {
    // After successful Stripe checkout, update local profile to reflect active subscription
    if (user) {
      updateUserProfile({
        accountType: "subscriber",
        subscriptionStatus: "active",
      });
      setVerified(true);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fire the Google Ads conversion exactly once per Stripe session.
  // Conditions:
  //   1. We must have a real session_id in the URL (Stripe success_url).
  //   2. The user must be loaded (so we know they actually authed back in).
  //   3. We prefer to know the plan to send the right value, but if the
  //      Stripe webhook hasn't yet updated `userProfile.plan`, we fall back
  //      to "monthly" after a short grace window so we never miss a sale.
  useEffect(() => {
    if (conversionFiredRef.current) return;
    if (!stripeSessionId || !user) return;

    const plan = userProfile?.plan;

    // If we already know the plan, fire immediately.
    if (plan === "monthly" || plan === "annual") {
      const result = reportSubscriptionConversion(plan, stripeSessionId);
      if (result === "sent" || result === "dedup") {
        conversionFiredRef.current = true;
      }
      return;
    }

    // Plan is still null — the Stripe webhook may not have written it yet.
    // Wait briefly, then fall back to "monthly" so we always record the
    // conversion. Google Ads dedups on transaction_id, so a slightly-wrong
    // value is still better than a missed sale.
    const timeout = setTimeout(() => {
      if (conversionFiredRef.current) return;
      const fallbackPlan: "monthly" | "annual" =
        userProfile?.plan === "annual" ? "annual" : "monthly";
      const result = reportSubscriptionConversion(fallbackPlan, stripeSessionId);
      if (result === "sent" || result === "dedup") {
        conversionFiredRef.current = true;
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [stripeSessionId, user, userProfile?.plan]);

  const isAnnual = userProfile?.plan === "annual";

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
            Your {isAnnual ? "annual" : "monthly"} subscription is now active. You have full access to all features.
          </p>
          <p className="text-sm text-slate-500 mb-8">
            You can manage your subscription anytime from your account settings.
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
                <p className="text-xs text-slate-500">Browse games across all 70+ metros with full details</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-softpink-50 rounded-lg p-3">
              <Heart className="w-5 h-5 text-hotpink-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-charcoal text-sm">Save Your Favorites</p>
                <p className="text-xs text-slate-500">Save cities and favorite games for quick access</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-green-50 rounded-lg p-3">
              <Gift className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-charcoal text-sm">Monthly Giveaway{isAnnual ? " — 2x Entries!" : ""}</p>
                <p className="text-xs text-slate-500">
                  {isAnnual
                    ? "As an annual member, you get 2 entries every month into our premium mahjong set giveaway!"
                    : "You're automatically entered each month to win a premium mahjong set!"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={postCheckoutRedirect || "/search"}
              className="inline-flex items-center justify-center gap-2 bg-hotpink-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors"
            >
              {postCheckoutRedirect ? "Continue Where You Left Off" : "Find Games"} <ArrowRight className="w-4 h-4" />
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
