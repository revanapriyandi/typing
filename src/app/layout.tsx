import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";

import { DisableDevTools } from "@/components/DisableDevTools";

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
    url: "https://typerush-app.web.app",
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
  metadataBase: new URL("https://typerush-app.web.app"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <DisableDevTools />
            <Navbar />
            <main className="pt-14 min-h-screen">{children}</main>
            <Toaster position="bottom-right" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
