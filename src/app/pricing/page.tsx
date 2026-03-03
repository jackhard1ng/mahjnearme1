import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, Star, ArrowRight, CreditCard, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing — MahjNearMe",
  description:
    "Simple, transparent pricing for MahjNearMe. Start with a 14-day free trial. Full access to mahjong game details, interactive maps, travel planner, alerts, and more.",
};

const features = [
  "Full access to all game details",
  "Interactive map with directions",
  "Travel Planner (search by date range)",
  "Alerts for new games in your cities",
  "Save favorite games & cities",
  '"Verified Player" badge',
  "Leave reviews & ratings",
  "Priority city requests",
];

const faqs = [
  {
    question: "Is there a free trial?",
    answer:
      "Yes! Every new account gets a 14-day free trial with full access to all features. A credit card is required to start your trial, but you won't be charged until the trial ends. Cancel anytime during the trial and you'll never be billed.",
  },
  {
    question: "Why is a credit card required for the trial?",
    answer:
      "Requiring a credit card helps us keep the platform safe and prevents abuse. You won't be charged during your 14-day trial. If you cancel before the trial ends, you pay nothing.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Absolutely. There are no contracts or commitments. You can cancel your subscription anytime from your account settings — including during your free trial.",
  },
  {
    question: "What happens when my trial ends?",
    answer:
      "When your 14-day trial ends, your subscription automatically begins and you'll be charged the plan you selected. You keep full access to all game details, the travel planner, favorites, and more — no interruption. If you cancel before the trial ends, you won't be charged.",
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
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background photo */}
        <div className="absolute inset-0">
          <img src="/images/c2d2c03301c201e23fd4816059b397c4.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF1493]/85 via-[#FF69B4]/75 to-[#87CEEB]/80" />
        </div>

        <div className="max-w-5xl mx-auto px-4 pt-16 pb-12 sm:pt-24 sm:pb-16 text-center relative">
          <div className="flex justify-center gap-2 mb-4">
            <span className="text-2xl opacity-50">🀇</span>
            <span className="text-2xl opacity-50">🀄</span>
            <span className="text-2xl opacity-50">🀙</span>
          </div>
          <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-4xl sm:text-5xl lg:text-6xl text-charcoal mb-4 tracking-tight">
            Simple, Transparent{" "}
            <span className="bg-gradient-to-r from-hotpink-500 to-skyblue-500 bg-clip-text text-transparent">Pricing</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-500 mb-2 max-w-2xl mx-auto">
            Full access to every mahjong game, map, and feature.
            <br />
            Start with a 14-day free trial, upgrade when you&apos;re ready.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 sm:py-16 section-warm">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
            {/* Monthly Plan */}
            <div className="mahj-tile p-8 flex flex-col">
              <div className="mb-6">
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
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-hotpink-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup?plan=monthly"
                className="block text-center bg-softpink-100 text-hotpink-500 border-2 border-hotpink-500 px-6 py-3 rounded-xl font-semibold hover:bg-softpink-100 transition-colors"
              >
                Start 14-Day Free Trial
              </Link>
              <p className="text-xs text-slate-400 text-center mt-3 flex items-center justify-center gap-1">
                <CreditCard className="w-3.5 h-3.5" /> Credit card required &middot; Cancel anytime
              </p>
            </div>

            {/* Annual Plan */}
            <div className="mahj-tile p-8 flex flex-col relative border-2 !border-hotpink-500">
              {/* Badges */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <span className="bg-hotpink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </span>
                <span className="bg-skyblue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Save 33%
                </span>
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
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-hotpink-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup?plan=annual"
                className="block text-center bg-gradient-to-r from-hotpink-500 to-hotpink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-hotpink-600 hover:to-hotpink-700 transition-all shadow-sm"
              >
                Start 14-Day Free Trial
              </Link>
              <p className="text-xs text-slate-400 text-center mt-3 flex items-center justify-center gap-1">
                <CreditCard className="w-3.5 h-3.5" /> Credit card required &middot; Cancel anytime
              </p>
            </div>
          </div>

          {/* Trial Note */}
          <div className="text-center mt-8 bg-softpink-100 border border-hotpink-200 rounded-xl px-6 py-4 max-w-lg mx-auto">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-hotpink-500" />
              <span className="font-semibold text-charcoal">14-Day Free Trial</span>
            </div>
            <p className="text-slate-500 text-sm">
              Credit card required to start. You won&apos;t be charged until your trial ends. Cancel anytime — no risk, no commitment.
            </p>
          </div>
        </div>
      </section>

      {/* Tier Comparison */}
      <section className="py-12 sm:py-16 section-mint">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mahj-divider mb-6">
            <span className="text-2xl">🀄</span>
          </div>
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-center text-charcoal mb-10">
            Compare Access Levels
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {/* Visitor (no account) */}
            <div className="mahj-tile p-6 text-center">
              <div className="w-12 h-12 bg-skyblue-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-skyblue-200">
                <X className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="font-[family-name:var(--font-heading)] font-bold text-lg text-charcoal mb-1">
                Visitor
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Browse without an account
              </p>
              <div className="text-2xl font-bold text-charcoal mb-4">$0</div>
              <ul className="text-sm text-slate-500 space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-hotpink-500 shrink-0" />
                  Search any city
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-hotpink-500 shrink-0" />
                  See game count per city
                </li>
                <li className="flex items-center gap-2">
                  <X className="w-4 h-4 text-slate-300 shrink-0" />
                  <span className="text-slate-400">Game details blurred</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="w-4 h-4 text-slate-300 shrink-0" />
                  <span className="text-slate-400">No map or directions</span>
                </li>
              </ul>
            </div>

            {/* Trial Tier */}
            <div className="mahj-tile p-6 text-center !border-hotpink-400">
              <div className="w-12 h-12 bg-skyblue-100 rounded-xl flex items-center justify-center mx-auto mb-4 border border-skyblue-200">
                <Star className="w-6 h-6 text-hotpink-500" />
              </div>
              <h3 className="font-[family-name:var(--font-heading)] font-bold text-lg text-charcoal mb-1">
                Free Trial
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                14 days free, then subscribes
              </p>
              <div className="text-2xl font-bold text-charcoal mb-1">$0</div>
              <p className="text-xs text-slate-400 mb-3">Credit card required, cancel anytime</p>
              <ul className="text-sm text-slate-500 space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-hotpink-500 shrink-0" />
                  All game details unlocked
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-hotpink-500 shrink-0" />
                  Interactive map + directions
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-hotpink-500 shrink-0" />
                  Travel Planner access
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-hotpink-500 shrink-0" />
                  All subscriber features
                </li>
              </ul>
            </div>

            {/* Subscriber Tier */}
            <div className="mahj-tile p-6 text-center !border-hotpink-500 !border-2 bg-gradient-to-br from-hotpink-50 via-skyblue-50 to-hotpink-50">
              <div className="w-12 h-12 bg-hotpink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-[family-name:var(--font-heading)] font-bold text-lg text-charcoal mb-1">
                Subscriber
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Full access forever
              </p>
              <div className="text-2xl font-bold text-hotpink-500 mb-4">
                $3.33<span className="text-sm font-normal text-slate-500">/mo</span>
              </div>
              <ul className="text-sm text-slate-500 space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-hotpink-500 shrink-0" />
                  Everything in Trial, forever
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-hotpink-500 shrink-0" />
                  Alerts for new games
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-hotpink-500 shrink-0" />
                  &ldquo;Verified Player&rdquo; badge
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-hotpink-500 shrink-0" />
                  Priority city requests
                </li>
              </ul>
            </div>
          </div>

          {/* CTA under tiers */}
          <div className="text-center mt-8">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-hotpink-500 to-hotpink-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-hotpink-600 hover:to-hotpink-700 transition-all shadow-sm"
            >
              Start 14-Day Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16 section-warm">
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
              Run a mahjong group?
            </h3>
            <p className="text-slate-500 mb-6">
              Listing your group on MahjNearMe is completely free. Tell us about your group and we&apos;ll add it to the directory within 48 hours.
            </p>
            <Link
              href="/add-your-group"
              className="inline-flex items-center gap-2 bg-hotpink-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-hotpink-600 transition-colors"
            >
              List Your Group for Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
