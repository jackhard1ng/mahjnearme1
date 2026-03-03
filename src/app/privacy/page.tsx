import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "MahjNearMe privacy policy — how we collect, use, and protect your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-[family-name:var(--font-heading)] font-bold text-3xl text-charcoal mb-2">
        Privacy Policy
      </h1>
      <p className="text-sm text-slate-400 mb-8">Last updated: March 1, 2026</p>

      <div className="prose prose-slate max-w-none space-y-6">
        <section>
          <h2 className="font-semibold text-xl text-charcoal mb-3">1. Information We Collect</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            When you create an account, we collect your name, email address, and optional profile information (skill level, home city, game style preferences). We use Firebase Authentication to securely manage your login credentials. If you subscribe, payment processing is handled entirely by Stripe — we never store your credit card information directly.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-charcoal mb-3">2. How We Use Your Information</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We use your information to: provide personalized search results, manage your subscription, send transactional emails (welcome, trial reminders, weekly digests), and improve our service. We do not sell your personal information to third parties.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-charcoal mb-3">3. Location Data</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            If you use the &ldquo;Use My Location&rdquo; feature, we access your device&apos;s GPS coordinates to show nearby games. This location data is used only for search and is not stored on our servers. You can always search by city name instead.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-charcoal mb-3">4. Cookies & Analytics</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We use Google Analytics 4 to understand how visitors use our site. This includes anonymized usage data such as pages visited, search queries, and device type. We use essential cookies for authentication and preferences.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-charcoal mb-3">5. Third-Party Services</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We use the following third-party services: Firebase (authentication and database), Stripe (payment processing), Google Maps (map display), Google Analytics (site analytics), and SendGrid (email delivery). Each of these services has their own privacy policy governing how they handle your data.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-charcoal mb-3">6. Data Security</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We implement industry-standard security measures including HTTPS encryption, Firebase security rules for database access control, and Stripe&apos;s PCI-compliant payment processing. Your password is never stored in plain text.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-charcoal mb-3">7. Your Rights</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            You have the right to access, update, or delete your personal information at any time. You can manage your account settings from your profile page, or contact us at hello@mahjnearme.com to request data deletion.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-xl text-charcoal mb-3">8. Contact</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            If you have any questions about this privacy policy, contact us at hello@mahjnearme.com.
          </p>
        </section>
      </div>
    </div>
  );
}
