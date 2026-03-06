import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Official Sweepstakes Rules",
  description: "Official rules for the MahjNearMe monthly mahjong set giveaway sweepstakes.",
};

// LEGAL NOTE: Sweepstakes laws vary by state. Have this reviewed by legal counsel before launch.

export default function SweepstakesRulesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-charcoal mb-8">
        Official Sweepstakes Rules
      </h1>

      <div className="prose prose-slate max-w-none space-y-6">
        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">1. Sponsor</h2>
          <p className="text-sm text-slate-600">
            The MahjNearMe Monthly Mahjong Set Giveaway (&ldquo;Sweepstakes&rdquo;) is sponsored by
            MahjNearMe (&ldquo;Sponsor&rdquo;).
          </p>
        </div>

        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">2. Eligibility</h2>
          <p className="text-sm text-slate-600">
            Open to legal residents of the United States who are 18 years of age or older at the
            time of entry. Employees of MahjNearMe and their immediate family members are not
            eligible.
          </p>
        </div>

        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">3. Entry Period</h2>
          <p className="text-sm text-slate-600">
            Each monthly Sweepstakes period begins on the 1st of the month at 12:00 AM ET and
            ends on the last day of the month at 11:59 PM ET.
          </p>
        </div>

        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">4. How to Enter</h2>
          <p className="text-sm text-slate-600 mb-3">
            <strong>Automatic Entry (with subscription):</strong> Active paid subscribers are
            automatically entered each month. Annual subscribers receive two (2) entries per month.
            Monthly subscribers receive one (1) entry per month.
          </p>
          <p className="text-sm text-slate-600">
            <strong>Free Entry (no purchase necessary):</strong> To enter without a subscription,
            visit mahjnearme.com/giveaway and submit your email address once per month during
            the entry period. Free entries receive one (1) entry per month.
            No purchase or payment of any kind is necessary to enter or win.
          </p>
        </div>

        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">5. Prize</h2>
          <p className="text-sm text-slate-600">
            One (1) winner per month will receive a premium mahjong set. Approximate retail value:
            $300. Prize details may vary. No cash alternative. Prize is non-transferable.
          </p>
        </div>

        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">6. Winner Selection</h2>
          <p className="text-sm text-slate-600">
            One (1) winner will be selected by random drawing from all eligible entries on or
            about the 1st of the following month. The winner will be notified by email within
            48 hours of the drawing. If the winner does not respond within 14 days, an
            alternate winner may be selected.
          </p>
        </div>

        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">7. Odds of Winning</h2>
          <p className="text-sm text-slate-600">
            Odds of winning depend on the total number of eligible entries received during
            the entry period.
          </p>
        </div>

        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">8. General Conditions</h2>
          <p className="text-sm text-slate-600">
            By entering, participants agree to be bound by these Official Rules. Sponsor
            reserves the right to cancel, modify, or suspend the Sweepstakes at any time.
            All federal, state, and local laws and regulations apply. Any tax obligations
            are the sole responsibility of the winner.
          </p>
        </div>

        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">9. Privacy</h2>
          <p className="text-sm text-slate-600">
            Personal information collected for the Sweepstakes will be used only for
            administering the Sweepstakes and will not be sold to third parties.
            Free entry email addresses are used solely for the purpose of the Sweepstakes.
          </p>
        </div>

        <div className="mahj-tile p-6">
          <h2 className="font-semibold text-xl text-charcoal mb-3">10. Winner Announcement</h2>
          <p className="text-sm text-slate-600">
            Winners may be announced on the MahjNearMe website with their permission.
            Winner&apos;s name and city may be displayed on the giveaway page.
          </p>
        </div>
      </div>
    </div>
  );
}
