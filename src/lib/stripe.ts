import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
});

// Price ID mapping (test mode)
export const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY || "price_1T73B6GjraIK7CHEHU26CJF2",
  annual: process.env.STRIPE_PRICE_ANNUAL || "price_1T73BeGjraIK7CHE6XzSOnNF",
} as const;

// Reverse lookup: price ID → plan name
export function getPlanFromPriceId(priceId: string): "monthly" | "annual" | null {
  if (priceId === PRICE_IDS.monthly) return "monthly";
  if (priceId === PRICE_IDS.annual) return "annual";
  return null;
}
