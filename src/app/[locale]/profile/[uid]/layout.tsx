import type { Metadata } from "next";
import { createPageMetadata, type Locale } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; uid: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return createPageMetadata({
    locale: locale as Locale,
    title: locale === "id" ? "Profil Pengetik TypeRush" : "TypeRush Typist Profile",
    description: locale === "id" ? "Lihat statistik, WPM terbaik, dan pencapaian pengetik TypeRush." : "View a TypeRush typist's WPM, accuracy, history, and achievements.",
    path: "/profile",
    noIndex: true,
  });
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
