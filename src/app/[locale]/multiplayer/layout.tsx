import type { Metadata } from "next";
import { createPageMetadata, getLocaleMessages, type Locale } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getLocaleMessages(locale);
  const t = messages?.Multiplayer;
  return createPageMetadata({
    locale: locale as Locale,
    title: locale === "id" ? "Balap Mengetik Multipemain Real-time" : "Real-time Multiplayer Typing Race",
    description: t?.heroDesc || "Race your friends in a real-time multiplayer typing competition.",
    path: "/multiplayer",
  });
}

export default function MultiplayerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
