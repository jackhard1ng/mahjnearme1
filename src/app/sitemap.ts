import { MetadataRoute } from "next";
import { mockGames, getCitiesWithGames, getStatesWithGames } from "@/lib/mock-data";
import { slugify, getStateName } from "@/lib/utils";
import { getAllPosts } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.mahjnearme.com";

  // Static pages
  const staticPages = [
    { route: "", priority: 1, freq: "daily" as const },
    { route: "/search", priority: 0.9, freq: "daily" as const },
    { route: "/cities", priority: 0.9, freq: "weekly" as const },
    { route: "/pricing", priority: 0.8, freq: "monthly" as const },
    { route: "/giveaways", priority: 0.7, freq: "monthly" as const },
    { route: "/instructors", priority: 0.8, freq: "weekly" as const },
    { route: "/for-organizers", priority: 0.7, freq: "monthly" as const },
    { route: "/events", priority: 0.8, freq: "daily" as const },
    { route: "/about", priority: 0.6, freq: "monthly" as const },
    { route: "/faq", priority: 0.6, freq: "monthly" as const },
    { route: "/shop", priority: 0.5, freq: "monthly" as const },
    { route: "/contact", priority: 0.5, freq: "monthly" as const },
    { route: "/add-your-group", priority: 0.7, freq: "monthly" as const },
    { route: "/privacy", priority: 0.3, freq: "yearly" as const },
    { route: "/terms", priority: 0.3, freq: "yearly" as const },
  ].map(({ route, priority, freq }) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: freq,
    priority,
  }));

  // State pages
  const statePages = getStatesWithGames().map((s) => ({
    url: `${baseUrl}/states/${slugify(s.stateName)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  // City pages
  const cityPages = getCitiesWithGames().map((c) => ({
    url: `${baseUrl}/cities/${slugify(getStateName(c.state))}/${slugify(c.city)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Individual game pages
  const gamePages = mockGames
    .filter((g) => g.status === "active")
    .map((g) => ({
      url: `${baseUrl}/games/${slugify(g.city + "-" + g.state)}/${slugify(g.name)}`,
      lastModified: new Date(g.updatedAt || "2026-03-24"),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  // Organizer profile pages
  // Generate from unique contact names in listings (matching how populate script creates slugs)
  const orgSlugs = new Set<string>();
  for (const g of mockGames) {
    const name = (g.contactName || g.organizerName || "").trim();
    if (!name || name.length < 3) continue;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/(^-|-$)/g, "");
    if (slug.length >= 3) orgSlugs.add(slug);
  }

  const organizerPages = [...orgSlugs].map((slug) => ({
    url: `${baseUrl}/organizer/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Blog posts
  const blogPages = getAllPosts().map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date + "T00:00:00"),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...statePages, ...cityPages, ...gamePages, ...organizerPages, ...blogPages];
}
