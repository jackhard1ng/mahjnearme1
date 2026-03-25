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
      { q: "How do I find mahjong games near me?", a: "Type your city, zip code, or address into the search bar on the homepage. You can also tap 'Use my location' for GPS-based results. Results are sorted by distance with an interactive map showing all nearby games." },
      { q: "Can I search for games in a city I'm traveling to?", a: "Yes! Search any city in the US to see what games are happening near your destination." },
      { q: "What types of mahjong games are listed?", a: "We list American Mahjong (NMJL), Chinese/Hong Kong Mahjong, and Japanese Riichi Mahjong. You can filter by game style, day of week, skill level, and whether games are drop-in friendly." },
      { q: "How do I know if a listing is current?", a: "Every listing shows a 'Verified' date — the last time our team confirmed the details. We update the directory weekly with new games and events." },
      { q: "What does 'Drop-in Friendly' mean?", a: "Drop-in friendly means you can show up without an RSVP or registration. Just walk in and join a game!" },
    ],
  },
  {
    category: "Free vs. Paid",
    questions: [
      { q: "What can I see for free?", a: "Everyone can search the full directory, see the map with all game pins, and view complete details for the top result in each search. To unlock details on all other listings — names, venues, contact info, schedules — you need a subscription." },
      { q: "Why can't I see the names of other listings?", a: "Locked listings show the game type, day, distance, and skill level — enough to know a game exists near you. Names and venue details are hidden so the directory can't be bypassed. Subscribing unlocks everything." },
      { q: "How much does a subscription cost?", a: `We offer two plans: ${formatCurrency(MONTHLY_PRICE)}/month or ${formatCurrency(ANNUAL_PRICE)}/year (that's just ${formatCurrency(ANNUAL_PRICE / 12)}/month — a ${Math.round((1 - ANNUAL_PRICE / 12 / MONTHLY_PRICE) * 100)}% savings). Both unlock every listing in all 50 states.` },
      { q: "Can I cancel anytime?", a: "Yes. No contracts, no cancellation fees. Cancel from your account settings anytime. Your access continues until the end of your billing period." },
    ],
  },
  {
    category: "Listing a Group",
    questions: [
      { q: "My group isn't listed. How do I add it?", a: "Go to the 'List Your Group' page and fill out the form. We'll add your group to the directory within 48 hours — completely free." },
      { q: "Does it cost anything to get listed?", a: "No. Listing your group is always free. We want every mahjong game in the country on here." },
      { q: "How do I update my listing?", a: "Email us at hello@mahjnearme.com or use the contact form. We'll update your info quickly." },
    ],
  },
  {
    category: "Monthly Giveaway",
    questions: [
      { q: "How does the monthly giveaway work?", a: "Every month we give away a mahjong accessory — sets, mats, tile racks, and more. Paid subscribers are automatically entered. Annual subscribers get 2x entries. You can also enter for free by submitting your email on the giveaway page." },
      { q: "Do I need to buy something to enter?", a: "No purchase necessary. You can enter for free each month via the giveaway page. Paid subscribers are entered automatically with bonus entries." },
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
