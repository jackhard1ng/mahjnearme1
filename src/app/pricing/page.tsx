import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, Star, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing — MahjNearMe",
  description:
    "Simple, transparent pricing for MahjNearMe. Start with a 14-day free trial — no credit card required. Full access to mahjong game details, interactive maps, travel planner, alerts, and more.",
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
      "Yes! Every new account gets a 14-day free trial with full access to all features. No credit card required to start.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Absolutely. There are no contracts or commitments. You can cancel your subscription anytime from your account settings.",
  },
  {
    question: "What happens when my trial ends?",
    answer:
      "When your 14-day trial ends, your account reverts to the free tier. You can still search for games, but results will be blurred. Subscribe anytime to restore full access.",
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

const tiers = [
  {
    name: "Free",
    description: "Search + blurred results",
    icon: "magnifying-glass",
  },
  {
    name: "Trial",
    description: "14 days full access",
    icon: "clock",
  },
  {
    name: "Subscriber",
    description: "Full access forever",
    icon: "star",
  },
];

export default function PricingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50 via-white to-white">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #0d9488 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="max-w-5xl mx-auto px-4 pt-16 pb-12 sm:pt-24 sm:pb-16 text-center relative">
          <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-4xl sm:text-5xl lg:text-6xl text-slate-900 mb-4 tracking-tight">
            Simple, Transparent{" "}
            <span className="text-teal-600">Pricing</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-500 mb-2 max-w-2xl mx-auto">
            Full access to every mahjong game, map, and feature.
            <br />
            Start free, upgrade when you&apos;re ready.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
            {/* Monthly Plan */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 flex flex-col">
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
                    <Check className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block text-center bg-white text-teal-600 border-2 border-teal-600 px-6 py-3 rounded-xl font-semibold hover:bg-teal-50 transition-colors"
              >
                Start 14-Day Free Trial
              </Link>
            </div>

            {/* Annual Plan */}
            <div className="rounded-2xl border-2 border-teal-600 bg-white p-8 flex flex-col relative">
              {/* Badges */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <span className="bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded-full">
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
                <p className="text-sm text-teal-600 font-medium mt-1">
                  That&apos;s just $3.33/month
                </p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block text-center bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-700 transition-colors"
              >
                Start 14-Day Free Trial
              </Link>
            </div>
          </div>

          {/* Trial Note */}
          <p className="text-center text-slate-500 text-sm mt-8">
            Start with a 14-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* Tier Comparison */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-center text-slate-900 mb-10">
            Compare Access Levels
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {/* Free Tier */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
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
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  Search any city
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
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
            <div className="bg-white rounded-xl border border-teal-200 p-6 text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="font-[family-name:var(--font-heading)] font-bold text-lg text-slate-900 mb-1">
                Trial
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                14 days full access
              </p>
              <div className="text-2xl font-bold text-slate-900 mb-4">$0</div>
              <ul className="text-sm text-slate-500 space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  All game details unlocked
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  Interactive map + directions
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  Travel Planner access
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  All subscriber features
                </li>
              </ul>
            </div>

            {/* Subscriber Tier */}
            <div className="bg-gradient-to-br from-teal-50 to-white rounded-xl border-2 border-teal-600 p-6 text-center">
              <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-[family-name:var(--font-heading)] font-bold text-lg text-slate-900 mb-1">
                Subscriber
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Full access forever
              </p>
              <div className="text-2xl font-bold text-teal-600 mb-4">
                $3.33<span className="text-sm font-normal text-slate-500">/mo</span>
              </div>
              <ul className="text-sm text-slate-500 space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  Everything in Trial, forever
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  Alerts for new games
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  &ldquo;Verified Player&rdquo; badge
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  Priority city requests
                </li>
              </ul>
            </div>
          </div>

          {/* CTA under tiers */}
          <div className="text-center mt-8">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-teal-700 transition-colors"
            >
              Start 14-Day Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-center text-slate-900 mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="bg-white rounded-xl border border-slate-200 p-6"
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
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-coral-50 to-white rounded-2xl border border-orange-100 p-8">
            <h3 className="font-[family-name:var(--font-heading)] font-bold text-2xl text-slate-900 mb-3">
              Are you a mahjong organizer?
            </h3>
            <p className="text-slate-500 mb-6">
              Organizer accounts are always free. List your games, manage your
              group, and reach players across the country — at no cost.
            </p>
            <Link
              href="/add-your-group"
              className="inline-flex items-center gap-2 bg-coral-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-coral-600 transition-colors"
            >
              List Your Group for Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
