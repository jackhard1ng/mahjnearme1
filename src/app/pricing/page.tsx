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
      "When your 14-day trial ends, you'll automatically be subscribed to the plan you selected. If you cancel before the trial ends, your account reverts to the free tier. You can still search for games, but results will be blurred. Subscribe anytime to restore full access.",
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
      <section className="relative overflow-hidden mahj-hero-gradient">
        {/* Floating decorations */}
        <div className="absolute top-8 left-[8%] text-4xl opacity-10 animate-float select-none" aria-hidden="true">🀙</div>
        <div className="absolute bottom-8 right-[12%] text-3xl opacity-10 animate-float select-none" style={{ animationDelay: "1.5s" }} aria-hidden="true">🀇</div>

        <div className="max-w-5xl mx-auto px-4 pt-16 pb-12 sm:pt-24 sm:pb-16 text-center relative">
          <div className="flex justify-center gap-2 mb-4">
            <span className="text-2xl opacity-50">🀇</span>
            <span className="text-2xl opacity-50">🀄</span>
            <span className="text-2xl opacity-50">🀙</span>
          </div>
          <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-4xl sm:text-5xl lg:text-6xl text-slate-900 mb-4 tracking-tight">
            Simple, Transparent{" "}
            <span className="bg-gradient-to-r from-jade-600 to-gold-500 bg-clip-text text-transparent">Pricing</span>
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
                <h3 className="font-[family-name:var(--font-heading)] font-bold text-xl text-slate-900 mb-1">
                  Monthly
                </h3>
                <p className="text-sm text-slate-500">
                  Pay month-to-month, cancel anytime
                </p>
              </div>
              <div className="mb-6">
                <span className="font-[family-name:var(--font-heading)] font-extrabold text-5xl text-slate-900">
                  $4.99
                </span>
                <span className="text-slate-500 ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-jade-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup?plan=monthly"
                className="block text-center bg-ivory-50 text-jade-600 border-2 border-jade-600 px-6 py-3 rounded-xl font-semibold hover:bg-jade-50 transition-colors"
              >
                Start 14-Day Free Trial
              </Link>
              <p className="text-xs text-slate-400 text-center mt-3 flex items-center justify-center gap-1">
                <CreditCard className="w-3.5 h-3.5" /> Credit card required &middot; Cancel anytime
              </p>
            </div>

            {/* Annual Plan */}
            <div className="mahj-tile p-8 flex flex-col relative border-2 !border-jade-500">
              {/* Badges */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <span className="bg-jade-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </span>
                <span className="bg-gold-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Save 33%
                </span>
              </div>
              <div className="mb-6 mt-2">
                <h3 className="font-[family-name:var(--font-heading)] font-bold text-xl text-slate-900 mb-1">
                  Annual
                </h3>
                <p className="text-sm text-slate-500">
                  Best value — billed yearly
                </p>
              </div>
              <div className="mb-6">
                <span className="font-[family-name:var(--font-heading)] font-extrabold text-5xl text-slate-900">
                  $39.99
                </span>
                <span className="text-slate-500 ml-1">/year</span>
                <p className="text-sm text-jade-600 font-medium mt-1">
                  That&apos;s just $3.33/month
                </p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-jade-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup?plan=annual"
                className="block text-center bg-gradient-to-r from-jade-600 to-jade-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-jade-700 hover:to-jade-800 transition-all shadow-sm"
              >
                Start 14-Day Free Trial
              </Link>
              <p className="text-xs text-slate-400 text-center mt-3 flex items-center justify-center gap-1">
                <CreditCard className="w-3.5 h-3.5" /> Credit card required &middot; Cancel anytime
              </p>
            </div>
          </div>

          {/* Trial Note */}
          <div className="text-center mt-8 bg-jade-50 border border-jade-200 rounded-xl px-6 py-4 max-w-lg mx-auto">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-jade-600" />
              <span className="font-semibold text-slate-800">14-Day Free Trial</span>
            </div>
            <p className="text-slate-500 text-sm">
              Credit card required to start. You won&apos;t be charged until your trial ends. Cancel anytime — no risk, no commitment.
            </p>
          </div>
        </div>
      </section>

      {/* Tier Comparison */}
      <section className="py-12 sm:py-16 section-jade">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mahj-divider mb-6">
            <span className="text-2xl">🀄</span>
          </div>
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-center text-slate-900 mb-10">
            Compare Access Levels
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {/* Free Tier */}
            <div className="mahj-tile p-6 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
                <X className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="font-[family-name:var(--font-heading)] font-bold text-lg text-slate-900 mb-1">
                Free
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Search + blurred results
              </p>
              <div className="text-2xl font-bold text-slate-900 mb-4">$0</div>
              <ul className="text-sm text-slate-500 space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-jade-600 shrink-0" />
                  Search any city
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-jade-600 shrink-0" />
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
            <div className="mahj-tile p-6 text-center !border-jade-300">
              <div className="w-12 h-12 bg-jade-100 rounded-xl flex items-center justify-center mx-auto mb-4 border border-jade-200">
                <Star className="w-6 h-6 text-jade-600" />
              </div>
              <h3 className="font-[family-name:var(--font-heading)] font-bold text-lg text-slate-900 mb-1">
                Trial
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                14 days full access
              </p>
              <div className="text-2xl font-bold text-slate-900 mb-1">$0</div>
              <p className="text-xs text-slate-400 mb-3">Credit card required</p>
              <ul className="text-sm text-slate-500 space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-jade-600 shrink-0" />
                  All game details unlocked
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-jade-600 shrink-0" />
                  Interactive map + directions
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-jade-600 shrink-0" />
                  Travel Planner access
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-jade-600 shrink-0" />
                  All subscriber features
                </li>
              </ul>
            </div>

            {/* Subscriber Tier */}
            <div className="mahj-tile p-6 text-center !border-jade-500 !border-2 bg-gradient-to-br from-ivory-50 via-jade-50 to-ivory-100">
              <div className="w-12 h-12 bg-jade-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-[family-name:var(--font-heading)] font-bold text-lg text-slate-900 mb-1">
                Subscriber
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Full access forever
              </p>
              <div className="text-2xl font-bold text-jade-600 mb-4">
                $3.33<span className="text-sm font-normal text-slate-500">/mo</span>
              </div>
              <ul className="text-sm text-slate-500 space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-jade-600 shrink-0" />
                  Everything in Trial, forever
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-jade-600 shrink-0" />
                  Alerts for new games
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-jade-600 shrink-0" />
                  &ldquo;Verified Player&rdquo; badge
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-jade-600 shrink-0" />
                  Priority city requests
                </li>
              </ul>
            </div>
          </div>

          {/* CTA under tiers */}
          <div className="text-center mt-8">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-jade-600 to-jade-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-jade-700 hover:to-jade-800 transition-all shadow-sm"
            >
              Start 14-Day Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16 section-warm">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-center text-slate-900 mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="mahj-tile p-6"
              >
                <h3 className="font-semibold text-lg text-slate-900 mb-2">
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

      {/* Organizer Note */}
      <section className="py-12 sm:py-16 section-gold">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="mahj-tile p-8 bg-gradient-to-br from-mahj-red-50 via-coral-50 to-ivory-100">
            <div className="text-3xl mb-3">🀄</div>
            <h3 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-slate-900 mb-3">
              Are you a mahjong organizer?
            </h3>
            <p className="text-slate-500 mb-6">
              Organizer accounts are always free. List your games, manage your
              group, and reach players across the country — at no cost.
            </p>
            <Link
              href="/add-your-group"
              className="inline-flex items-center gap-2 bg-mahj-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-mahj-red-600 transition-colors"
            >
              List Your Group for Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
