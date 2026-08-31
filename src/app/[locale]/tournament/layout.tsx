import type { Metadata } from "next";
import { createPageMetadata, getLocaleMessages, type Locale } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getLocaleMessages(locale);
  const t = messages?.Tournament;
  return createPageMetadata({
    locale: locale as Locale,
    title: locale === "id" ? "Turnamen Mengetik Online" : "Online Typing Tournaments",
    description: t?.subtitle || "Join scheduled typing tournaments and compete for the global top spot.",
    path: "/tournament",
  });
}

export default function TournamentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
