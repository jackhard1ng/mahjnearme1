import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "MahjNearMe terms of service — the rules and guidelines for using our platform.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-slate-900 mb-2">
        Terms of Service
      </h1>
      <p className="text-sm text-slate-400 mb-8">Last updated: March 1, 2026</p>

      <div className="prose prose-slate max-w-none space-y-6">
        <section>
          <h2 className="font-semibold text-xl text-slate-800 mb-3">1. Acceptance of Terms</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            By accessing or using MahjNearMe (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-slate-800 mb-3">2. Description of Service</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            MahjNearMe is a directory platform that helps mahjong players find pickup games, open play sessions, lessons, and events across the United States. We provide search functionality, game listings, and organizational tools. We do not host or organize mahjong games ourselves.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-slate-800 mb-3">3. User Accounts</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information when creating an account and to update it as needed. You may not create multiple accounts or share your account with others.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-slate-800 mb-3">4. Subscriptions & Payments</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Free trial accounts have full access for 14 days. Paid subscriptions are billed monthly ($4.99) or annually ($39.99) through Stripe. You may cancel at any time; access continues through the end of your billing period. Refunds are handled on a case-by-case basis — contact us within 7 days of a charge.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-slate-800 mb-3">5. Listing Accuracy</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            While we strive to keep all listings accurate and verified, MahjNearMe is not responsible for changes to game schedules, venues, or availability. We recommend confirming details with the organizer before attending, especially for first-time visits.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-slate-800 mb-3">6. User Conduct</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            You agree not to: submit false or misleading game listings, harass organizers or other users, scrape or bulk download data from the platform, use the Service for any illegal purpose, or attempt to circumvent subscription restrictions.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-slate-800 mb-3">7. Organizer Responsibilities</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Organizers who list games on MahjNearMe are responsible for the accuracy of their listing information. Organizers agree to keep their listings up to date and respond to verification requests in a timely manner.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-slate-800 mb-3">8. Limitation of Liability</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            MahjNearMe is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for any damages arising from your use of the Service, including but not limited to issues at mahjong games found through the platform.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-slate-800 mb-3">9. Changes to Terms</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We may update these terms from time to time. We will notify users of material changes via email. Continued use of the Service after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-slate-800 mb-3">10. Contact</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Questions about these terms? Contact us at hello@mahjnearme.com.
          </p>
        </section>
      </div>
    </div>
  );
}
