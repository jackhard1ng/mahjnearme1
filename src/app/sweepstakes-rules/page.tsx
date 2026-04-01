import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Monthly Drawing Official Rules",
  description: "Official rules for the MahjNearMe monthly sweepstakes drawing. No purchase necessary.",
};

export default function SweepstakesRulesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-charcoal mb-2">
        Monthly Drawing Official Rules
      </h1>
      <p className="text-sm font-bold text-hotpink-500 mb-1">NO PURCHASE NECESSARY TO ENTER OR WIN.</p>
      <p className="text-sm text-slate-500 mb-8">Last updated: April 1, 2026</p>

      <div className="prose prose-slate max-w-none space-y-6">
        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">1. Sponsor</h2>
          <p className="text-sm text-slate-600">
            The MahjNearMe Monthly Drawing (&ldquo;Drawing&rdquo;) is sponsored by
            MahjNearMe (&ldquo;Sponsor&rdquo;), 1125 Grand Blvd Apt 806, Kansas City, MO 64106.
          </p>
        </div>

        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">2. Eligibility</h2>
          <p className="text-sm text-slate-600 mb-2">
            The Drawing is open to legal residents of the fifty (50) United States and the
            District of Columbia who are eighteen (18) years of age or older at the time of entry.
            The Drawing is void where prohibited by law.
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
            ends on the last day of that calendar month at 11:59 PM CT. The Sponsor reserves the
            right to modify or discontinue the Drawing at any time with reasonable notice posted
            on the website.
          </p>
        </div>

        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">4. How to Enter</h2>
          <p className="text-sm font-semibold text-charcoal mb-2">NO PURCHASE NECESSARY.</p>

          <p className="text-sm font-medium text-charcoal mt-3 mb-1">Method 1: Automatic Entry (Paid Subscribers)</p>
          <p className="text-sm text-slate-600 mb-2">
            Active paid subscribers to MahjNearMe are automatically entered into each monthly
            Drawing during the duration of their active subscription. Monthly subscribers receive
            one (1) entry per Drawing period. Annual subscribers receive two (2) entries per
            Drawing period. Subscribers who have maintained an active subscription for six (6) or
            more consecutive months earn one (1) additional bonus entry for every six months
            subscribed, up to a maximum of six (6) bonus entries. Participants must have an active
            paid subscription at the time the Drawing is conducted to be eligible via this method.
          </p>

          <p className="text-sm font-medium text-charcoal mt-3 mb-1">Method 2: Free Mail-In Entry (No Purchase Necessary)</p>
          <p className="text-sm text-slate-600 mb-2">
            To enter without making a purchase, hand print your full name, email address, city,
            and state on a 3&quot;x5&quot; card or piece of paper and mail it to:
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 mb-2">
            MahjNearMe Monthly Drawing<br />
            1125 Grand Blvd Apt 806<br />
            Kansas City, MO 64106
          </div>
          <p className="text-sm text-slate-600 mb-2">
            Limit one (1) mail-in entry per person per Drawing period. Mail-in entries must be
            postmarked by the last day of the Drawing period and received within seven (7) days
            of the Drawing date to be eligible. Mechanically reproduced entries are not accepted.
            Mail-in entries receive one (1) entry, equivalent to a monthly subscriber entry.
          </p>
          <p className="text-sm text-slate-600">
            All entries become the property of the Sponsor and will not be returned.
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
            by random drawing from all eligible entries received via both entry methods. The
            winner will be notified by email (and by phone if provided) within forty-eight (48)
            hours.
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
            Odds of winning depend on the total number of eligible entries received during the
            Drawing period from all entry methods.
          </p>
        </div>

        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">8. General Conditions</h2>
          <p className="text-sm text-slate-600">
            By participating, entrants agree to be bound by these Official Rules. Sponsor reserves
            the right to cancel, modify, or suspend the Drawing at any time. All federal, state,
            and local laws apply. Tax obligations are the sole responsibility of the winner.
            Subscriptions are non-refundable and cancellations after a Drawing are not prorated.
          </p>
        </div>

        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">9. Privacy</h2>
          <p className="text-sm text-slate-600">
            Personal information is handled in accordance with the Sponsor&apos;s{" "}
            <a href="/privacy" className="text-hotpink-500 hover:text-hotpink-600">Privacy Policy</a>.
            Information submitted via mail-in entry will be used solely for the purpose of
            administering the Drawing and will not be shared with third parties.
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
