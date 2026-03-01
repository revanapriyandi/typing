import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";

import { DisableDevTools } from "@/components/DisableDevTools";

export const metadata: Metadata = {
  title: "TypeRush — Online Typing Speed Test",
  description: "Test your typing speed, compete globally, and earn achievements with TypeRush.",
  keywords: ["typing test", "WPM", "typing speed", "leaderboard", "online typing"],
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
