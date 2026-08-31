import type { Metadata } from "next";
import { createPageMetadata, type Locale } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return createPageMetadata({
    locale: locale as Locale,
    title: locale === "id" ? "Detail Turnamen Mengetik" : "Typing Tournament Details",
    description: locale === "id" ? "Lihat bagan dan pertandingan turnamen mengetik TypeRush." : "View the bracket and live matches for this TypeRush typing tournament.",
    path: "/tournament",
    noIndex: true,
  });
}

export default function TournamentDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
