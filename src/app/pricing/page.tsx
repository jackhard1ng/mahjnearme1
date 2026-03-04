"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X, ArrowRight, CreditCard, ShieldCheck, Loader2, Tag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const freeFeatures = [
  { text: "Browse cities & states", included: true },
  { text: "See game names & locations", included: true },
  { text: "View game types & schedules", included: true },
  { text: "Full game details (contact, description, etc.)", included: false },
  { text: "Interactive map with directions", included: false },
  { text: "Travel Planner (search by date range)", included: false },
  { text: "Save favorite games & cities", included: false },
  { text: "Alerts for new games in your cities", included: false },
  { text: "Leave reviews & ratings", included: false },
];

const subscriberFeatures = [
  { text: "Browse cities & states", included: true },
  { text: "See game names & locations", included: true },
  { text: "View game types & schedules", included: true },
  { text: "Full game details (contact, description, etc.)", included: true },
  { text: "Interactive map with directions", included: true },
  { text: "Travel Planner (search by date range)", included: true },
  { text: "Save favorite games & cities", included: true },
  { text: "Alerts for new games in your cities", included: true },
  { text: "Leave reviews & ratings", included: true },
];

const faqs = [
  {
    question: "What do I get with a free account?",
    answer:
      "With a free account you can browse all cities, see game names, types, schedules, and general locations. To see full details like contact info, descriptions, directions, and the interactive map, you'll need a subscription.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes! Every new subscriber gets a 14-day free trial with full access to all features. A credit card is required to start your trial, but you won't be charged until the trial ends. Cancel anytime during the trial and you'll never be billed.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Absolutely. There are no contracts or commitments. You can cancel your subscription anytime from your account settings — including during your free trial.",
  },
  {
    question: "What happens when my trial ends?",
    answer:
      "When your 14-day trial ends, your subscription automatically begins and you'll be charged the plan you selected. You keep full access — no interruption. If you cancel before the trial ends, your account reverts to the free tier.",
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
  const { user, userProfile, hasAccess } = useAuth();
  const router = useRouter();
  const [checkoutLoading, setCheckoutLoading] = useState<"monthly" | "annual" | null>(null);
  const [showPromo, setShowPromo] = useState(false);

  const accountType = userProfile?.accountType;
  const currentPlan = userProfile?.plan; // "monthly" | "annual" | null
  const isTrial = accountType === "trial";
  const isSubscriber = accountType === "subscriber";
  const isFree = !user || accountType === "free";

  const trialDaysLeft = userProfile?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(userProfile.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

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
    if (isTrial) return { label: `Trial Active — ${trialDaysLeft} days left`, href: null };
    if (isSubscriber && currentPlan === "annual") return { label: "Switch to Monthly", href: "/account" };
    return { label: "Start 14-Day Free Trial", href: null, action: "monthly" };
  }

  function getAnnualCta(): CtaConfig {
    if (isSubscriber && currentPlan === "annual") return { label: "Your Current Plan", href: null };
    if (isTrial) return { label: `Trial Active — ${trialDaysLeft} days left`, href: null };
    if (isSubscriber && currentPlan === "monthly") return { label: "Switch to Annual & Save", href: "/account" };
    return { label: "Start 14-Day Free Trial", href: null, action: "annual" };
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
              : isTrial
                ? `You're on a free trial with ${trialDaysLeft} days remaining. Enjoy full access!`
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
                  What you get when you sign up
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
            <div className={`mahj-tile p-8 flex flex-col ${isSubscriber && currentPlan === "monthly" ? "border-2 !border-hotpink-500 relative" : ""} ${isTrial ? "border-2 !border-hotpink-400 relative" : ""}`}>
              {(isSubscriber && currentPlan === "monthly") && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-hotpink-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    Current Plan
                  </span>
                </div>
              )}
              {isTrial && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-hotpink-400 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    Trial Active
                  </span>
                </div>
              )}
              <div className={`mb-6 ${(isSubscriber && currentPlan === "monthly") || isTrial ? "mt-2" : ""}`}>
                <h3 className="font-[family-name:var(--font-heading)] font-bold text-xl text-charcoal mb-1">
                  Monthly
                </h3>
                <p className="text-sm text-slate-500">
                  Pay month-to-month, cancel anytime
                </p>
              </div>
              <div className="mb-6">
                <span className="font-[family-name:var(--font-heading)] font-extrabold text-5xl text-charcoal">
                  $4.99
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
                <div className={`block text-center px-6 py-3 rounded-xl font-semibold ${isTrial ? "bg-hotpink-50 text-hotpink-500 border-2 border-hotpink-200" : "bg-slate-100 text-slate-500 border-2 border-slate-200"}`}>
                  {monthlyCta.label}
                </div>
              )}
              {monthlyCta.action && (
                <p className="text-xs text-slate-400 text-center mt-3 flex items-center justify-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" /> You won&apos;t be charged until {trialEndDate}
                </p>
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
                  Best value — billed yearly
                </p>
              </div>
              <div className="mb-6">
                <span className="font-[family-name:var(--font-heading)] font-extrabold text-5xl text-charcoal">
                  $39.99
                </span>
                <span className="text-slate-500 ml-1">/year</span>
                <p className="text-sm text-hotpink-500 font-medium mt-1">
                  That&apos;s just $3.33/month
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
                <div className={`block text-center px-6 py-3 rounded-xl font-semibold ${isTrial ? "bg-hotpink-50 text-hotpink-500 border-2 border-hotpink-200" : "bg-slate-100 text-slate-500 border-2 border-slate-200"}`}>
                  {annualCta.label}
                </div>
              )}
              {annualCta.action && (
                <p className="text-xs text-slate-400 text-center mt-3 flex items-center justify-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" /> You won&apos;t be charged until {trialEndDate}
                </p>
              )}
            </div>
          </div>

          {/* Trial Note */}
          {!isTrial && !isSubscriber && (
            <div className="text-center mt-8 bg-softpink-100 border border-hotpink-200 rounded-xl px-6 py-4 max-w-lg mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-hotpink-500" />
                <span className="font-semibold text-charcoal">14-Day Free Trial on Paid Plans</span>
              </div>
              <p className="text-slate-500 text-sm">
                Credit card required to start your trial. You won&apos;t be charged until it ends. Cancel anytime — no risk, no commitment.
              </p>
            </div>
          )}

          {/* Promo Code */}
          {!isTrial && !isSubscriber && (
            <div className="text-center mt-4">
              <button
                onClick={() => setShowPromo(!showPromo)}
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-hotpink-500 transition-colors"
              >
                <Tag className="w-3.5 h-3.5" />
                Have a promo code?
              </button>
              {showPromo && (
                <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                  Enter your promo code on the Stripe checkout page after clicking &ldquo;Start 14-Day Free Trial&rdquo; above. The discount will be applied automatically.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

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

      {/* Add a Group Note */}
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
              Add a Group <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
