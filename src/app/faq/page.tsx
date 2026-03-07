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
      { q: "How do I find mahjong games near me?", a: "Type your city, state, or zip code into the search bar on the homepage. You can also tap \"Use My Location\" for GPS-based results. Results show on an interactive map with detailed game cards." },
      { q: "Can I search for games in a city I'm traveling to?", a: "Yes. MahjNearMe is built for travelers. Search any city in the US to find games. Subscribers can use the Travel Planner to search by date range so you can see what is happening during your trip." },
      { q: "What types of mahjong games are listed?", a: "We list American Mahjong, Chinese/Hong Kong Mahjong, and Japanese Riichi Mahjong. You can filter by game style. We also list open play sessions, lessons, leagues, tournaments, and special events." },
      { q: "How do I know listings are accurate?", a: "Every listing shows when it was added and when it was last verified by our team. We research and verify listings on a regular cycle. Paid subscribers can see full verification details. If you show up to a game that has moved or stopped, let us know and we will investigate within 48 hours." },
      { q: "How do you find and verify listings?", a: "The MahjNearMe team researches listings by hand across dozens of sources, including local mahjong clubs, community centers, libraries, JCCs, social media groups, and organizer websites. Every listing is individually sourced and verified before it goes live. We run regular verification cycles to confirm listings are still active and accurate. If you find a listing that seems outdated, you can flag it from the listing page and we will investigate." },
      { q: "What does 'Drop-in Friendly' mean?", a: "Drop-in friendly means you can show up without an RSVP or registration. Just walk in and join a game. This is especially useful for travelers. You can filter results to only show drop-in friendly games." },
    ],
  },
  {
    category: "Account & Subscription",
    questions: [
      { q: "What is the difference between browsing without an account and creating a free account?", a: "Without an account you can see that games exist in a city and get a general sense of what is available. Creating a free account is free and lets you see listing details for your home city including event names, neighborhoods, and days of the week. It is a meaningful step up from browsing as a guest, and it costs nothing." },
      { q: "What is the difference between a free account and a paid subscription?", a: "A free account lets you preview a limited number of listings in your home city. A paid subscription unlocks contact information and registration links so you can actually join games, gives you access to every city in the country when you travel or move, enters you automatically in our monthly giveaway, and lets you participate in the community forum." },
      { q: "How much does a subscription cost?", a: `We offer two plans: ${formatCurrency(MONTHLY_PRICE)}/month or ${formatCurrency(ANNUAL_PRICE)}/year (that is just ${formatCurrency(ANNUAL_PRICE / 12)}/month). Both give you full access to all features.` },
      { q: "Can I cancel anytime?", a: "Yes. No contracts, no cancellation fees. You can cancel anytime from your account settings or the Stripe customer portal. Your access continues until the end of your billing period." },
      { q: "How does the monthly giveaway work?", a: "Every paid member is automatically entered every month. No opt-in required. We give away premium mahjong sets and accessories. The longer you have been a member, the more entries you accumulate. Winners are announced at the end of each month and we go bigger on milestone months when the community hits new growth milestones. Giveaway details and past winners are on the Giveaways page." },
    ],
  },
  {
    category: "Listing a Group",
    questions: [
      { q: "Can I submit a listing?", a: "If you know of a mahjong game that is not in our directory, use the \"Suggest a listing\" link on any city page. Our team reviews every submission before it goes live. We do not publish unverified listings. If you are an active organizer or deeply embedded in your local mahjong scene, you may be eligible to apply as a community contributor." },
      { q: "Does it cost anything to get listed?", a: "No, it is completely free. We are building the most complete mahjong directory in the country and we want every group represented." },
      { q: "How do I update my listing?", a: "Reach out to us through the contact form or email. We manage all listings and can update your info quickly." },
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
