"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon, Trophy, LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Defer state update to next tick to avoid React Compiler synchronous effect warning
  useEffect(() => { 
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);
  
  if (!mounted) return <Button variant="ghost" size="icon" className="w-9 h-9" disabled />;
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-9 h-9"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}

export default function Navbar() {
  const { user, signInWithGoogle, logout } = useAuth();
  const isAnon = !user || user.isAnonymous;
  const t = useTranslations("Navigation");
  const locale = useLocale();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="w-full h-full px-4 md:px-8 flex items-center justify-between">

        <Link href={`/${locale}`} className="flex items-center gap-1.5 group mr-8">
          <span className="font-bold text-lg tracking-tight">
            type
          </span>
          <span className="font-bold text-lg tracking-tight text-primary">
            rush
          </span>
        </Link>

        {/* Center links */}
        <div className="hidden sm:flex items-center gap-6">
          {[
            { href: `/${locale}/test`, label: t("test") }, 
            { href: `/${locale}/multiplayer`, label: t("multiplayer") },
            { href: `/${locale}/leaderboard`, label: t("leaderboard") }
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isAnon ? (
            <Button onClick={signInWithGoogle} size="sm" className="font-semibold">
              Sign In
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="outline-none rounded-full ring-offset-background hover:ring-2 hover:ring-ring focus-visible:ring-2 focus-visible:ring-ring transition-all">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.photoURL || ""} />
                    <AvatarFallback className="text-xs font-bold bg-primary text-primary-foreground">
                      {(user.displayName || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem disabled className="text-xs font-medium">
                  {user.displayName}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/${locale}/profile/${user.uid}`} className="flex items-center gap-2">
                    <User className="w-4 h-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/${locale}/leaderboard`} className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" /> Leaderboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  );
}
