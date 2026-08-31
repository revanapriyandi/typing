import type { Metadata } from "next";

export const LOCALES = ["en", "id"] as const;
export type Locale = (typeof LOCALES)[number];

// Keep the public URL in one place so canonical links, social previews,
// robots.txt and sitemap.xml always point at the same production origin.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://typing.kosclub.qzz.io"
).replace(/\/+$/, "");

export function absoluteUrl(path = "") {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function localePath(locale: Locale, path = "") {
  const suffix = path && path !== "/" ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `/${locale}${suffix}`;
}

export function languageAlternates(path = "") {
  return {
    en: absoluteUrl(localePath("en", path)),
    id: absoluteUrl(localePath("id", path)),
    // The middleware only serves localized routes, so a non-localized path
    // such as `/test` would be a 404. Use English as the neutral fallback.
    "x-default": absoluteUrl(path === "/" || path === "" ? "/" : localePath("en", path)),
  };
}

export function createPageMetadata({
  locale,
  title,
  description,
  path = "",
  noIndex = false,
}: {
  locale: Locale;
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const localizedPath = localePath(locale, path);
  const canonical = absoluteUrl(localizedPath);

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical,
      languages: languageAlternates(path),
    },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      siteName: "TypeRush",
      locale: locale === "id" ? "id_ID" : "en_US",
      images: [
        {
          url: absoluteUrl("/opengraph-image"),
          width: 1200,
          height: 630,
          alt: "TypeRush online typing speed test",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/opengraph-image")],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export async function getLocaleMessages(locale: string) {
  if (locale === "en") return (await import("../../messages/en.json")).default;
  if (locale === "id") return (await import("../../messages/id.json")).default;
  return null;
}
