/**
 * Google Ads (gtag.js) helpers.
 *
 * The base tag is loaded in src/app/layout.tsx. This module provides type-safe
 * helpers for firing specific conversion events.
 *
 * Configuration:
 * - GOOGLE_ADS_ID is hardcoded (it's a public ID baked into every page anyway)
 *   but can be overridden via NEXT_PUBLIC_GOOGLE_ADS_ID for staging/testing.
 * - The per-conversion *label* (the part after the slash in `send_to`) comes
 *   from env vars so individual conversions can be added without redeploying
 *   the whole gtag setup.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export const GOOGLE_ADS_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "AW-18059793467";

const SUBSCRIPTION_LABEL =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_SUBSCRIPTION_LABEL || "";

export const SUBSCRIPTION_VALUES = {
  monthly: 4.99,
  annual: 39.99,
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_VALUES;

const REPORTED_KEY = "mnm_gads_reported_v1";

function alreadyReported(transactionId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(REPORTED_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    return list.includes(transactionId);
  } catch {
    return false;
  }
}

function markReported(transactionId: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(REPORTED_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(transactionId)) {
      list.push(transactionId);
      // Cap to last 100 ids so the entry never grows unbounded.
      const trimmed = list.slice(-100);
      window.localStorage.setItem(REPORTED_KEY, JSON.stringify(trimmed));
    }
  } catch {
    // Silently fail — analytics must never break the app.
  }
}

/**
 * Fires a Google Ads conversion event for a successful subscription.
 *
 * Returns one of:
 * - "sent"           — gtag conversion fired
 * - "dedup"          — already reported this transactionId
 * - "no-config"      — conversion label env var not set yet
 * - "no-gtag"        — gtag.js hasn't loaded (or SSR)
 * - "no-transaction" — missing transactionId / sessionId
 */
export function reportSubscriptionConversion(
  plan: SubscriptionPlan,
  transactionId: string
): "sent" | "dedup" | "no-config" | "no-gtag" | "no-transaction" {
  if (typeof window === "undefined") return "no-gtag";
  if (!transactionId) return "no-transaction";
  if (!SUBSCRIPTION_LABEL) return "no-config";
  if (typeof window.gtag !== "function") return "no-gtag";
  if (alreadyReported(transactionId)) return "dedup";

  const value = SUBSCRIPTION_VALUES[plan];

  window.gtag("event", "conversion", {
    send_to: `${GOOGLE_ADS_ID}/${SUBSCRIPTION_LABEL}`,
    value,
    currency: "USD",
    transaction_id: transactionId,
  });

  markReported(transactionId);
  return "sent";
}
