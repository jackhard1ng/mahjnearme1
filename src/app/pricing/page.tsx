import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, ArrowRight, CreditCard, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing — MahjNearMe",
  description:
    "Simple, transparent pricing for MahjNearMe. Free account with limited access, or subscribe for full details, maps, travel planner, and more.",
};

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
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
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
            Create a free account to get started. Upgrade to unlock full game details, maps, and more.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 sm:py-16 section-warm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-6 lg:gap-8">
            {/* Free Account */}
            <div className="mahj-tile p-8 flex flex-col">
              <div className="mb-6">
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
              <Link
                href="/signup"
                className="block text-center bg-skyblue-100 text-skyblue-600 border-2 border-skyblue-300 px-6 py-3 rounded-xl font-semibold hover:bg-skyblue-200 transition-colors"
              >
                Create Free Account
              </Link>
            </div>

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
                {subscriberFeatures.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-hotpink-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600">{feature.text}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup?plan=monthly"
                className="block text-center bg-softpink-100 text-hotpink-500 border-2 border-hotpink-500 px-6 py-3 rounded-xl font-semibold hover:bg-softpink-200 transition-colors"
              >
                Start 14-Day Free Trial
              </Link>
              <p className="text-xs text-slate-400 text-center mt-3 flex items-center justify-center gap-1">
                <CreditCard className="w-3.5 h-3.5" /> Credit card required &middot; Cancel anytime
              </p>
            </div>

            {/* Annual Plan */}
            <div className="mahj-tile p-8 flex flex-col relative border-2 !border-hotpink-500">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <span className="bg-hotpink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Best Value
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
                {subscriberFeatures.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-hotpink-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600">{feature.text}</span>
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
              <span className="font-semibold text-charcoal">14-Day Free Trial on Paid Plans</span>
            </div>
            <p className="text-slate-500 text-sm">
              Credit card required to start your trial. You won&apos;t be charged until it ends. Cancel anytime — no risk, no commitment.
            </p>
          </div>
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
