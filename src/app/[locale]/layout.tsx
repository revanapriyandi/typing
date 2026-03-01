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

export const metadata: Metadata = {
  title: {
    default: "TypeRush — Online Typing Speed Test",
    template: "%s | TypeRush"
  },
  description: "Test your typing speed, compete globally on real-time leaderboards, unlock achievements, and race against friends in multiplayer mode.",
  keywords: ["typing test", "WPM", "typing speed", "leaderboard", "online typing", "type race", "fast typing", "TypeRush"],
  authors: [{ name: "TypeRush Team" }],
  creator: "TypeRush",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://type-rust.vercel.app",
    title: "TypeRush — Master Your Typing Speed",
    description: "Compete globally and verify your typing WPM with real-time analytics. Join TypeRush today!",
    siteName: "TypeRush",
    images: [{
      url: "/icon.png",
      width: 512,
      height: 512,
      alt: "TypeRush Logo",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TypeRush — Online Typing Speed Test",
    description: "How fast can you type? Find out with TypeRush and compete on the global leaderboard!",
    images: ["/icon.png"],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  manifest: "/manifest.json",
  metadataBase: new URL("https://type-rust.vercel.app"),
};

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
