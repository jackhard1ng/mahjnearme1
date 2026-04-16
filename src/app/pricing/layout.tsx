import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Unlock Every Mahjong Listing",
  description:
    "Search 2,000+ mahjong groups, clubs, and tournaments across all 50 states. Free tier lets you browse; upgrade to unlock contact details for every listing and enter the monthly giveaway.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "MahjNearMe Pricing — Find Your Next Mahjong Game",
    description: "Affordable plans to unlock every mahjong listing in the country.",
    url: "/pricing",
    type: "website",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
