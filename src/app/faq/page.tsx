import type { Metadata } from "next";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";
import { MONTHLY_PRICE, ANNUAL_PRICE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "FAQ: Frequently Asked Questions",
  description: "Common questions about MahjNearMe. How to find games, subscription details, adding your group, and more.",
};

const faqs = [
  {
    category: "Finding Games",
    questions: [
      { q: "How do I find mahjong games near me?", a: "Simply type your city, state, or zip code into the search bar on the homepage. You can also tap 'Use My Location' for GPS-based results. Results show on an interactive map with detailed game cards." },
      { q: "Can I search for games in a city I'm traveling to?", a: "Absolutely! MahjNearMe is built for travelers. Search any city in the US to find games. Subscribers can use the Travel Planner to search by date range so you can see what's happening during your trip." },
      { q: "What types of mahjong games are listed?", a: "We list American Mahjong, Chinese/Hong Kong Mahjong, and Japanese Riichi Mahjong. You can filter by game style. We also list open play sessions, lessons, leagues, tournaments, and special events." },
      { q: "How do I know if a listing is still active?", a: "Every listing has a verification badge showing when it was last confirmed. Green means verified this week, yellow means this month, and gray means it hasn't been verified recently. We verify listings weekly." },
      { q: "What does 'Drop-in Friendly' mean?", a: "Drop-in friendly means you can show up without an RSVP or registration. Just walk in and join a game! This is especially useful for travelers. You can filter results to only show drop-in friendly games." },
    ],
  },
  {
    category: "Account & Subscription",
    questions: [
      { q: "What do I get with a free account?", a: "With a free account you get full access to one metro area of your choice. All listings, all details. You can browse other metros and see that games exist, but details are locked. You can also read forum posts in your home metro. Upgrade to unlock all 70+ metros, forum posting, giveaway entries, and more." },
      { q: "Is the free plan really free forever?", a: "Yes. The free plan is permanent, not a trial. You get full access to one metro area forever at no cost. No credit card required. Upgrade whenever you want to unlock all metros and premium features." },
      { q: "How much does a subscription cost?", a: `We offer two plans: ${formatCurrency(MONTHLY_PRICE)}/month or ${formatCurrency(ANNUAL_PRICE)}/year (that's just ${formatCurrency(ANNUAL_PRICE / 12)}/month, a ${Math.round((1 - ANNUAL_PRICE / 12 / MONTHLY_PRICE) * 100)}% savings). Both give you full access to all features.` },
      { q: "Can I cancel anytime?", a: "Yes, absolutely. No contracts, no cancellation fees. You can cancel anytime from your account settings or the Stripe customer portal. Your access continues until the end of your billing period." },
    ],
  },
  {
    category: "Listing a Group",
    questions: [
      { q: "My group isn't listed. How do I add it?", a: "Go to the 'List Your Group' page and fill out the short form. Tell us about your group and we'll add it to the directory within 48 hours, completely free!" },
      { q: "Does it cost anything to get listed?", a: "No, it's completely free. We're building the most complete mahjong directory in the country, and we want every group on here." },
      { q: "How do I update my listing?", a: "Just reach out to us through the contact form or email. We manage all listings and can update your info quickly." },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl sm:text-4xl text-charcoal mb-3">
        Frequently Asked Questions
      </h1>
      <p className="text-slate-500 mb-10">
        Everything you need to know about MahjNearMe. Can&apos;t find your answer?{" "}
        <Link href="/contact" className="text-hotpink-500 hover:text-hotpink-600 font-medium">Contact us</Link>.
      </p>

      <div className="space-y-10">
        {faqs.map((category) => (
          <div key={category.category}>
            <h2 className="font-[family-name:var(--font-heading)] font-bold text-xl text-charcoal mb-4">
              {category.category}
            </h2>
            <div className="space-y-3">
              {category.questions.map((faq) => (
                <details key={faq.q} className="bg-white border border-slate-200 rounded-xl group">
                  <summary className="px-5 py-4 cursor-pointer font-medium text-charcoal hover:text-hotpink-500 transition-colors list-none flex items-center justify-between">
                    {faq.q}
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">&#9662;</span>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
