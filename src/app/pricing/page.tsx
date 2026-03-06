"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, X, ArrowRight, CreditCard, ShieldCheck, Loader2, Tag, Heart, Gift } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { GIVEAWAY_COPY, MONTHLY_PRICE, ANNUAL_PRICE } from "@/lib/constants";
import { formatCurrency } from "@/lib/currency";

const freeFeatures = [
  { text: "Full access to one metro of your choice", included: true },
  { text: "Browse all cities & states", included: true },
  { text: "See game types (open play, lessons, etc.)", included: true },
  { text: "Read forum posts in your home metro", included: true },
  { text: "Full game details in other metros", included: false },
  { text: "Post & reply in forums", included: false },
  { text: "Event alerts & new listing notifications", included: false },
  { text: "Monthly mahjong set giveaway entry", included: false },
  { text: "Contributor program eligibility", included: false },
];

const subscriberFeatures = [
  { text: "All 70+ metros with full access everywhere", included: true },
  { text: "Full game details, contact info & schedules", included: true },
  { text: "Interactive map with directions", included: true },
  { text: "Post & reply in all forum boards", included: true },
  { text: "Event alerts & new listing notifications", included: true },
  { text: "Save favorite games & cities", included: true },
  { text: "Add games to your calendar", included: true },
  { text: "Automatic monthly giveaway entry", included: true },
  { text: "Contributor program eligibility", included: true },
];

const faqs = [
  {
    question: "What do I get with a free account?",
    answer:
      "With a free account you get full access to one metro area of your choice. All listings, all details. You can browse other metros and see that games exist, but details are locked. You can also read forum posts in your home metro. Upgrade to unlock all 70+ metros, forum posting, giveaway entries, and more.",
  },
  {
    question: "Is the free plan really free forever?",
    answer:
      "Yes. The free plan is permanent, not a trial. You get full access to one metro area forever. Upgrade whenever you want to unlock all metros and features.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Absolutely. There are no contracts or commitments. You can cancel your subscription anytime from your account settings. Your access continues through the end of your billing period, then reverts to the free tier.",
  },
  {
    question: "How do payments work?",
    answer:
      "All payments are processed securely through Stripe. We accept all major credit and debit cards. Your payment information is never stored on our servers.",
  },
  {
    question: "Can I switch plans?",
    answer:
      "Yes, you can switch between monthly and annual plans anytime via your account settings. If you switch from monthly to annual, you'll receive a prorated credit.",
  },
];

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <PricingContent />
    </Suspense>
  );
}

function PricingContent() {
  const { user, userProfile, hasAccess } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkoutLoading, setCheckoutLoading] = useState<"monthly" | "annual" | null>(null);
  const [showPromo, setShowPromo] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [referralName, setReferralName] = useState("");

  // Check for referral code in URL
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref);
      validateReferral(ref);
    }
  }, [searchParams]);

  async function validateReferral(code: string) {
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      setReferralValid(data.valid);
      if (data.valid) setReferralName(data.contributorName);
    } catch {
      setReferralValid(false);
    }
  }

  const accountType = userProfile?.accountType;
  const currentPlan = userProfile?.plan; // "monthly" | "annual" | null
  const isSubscriber = accountType === "subscriber";
  const isFree = !user || accountType === "free";

  async function handleCheckout(plan: "monthly" | "annual") {
    if (!user) {
      router.push(`/signup?plan=${plan}`);
      return;
    }

    setCheckoutLoading(plan);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          firebaseUid: user.uid,
          email: user.email,
          ...(referralValid && referralCode ? { referralCode } : {}),
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned:", data);
        alert("Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  }

  // Determine CTA for each column
  type CtaConfig = { label: string; href: string | null; action?: "monthly" | "annual" };

  function getFreeCta(): CtaConfig {
    if (!user) return { label: "Sign Up Free", href: "/signup" };
    if (isFree) return { label: "Your Current Plan", href: null };
    return { label: "Free Plan", href: null };
  }

  function getMonthlyCta(): CtaConfig {
    if (isSubscriber && currentPlan === "monthly") return { label: "Your Current Plan", href: null };
    if (isSubscriber && currentPlan === "annual") return { label: "Switch to Monthly", href: "/account" };
    return { label: "Subscribe Monthly", href: null, action: "monthly" };
  }

  function getAnnualCta(): CtaConfig {
    if (isSubscriber && currentPlan === "annual") return { label: "Your Current Plan", href: null };
    if (isSubscriber && currentPlan === "monthly") return { label: "Switch to Annual & Save", href: "/account" };
    return { label: "Subscribe Annually", href: null, action: "annual" };
  }

  const freeCta = getFreeCta();
  const monthlyCta = getMonthlyCta();
  const annualCta = getAnnualCta();

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/40a8a8ed77d5469f174ff66a88f95aa5.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF1493]/85 via-[#FF69B4]/75 to-[#87CEEB]/80" />
        </div>

        <div className="max-w-5xl mx-auto px-4 pt-16 pb-12 sm:pt-24 sm:pb-16 text-center relative">
          <div className="flex justify-center gap-2 mb-4">
            <span className="text-2xl opacity-50">🀇</span>
            <span className="text-2xl opacity-50">🀄</span>
            <span className="text-2xl opacity-50">🀙</span>
          </div>
          <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white mb-4 tracking-tight drop-shadow-lg">
            Simple, Transparent{" "}
            <span className="text-skyblue-200">Pricing</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/80 mb-2 max-w-2xl mx-auto">
            {isFree
              ? "Create a free account to get started. Upgrade to unlock full game details, maps, and more."
              : isSubscriber
                ? "You're a subscriber with full access to all features."
                : "Create a free account to get started. Upgrade to unlock full game details, maps, and more."}
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 sm:py-16 section-warm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-6 lg:gap-8">
            {/* Free Account */}
            <div className={`mahj-tile p-8 flex flex-col ${user && isFree ? "border-2 !border-skyblue-400 relative" : ""}`}>
              {user && isFree && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-skyblue-400 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    Current Plan
                  </span>
                </div>
              )}
              <div className={`mb-6 ${user && isFree ? "mt-2" : ""}`}>
                <h3 className="font-[family-name:var(--font-heading)] font-bold text-xl text-charcoal mb-1">
                  Free
                </h3>
                <p className="text-sm text-slate-500">
                  Free forever, no credit card needed
                </p>
              </div>
              <div className="mb-6">
                <span className="font-[family-name:var(--font-heading)] font-extrabold text-5xl text-charcoal">
                  $0
                </span>
                <span className="text-slate-500 ml-1">/forever</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {freeFeatures.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-hotpink-500 shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${feature.included ? "text-slate-600" : "text-slate-400"}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
              {freeCta.href ? (
                <Link
                  href={freeCta.href}
                  className="block text-center bg-skyblue-100 text-skyblue-600 border-2 border-skyblue-300 px-6 py-3 rounded-xl font-semibold hover:bg-skyblue-200 transition-colors"
                >
                  {freeCta.label}
                </Link>
              ) : (
                <div className="block text-center bg-slate-100 text-slate-500 border-2 border-slate-200 px-6 py-3 rounded-xl font-semibold">
                  {freeCta.label}
                </div>
              )}
            </div>

            {/* Monthly Plan */}
            <div className={`mahj-tile p-8 flex flex-col ${isSubscriber && currentPlan === "monthly" ? "border-2 !border-hotpink-500 relative" : ""}`}>
              {(isSubscriber && currentPlan === "monthly") && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-hotpink-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    Current Plan
                  </span>
                </div>
              )}
              <div className={`mb-6 ${(isSubscriber && currentPlan === "monthly") ? "mt-2" : ""}`}>
                <h3 className="font-[family-name:var(--font-heading)] font-bold text-xl text-charcoal mb-1">
                  Monthly
                </h3>
                <p className="text-sm text-slate-500">
                  Pay month-to-month, cancel anytime
                </p>
              </div>
              <div className="mb-6">
                <span className="font-[family-name:var(--font-heading)] font-extrabold text-5xl text-charcoal">
                  {formatCurrency(MONTHLY_PRICE)}
                </span>
                <span className="text-slate-500 ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {subscriberFeatures.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-hotpink-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600">{feature.text}</span>
                  </li>
                ))}
              </ul>
              {monthlyCta.action ? (
                <button
                  onClick={() => handleCheckout("monthly")}
                  disabled={checkoutLoading !== null}
                  className="w-full text-center bg-softpink-100 text-hotpink-500 border-2 border-hotpink-500 px-6 py-3 rounded-xl font-semibold hover:bg-softpink-200 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {checkoutLoading === "monthly" ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to Stripe...</>
                  ) : (
                    monthlyCta.label
                  )}
                </button>
              ) : monthlyCta.href ? (
                <Link
                  href={monthlyCta.href}
                  className="block text-center bg-softpink-100 text-hotpink-500 border-2 border-hotpink-500 px-6 py-3 rounded-xl font-semibold hover:bg-softpink-200 transition-colors"
                >
                  {monthlyCta.label}
                </Link>
              ) : (
                <div className="block text-center bg-slate-100 text-slate-500 border-2 border-slate-200 px-6 py-3 rounded-xl font-semibold">
                  {monthlyCta.label}
                </div>
              )}
            </div>

            {/* Annual Plan */}
            <div className={`mahj-tile p-8 flex flex-col relative ${isSubscriber && currentPlan === "annual" ? "border-2 !border-hotpink-500" : "border-2 !border-hotpink-500"}`}>
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {isSubscriber && currentPlan === "annual" ? (
                  <span className="bg-hotpink-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    Current Plan
                  </span>
                ) : (
                  <>
                    <span className="bg-hotpink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Best Value
                    </span>
                    <span className="bg-skyblue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Save 33%
                    </span>
                  </>
                )}
              </div>
              <div className="mb-6 mt-2">
                <h3 className="font-[family-name:var(--font-heading)] font-bold text-xl text-charcoal mb-1">
                  Annual
                </h3>
                <p className="text-sm text-slate-500">
                  Best value, billed yearly
                </p>
              </div>
              <div className="mb-6">
                <span className="font-[family-name:var(--font-heading)] font-extrabold text-5xl text-charcoal">
                  {formatCurrency(ANNUAL_PRICE)}
                </span>
                <span className="text-slate-500 ml-1">/year</span>
                <p className="text-sm text-hotpink-500 font-medium mt-1">
                  That&apos;s just {formatCurrency(ANNUAL_PRICE / 12)}/month
                </p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {subscriberFeatures.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-hotpink-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600">{feature.text}</span>
                  </li>
                ))}
              </ul>
              {annualCta.action ? (
                <button
                  onClick={() => handleCheckout("annual")}
                  disabled={checkoutLoading !== null}
                  className="w-full text-center bg-gradient-to-r from-hotpink-500 to-hotpink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-hotpink-600 hover:to-hotpink-700 transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {checkoutLoading === "annual" ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to Stripe...</>
                  ) : (
                    annualCta.label
                  )}
                </button>
              ) : annualCta.href ? (
                <Link
                  href={annualCta.href}
                  className="block text-center bg-gradient-to-r from-hotpink-500 to-hotpink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-hotpink-600 hover:to-hotpink-700 transition-all shadow-sm"
                >
                  {annualCta.label}
                </Link>
              ) : (
                <div className="block text-center bg-slate-100 text-slate-500 border-2 border-slate-200 px-6 py-3 rounded-xl font-semibold">
                  {annualCta.label}
                </div>
              )}
            </div>
          </div>

          {/* Referral / Promo Code */}
          {!isSubscriber && (
            <div className="text-center mt-6">
              {referralValid && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 max-w-sm mx-auto mb-3">
                  <p className="text-sm text-green-700 font-medium">
                    15% off applied! Referred by {referralName}
                  </p>
                </div>
              )}
              <button
                onClick={() => setShowPromo(!showPromo)}
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-hotpink-500 transition-colors"
              >
                <Tag className="w-3.5 h-3.5" />
                Have a referral or promo code?
              </button>
              {showPromo && (
                <div className="mt-3 max-w-sm mx-auto">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SARAH-TULSA"
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-hotpink-200"
                    />
                    <button
                      onClick={() => validateReferral(referralCode)}
                      className="bg-hotpink-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-hotpink-600 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {referralValid === false && referralCode && (
                    <p className="text-xs text-red-500 mt-1">
                      Code not found. You can also enter promo codes at Stripe checkout.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Giveaway Callout */}
      <section className="py-8 sm:py-10 section-warm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-gradient-to-r from-hotpink-50 to-skyblue-50 border-2 border-hotpink-200 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-16 h-16 bg-hotpink-100 rounded-2xl flex items-center justify-center shrink-0">
                <Gift className="w-8 h-8 text-hotpink-500" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-[family-name:var(--font-heading)] font-bold text-lg text-charcoal mb-2">
                  Monthly Mahjong Giveaway
                </h3>
                <p className="text-slate-600 text-sm mb-1">
                  Every paid member is automatically entered in our monthly giveaway. Prizes every month -- and when we hit subscriber milestones, we go big.
                </p>
                <p className="text-slate-500 text-xs">
                  No opt-in required. Annual members get 2x entries.{" "}
                  <Link href="/giveaways" className="text-hotpink-500 hover:text-hotpink-600 font-medium">
                    Learn more
                  </Link>
                </p>
              </div>
            </div>
            {!hasAccess && (
              <p className="text-center text-xs text-slate-400 mt-4 pt-4 border-t border-hotpink-100">
                Free accounts are not entered in giveaways. Upgrade to be included.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Contributor Option */}
      {!isSubscriber && (
        <section className="pb-0 sm:pb-0 section-warm">
          <div className="max-w-5xl mx-auto px-4">
            <div className="bg-skyblue-50 border border-skyblue-200 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
              <div className="w-14 h-14 bg-skyblue-100 rounded-full flex items-center justify-center shrink-0">
                <Heart className="w-7 h-7 text-skyblue-500" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-[family-name:var(--font-heading)] font-bold text-lg text-charcoal mb-1">
                  Apply as a Community Contributor
                </h3>
                <p className="text-sm text-slate-500">
                  Get free full access in exchange for keeping your city&apos;s listings current. ~30 min/month, no technical skills needed.
                  Approved contributors also earn referral commissions on every subscriber they bring in.
                </p>
              </div>
              <Link
                href="/contribute"
                className="inline-flex items-center gap-2 bg-skyblue-400 text-white px-6 py-3 rounded-xl font-semibold hover:bg-skyblue-500 transition-colors whitespace-nowrap shrink-0"
              >
                Learn More <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="py-12 sm:py-16 section-mint">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-center text-charcoal mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="mahj-tile p-6"
              >
                <h3 className="font-semibold text-lg text-charcoal mb-2">
                  {faq.question}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* List Your Group Note */}
      <section className="py-12 sm:py-16 section-gold">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="card-white p-8">
            <div className="text-3xl mb-3">🀄</div>
            <h3 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-charcoal mb-3">
              Don&apos;t see your group?
            </h3>
            <p className="text-slate-500 mb-6">
              We&apos;re building the most complete mahjong directory in the country. If your group isn&apos;t listed, let us know and we&apos;ll add it for free.
            </p>
            <Link
              href="/add-your-group"
              className="inline-flex items-center gap-2 bg-hotpink-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors"
            >
              List Your Group <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
