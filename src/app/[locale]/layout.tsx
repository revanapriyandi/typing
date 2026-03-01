/* eslint-disable @next/next/next-script-for-ga */
import type { Metadata } from "next";
import "../globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";

import { DisableDevTools } from "@/components/DisableDevTools";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`../../../messages/${locale}.json`)).default;
  const t = messages.Metadata;

  return {
    title: {
      default: t.title,
      template: `%s | TypeRush`
    },
    description: t.description,
    keywords: ["typing test", "WPM", "typing speed", "leaderboard", "online typing", "type race", "fast typing", "TypeRush"],
    authors: [{ name: "TypeRush Team" }],
    creator: "TypeRush",
    openGraph: {
      type: "website",
      locale: locale === "id" ? "id_ID" : "en_US",
      url: "https://type-rust.vercel.app",
      title: t.ogTitle,
      description: t.ogDescription,
      siteName: "TypeRush",
      images: [{
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TypeRush — Online Typing Speed Test",
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: t.twitterTitle,
      description: t.twitterDescription,
      images: ["/og-image.png"],
    },
    icons: {
      icon: "/icon.png",
      shortcut: "/icon.png",
      apple: "/icon.png",
    },
    manifest: "/manifest.json",
    metadataBase: new URL("https://type-rust.vercel.app"),
    verification: {
      google: "45UrIXtcX7bCpQ-QiDX32flCcABUU4JB6I4f7hE5Bh0",
    },
  };
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!['en', 'id'].includes(locale)) notFound();
  
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
             __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WVL9SWJK');`
          }}
        />
      </head>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WVL9SWJK"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider>
            <AuthProvider>
              <DisableDevTools />
              <Navbar />
              <main className="pt-14 min-h-screen">{children}</main>
              <Toaster position="bottom-right" />
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
