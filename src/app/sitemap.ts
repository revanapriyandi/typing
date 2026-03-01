import { MetadataRoute } from "next";

const locales = ["en", "id"];
const baseUrl = "https://typerush-app.web.app";

function getUrl(path: string, locale: string) {
  return `${baseUrl}/${locale}${path === "/" ? "" : path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "/", changeFrequency: "weekly" as const, priority: 1 },
    { path: "/test", changeFrequency: "monthly" as const, priority: 0.9 },
    { path: "/multiplayer", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/leaderboard", changeFrequency: "always" as const, priority: 0.8 },
    { path: "/profile", changeFrequency: "weekly" as const, priority: 0.7 },
    { path: "/tournament", changeFrequency: "weekly" as const, priority: 0.8 },
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    for (const locale of locales) {
      sitemapEntries.push({
        url: getUrl(route.path, locale),
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages: {
            en: getUrl(route.path, "en"),
            id: getUrl(route.path, "id"),
          },
        },
      });
    }
  }

  return sitemapEntries;
}
