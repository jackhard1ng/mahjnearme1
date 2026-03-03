import { MetadataRoute } from "next";
import { mockGames, getCitiesWithGames, getStatesWithGames } from "@/lib/mock-data";
import { slugify, getStateName } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://mahjnearme.com";

  // Static pages
  const staticPages = [
    "",
    "/search",
    "/pricing",
    "/cities",
    "/shop",
    "/about",
    "/faq",
    "/contact",
    "/blog",
    "/add-your-group",
    "/privacy",
    "/terms",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? ("daily" as const) : ("weekly" as const),
    priority: route === "" ? 1 : route === "/search" ? 0.9 : 0.7,
  }));

  // State pages
  const statePages = getStatesWithGames().map((s) => ({
    url: `${baseUrl}/states/${slugify(s.stateName)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // City pages
  const cityPages = getCitiesWithGames().map((c) => ({
    url: `${baseUrl}/cities/${slugify(getStateName(c.state))}/${slugify(c.city)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Game pages
  const gamePages = mockGames
    .filter((g) => g.status === "active")
    .map((g) => ({
      url: `${baseUrl}/games/${slugify(g.city + "-" + g.state)}/${slugify(g.name)}`,
      lastModified: new Date(g.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  return [...staticPages, ...statePages, ...cityPages, ...gamePages];
}
