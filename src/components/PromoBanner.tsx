"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Site-wide promo banner. Edit this to change or remove the promotion.
 * Set enabled to false to hide the banner entirely.
 */
const PROMO = {
  enabled: true,
  code: "LAUNCH",
  text: "Launch deal: First month just $1.99, then $4.99/mo",
  cta: "Subscribe now",
  href: "/pricing",
  /** Set to null for no expiry display, or a date string */
  expires: "April 29, 2026",
};

export default function PromoBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { hasAccess } = useAuth();

  // Don't show promo to paying subscribers
  if (!PROMO.enabled || dismissed || hasAccess) return null;

  return (
    <div className="bg-charcoal text-white text-center text-sm py-2.5 px-4 relative">
      <span>
        🎉 <strong>{PROMO.text}</strong> — use code <code className="bg-white/20 px-1.5 py-0.5 rounded text-xs font-bold">{PROMO.code}</code> at checkout.{" "}
        {PROMO.expires && <span className="text-white/60">Expires {PROMO.expires}.</span>}{" "}
        <Link href={PROMO.href} className="underline font-semibold hover:text-hotpink-300 transition-colors">
          {PROMO.cta} →
        </Link>
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
