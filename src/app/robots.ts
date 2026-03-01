import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://typerush-app.web.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/private/",
        "/api/", // exclude private API endpoints if any exist
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
