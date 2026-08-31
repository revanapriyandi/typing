import { MetadataRoute } from "next";
import { absoluteUrl, languageAlternates, localePath, LOCALES } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "/", changeFrequency: "weekly" as const, priority: 1 },
    { path: "/test", changeFrequency: "monthly" as const, priority: 0.9 },
    { path: "/multiplayer", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/leaderboard", changeFrequency: "always" as const, priority: 0.8 },
    { path: "/tournament", changeFrequency: "weekly" as const, priority: 0.8 },
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    for (const locale of LOCALES) {
      const path = localePath(locale, route.path);
      sitemapEntries.push({
        url: absoluteUrl(path),
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages: languageAlternates(route.path),
        },
      });
    }
  }

  return sitemapEntries;
}
