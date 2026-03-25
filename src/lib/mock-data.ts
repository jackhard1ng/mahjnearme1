/**
 * Data access layer — now backed by real listings from /public/listings.json (2,027 listings).
 *
 * This file re-exports the normalized data under the same names that the rest of the
 * codebase expects (mockGames, getCitiesWithGames, etc.) so no import changes are needed.
 */

import {
  loadListings,
  getCitiesWithGames,
  getStatesWithGames,
  getGamesByCity,
  getGamesByState,
} from "@/lib/listings-data";

// The main games array — all 15 files that import `mockGames` continue to work.
export const mockGames = loadListings();

// Re-export helpers
export { getCitiesWithGames, getStatesWithGames, getGamesByCity, getGamesByState };

// --- Products (unchanged, still hardcoded) ---

export const mockProducts: import("@/types").Product[] = [
  {
    id: "prod_1",
    name: "American Mahjong Set \u2014 166 Tiles",
    category: "Mahjong Sets",
    imageUrl: "",
    affiliateLink: "",
    price: "$89.99",
    description: "Complete American Mahjong set with 166 engraved tiles, racks, and carrying case. Perfect for NMJL play.",
    featured: true,
  },
  {
    id: "prod_2",
    name: "2026 NMJL Card",
    category: "Cards & Accessories",
    imageUrl: "",
    affiliateLink: "",
    price: "$15.00",
    description: "Official 2026 National Mah Jongg League card. Required for American Mahjong play.",
    featured: true,
  },
  {
    id: "prod_3",
    name: "Mahjong Tile Rack Set (4 Racks)",
    category: "Cards & Accessories",
    imageUrl: "",
    affiliateLink: "",
    price: "$24.99",
    description: "Set of 4 durable wooden tile racks. Fits standard American and Chinese tiles.",
    featured: false,
  },
  {
    id: "prod_4",
    name: "Mahjong Table Cover \u2014 Green Felt",
    category: "Table Accessories",
    imageUrl: "",
    affiliateLink: "",
    price: "$29.99",
    description: "Non-slip felt table cover for mahjong. Reduces noise, protects tiles and table surface.",
    featured: true,
  },
  {
    id: "prod_5",
    name: "Beginner's Guide to American Mahjong",
    category: "Books & Learning",
    imageUrl: "",
    affiliateLink: "",
    price: "$16.95",
    description: "Step-by-step guide for new players learning American Mahjong with NMJL rules.",
    featured: true,
  },
  {
    id: "prod_6",
    name: "Mahjong Dice Set (3 Dice)",
    category: "Cards & Accessories",
    imageUrl: "",
    affiliateLink: "",
    price: "$6.99",
    description: "Set of 3 standard dice for mahjong. Essential for determining dealer and wall break.",
    featured: false,
  },
];
