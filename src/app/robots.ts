import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/*", "/api/*", "/account"],
      },
    ],
    sitemap: "https://www.mahjnearme.com/sitemap.xml",
  };
}
