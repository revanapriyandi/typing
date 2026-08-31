import type { Metadata } from "next";
import { createPageMetadata, getLocaleMessages, type Locale } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getLocaleMessages(locale);
  const t = messages?.Metadata;
  return createPageMetadata({
    locale: locale as Locale,
    title: locale === "id" ? "Tes Kecepatan Mengetik Online Gratis" : "Free Online Typing Speed Test",
    description: t?.description || "Measure your WPM and accuracy with a free online typing test.",
    path: "/test",
  });
}

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
