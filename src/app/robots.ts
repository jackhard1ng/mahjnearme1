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
    sitemap: "https://mahjnearme.com/sitemap.xml",
  };
}
