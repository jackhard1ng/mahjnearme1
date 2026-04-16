import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Your Mahjong Group — Free Listing",
  description:
    "List your mahjong group, club, class, or tournament on MahjNearMe. Reach thousands of players searching for games near them. Free to add, quick to set up.",
  alternates: { canonical: "/add-your-group" },
  openGraph: {
    title: "Add Your Mahjong Group to MahjNearMe",
    description: "Help players find your group. Free listing, takes about two minutes.",
    url: "/add-your-group",
    type: "website",
  },
};

export default function AddYourGroupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
