"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="dark"
      themes={['light', 'dark', 'theme-dracula', 'theme-monokai', 'theme-cyberpunk', 'theme-nord']}
      enableSystem
    >
      {children}
    </NextThemesProvider>
  );
}
