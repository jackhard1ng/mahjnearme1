import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ — Frequently Asked Questions",
  description: "Common questions about MahjNearMe — how to find games, subscription details, organizer listings, and more.",
};

const faqs = [
  {
    category: "Finding Games",
    questions: [
      { q: "How do I find mahjong games near me?", a: "Simply type your city, state, or zip code into the search bar on the homepage. You can also tap 'Use My Location' for GPS-based results. Results show on an interactive map with detailed game cards." },
      { q: "Can I search for games in a city I'm traveling to?", a: "Absolutely! MahjNearMe is built for travelers. Search any city in the US to find games. Subscribers can use the Travel Planner to search by date range — so you can see what's happening during your trip." },
      { q: "What types of mahjong games are listed?", a: "We list American Mahjong, Chinese/Hong Kong Mahjong, and Japanese Riichi Mahjong. You can filter by game style. We also list open play sessions, lessons, leagues, tournaments, and special events." },
      { q: "How do I know if a listing is still active?", a: "Every listing has a verification badge showing when it was last confirmed. Green means verified this week, yellow means this month, and gray means it hasn't been verified recently. We verify listings weekly." },
      { q: "What does 'Drop-in Friendly' mean?", a: "Drop-in friendly means you can show up without an RSVP or registration. Just walk in and join a game! This is especially useful for travelers. You can filter results to only show drop-in friendly games." },
    ],
  },
  {
    category: "Account & Subscription",
    questions: [
      { q: "Is there a free trial?", a: "Yes! When you sign up, you get 14 days of full access. A credit card is required to start, but you won't be charged until the trial ends. You can see all game details, use the travel planner, save favorites, and more." },
      { q: "How much does a subscription cost?", a: "We offer two plans: $4.99/month or $39.99/year (that's just $3.33/month — a 33% savings). Both give you full access to all features." },
      { q: "Can I cancel anytime?", a: "Yes, absolutely. No contracts, no cancellation fees. You can cancel anytime from your account settings or the Stripe customer portal. Your access continues until the end of your billing period." },
      { q: "What happens when my trial ends?", a: "If you don't subscribe, your account reverts to the free tier. You'll still be able to search and see that games exist, but the details will be blurred. You can subscribe at any time to regain full access." },
      { q: "What can I see without an account?", a: "Without an account, you can search and see the map with pins showing where games exist. You'll see one teaser card with partial info and blurred cards for the rest. Sign up for a free trial to see everything!" },
    ],
  },
  {
    category: "For Organizers",
    questions: [
      { q: "How do I list my mahjong group?", a: "Go to the 'Add Your Group' page and fill out the form. Your listing will be reviewed by our team and published within 24-48 hours. Organizer accounts are always free!" },
      { q: "Can I claim an existing listing?", a: "Yes! If we've already listed your group, click 'Claim This Listing' on the game page. Verify your identity and you'll get full control to edit the listing details." },
      { q: "How do I manage my listing?", a: "Once you claim or create a listing, you'll have access to the Organizer Dashboard. From there, you can edit details, update schedules, respond to reviews, and see analytics." },
      { q: "Is it free to list my group?", a: "Yes, listing your group on MahjNearMe is completely free. We want every mahjong game in the country to be listed here!" },
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
