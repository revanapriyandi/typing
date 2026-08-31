import { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/private/",
        "/api/", // exclude private API endpoints if any exist
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
