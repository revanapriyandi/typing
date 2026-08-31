import type { Metadata } from "next";
import { createPageMetadata, getLocaleMessages, type Locale } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getLocaleMessages(locale);
  const t = messages?.Leaderboard;
  return createPageMetadata({
    locale: locale as Locale,
    title: locale === "id" ? "Peringkat Kecepatan Mengetik Global" : "Global Typing Speed Leaderboard",
    description: t?.description || "Compare typing speed and accuracy with typists around the world.",
    path: "/leaderboard",
  });
}

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
