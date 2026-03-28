import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Monthly Drawing Rules",
  description: "Official rules for the MahjNearMe monthly subscriber drawing.",
};

export default function SweepstakesRulesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-charcoal mb-4">
        Monthly Subscriber Drawing Rules
      </h1>
      <p className="text-sm text-slate-500 mb-8">Last updated: March 28, 2026</p>

      <div className="prose prose-slate max-w-none space-y-6">
        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">1. Sponsor</h2>
          <p className="text-sm text-slate-600">
            The MahjNearMe Monthly Subscriber Drawing (&ldquo;Drawing&rdquo;) is sponsored by
            MahjNearMe (&ldquo;Sponsor&rdquo;), located in Kansas City, MO.
          </p>
        </div>

        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">2. Eligibility</h2>
          <p className="text-sm text-slate-600 mb-2">
            The Drawing is open to active paid subscribers of MahjNearMe who are legal residents
            of the fifty (50) United States and the District of Columbia, and who are eighteen (18)
            years of age or older. The Drawing is void where prohibited by law.
          </p>
          <p className="text-sm text-slate-600">
            Employees, officers, and directors of MahjNearMe, and their immediate family members
            and household members, are not eligible.
          </p>
        </div>

        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">3. Drawing Period</h2>
          <p className="text-sm text-slate-600">
            Each monthly Drawing period begins on the first (1st) day of the calendar month and
            ends on the last day of that calendar month. The Sponsor reserves the right to modify
            or discontinue the Drawing at any time with reasonable notice posted on the website.
          </p>
        </div>

        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">4. How to Enter</h2>
          <p className="text-sm text-slate-600 mb-3">
            Active paid subscribers to MahjNearMe are automatically entered into each monthly
            Drawing during the duration of their active subscription. Monthly subscribers receive
            one (1) entry per Drawing period. Annual subscribers receive two (2) entries per
            Drawing period.
          </p>
          <p className="text-sm text-slate-600">
            Subscribers who have maintained an active subscription for six (6) or more consecutive
            months earn one (1) additional bonus entry for every six months subscribed, up to a
            maximum of six (6) bonus entries.
          </p>
        </div>

        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">5. Prize</h2>
          <p className="text-sm text-slate-600 mb-2">
            One (1) prize will be awarded per Drawing period. The prize will be a mahjong-related
            item (such as a mahjong set, tile rack, carrying case, mat, or other mahjong
            accessory). The specific prize and its approximate retail value will be announced
            on the giveaway page at the beginning of each Drawing period.
          </p>
          <p className="text-sm text-slate-600">
            Prize is awarded &ldquo;as is.&rdquo; No cash or other substitution is permitted,
            except by Sponsor who reserves the right to substitute a prize of equal or greater
            value. Prize will be shipped within the continental United States only. Winner is
            responsible for any applicable taxes.
          </p>
        </div>

        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">6. Winner Selection</h2>
          <p className="text-sm text-slate-600 mb-2">
            On or about the last day of each Drawing period, one (1) winner will be selected
            by random drawing from all eligible entries. The winner will be notified by email
            (and by phone if provided) within forty-eight (48) hours.
          </p>
          <p className="text-sm text-slate-600">
            The winner must respond within fourteen (14) calendar days to claim the prize and
            provide a valid shipping address. If the winner cannot be reached or fails to respond,
            an alternate winner may be selected.
          </p>
        </div>

        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">7. Odds of Winning</h2>
          <p className="text-sm text-slate-600">
            Odds of winning depend on the total number of eligible entries during the Drawing period.
          </p>
        </div>

        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">8. General Conditions</h2>
          <p className="text-sm text-slate-600">
            By participating, subscribers agree to be bound by these rules. Sponsor reserves the
            right to cancel, modify, or suspend the Drawing at any time. All federal, state, and
            local laws apply. Tax obligations are the sole responsibility of the winner.
          </p>
        </div>

        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">9. Privacy</h2>
          <p className="text-sm text-slate-600">
            Personal information is handled in accordance with the Sponsor&apos;s{" "}
            <a href="/privacy" className="text-hotpink-500 hover:text-hotpink-600">Privacy Policy</a>.
          </p>
        </div>

        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">10. Winner Announcement</h2>
          <p className="text-sm text-slate-600">
            With the winner&apos;s permission, their first name, last initial, and city/state
            may be displayed on the MahjNearMe giveaway page.
          </p>
        </div>

        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">11. Governing Law</h2>
          <p className="text-sm text-slate-600">
            This Drawing is governed by the laws of the State of Missouri. Any disputes shall
            be resolved in the state or federal courts located in Jackson County, Missouri.
          </p>
        </div>
      </div>
    </div>
  );
}
