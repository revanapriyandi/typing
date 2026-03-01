"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Trophy, Zap, Globe, Award, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations, useLocale } from "next-intl";

const DEMO_TEXT = "practice makes perfect when learning to type fast";

const FEATURES = [
  { icon: Zap,      color: "text-amber-500", key: "feat1Title", descKey: "feat1Desc" },
  { icon: Globe,    color: "text-blue-500",  key: "feat2Title", descKey: "feat2Desc" },
  { icon: Award,    color: "text-purple-500", key: "feat3Title", descKey: "feat3Desc" },
  { icon: Keyboard, color: "text-emerald-500", key: "feat4Title", descKey: "feat4Desc" },
];

const BACKGROUND_WORDS = [
  "const", "function", "return", "await", "async", "interface", "type", "import", "export", "class", 
  "extends", "implements", "public", "private", "protected", "static", "readonly", "constructor",
  "speed", "accuracy", "wpm", "keystroke", "practice", "focus", "flow", "rhythm", "muscle", "memory"
];

type AnimatedWord = { id: number; text: string; x: number; y: number; opacity: number; duration: number };

function AnimatedBackground() {
  const [words, setWords] = useState<AnimatedWord[]>([]);
  
  useEffect(() => {
    let idCounter = 0;
    const interval = setInterval(() => {
      setWords(prev => {
        const newWord = {
          id: idCounter++,
          text: BACKGROUND_WORDS[Math.floor(Math.random() * BACKGROUND_WORDS.length)],
          x: Math.random() * 90, // Keep away from extreme edges
          y: Math.random() * 90,
          opacity: 0.02 + Math.random() * 0.04, // Very subtle opacity
          duration: 4 + Math.random() * 5 // Slower, elegant fade
        };
        // Keep only top 15 words to prevent performance issues and clutter
        return [...prev.slice(-14), newWord];
      });
    }, 800);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {words.map(w => (
        <div
          key={w.id}
          className="absolute font-mono text-xl sm:text-3xl font-bold text-foreground transition-all ease-in-out select-none"
          style={{
            left: `${w.x}%`,
            top: `${w.y}%`,
            opacity: w.opacity,
            animation: `fade-in-out ${w.duration}s forwards`,
            "--target-opacity": w.opacity
          } as React.CSSProperties}
        >
          {w.text}
        </div>
      ))}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in-out {
          0% { opacity: 0; transform: translateY(15px) scale(0.95); }
          20% { opacity: var(--target-opacity, 0.05); transform: translateY(0) scale(1); }
          80% { opacity: var(--target-opacity, 0.05); transform: translateY(-5px) scale(1); }
          100% { opacity: 0; transform: translateY(-20px) scale(1.05); }
        }
      `}} />
    </div>
  );
}

export default function HomePage() {
  const [idx, setIdx] = useState(0);
  const [wpm, setWpm] = useState(0);
  const wpmRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = useTranslations("Home");
  const locale = useLocale();

  useEffect(() => {
    if (idx >= DEMO_TEXT.length) {
      timerRef.current = setTimeout(() => { setIdx(0); wpmRef.current = 0; setWpm(0); }, 2200);
      return;
    }
    timerRef.current = setTimeout(() => {
      setIdx((i) => i + 1);
      wpmRef.current = Math.min(105, wpmRef.current + Math.random() * 6);
      setWpm(Math.round(wpmRef.current));
    }, 55 + Math.random() * 40);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [idx]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] w-full antialiased selection:bg-primary/20">

      {/* ── HERO ── */}
      <section className="flex flex-col items-center justify-center text-center px-4 md:px-8 py-20 md:py-32 gap-10 flex-1 relative bg-background overflow-hidden">
        <AnimatedBackground />

        {/* Headline */}
        <div className="space-y-6 max-w-4xl relative z-10 pt-8">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-balance">
            {t("headlinePrefix")}<span className="text-primary italic relative">{t("headlineAccent")}</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground/80 max-w-2xl mx-auto text-balance font-medium leading-relaxed mt-6">
            {t("subheadline")}
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-wrap gap-4 justify-center relative z-10 mt-2">
          <Button asChild size="lg" className="px-10 h-14 text-base font-semibold rounded-full shadow-md transition-all hover:scale-105">
            <Link href={`/${locale}/test`}>
              {t("btnStart")}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="px-10 h-14 text-base font-medium rounded-full bg-background hover:bg-muted shadow-sm transition-all hover:scale-105 border-border/50">
            <Link href={`/${locale}/leaderboard`}>
              <Trophy className="mr-2 w-5 h-5 opacity-70" /> {t("btnLeaderboard")}
            </Link>
          </Button>
        </div>

        {/* ── Demo window ── */}
        <div className="w-full max-w-3xl mt-12 bg-background border border-border/60 rounded-xl relative z-10 overflow-hidden shadow-sm hover:shadow-md hover:border-border/80 transition-all">
          {/* Title bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono font-medium opacity-60 uppercase tracking-[0.2em]">
              {t("preview")}
            </span>
            <div className="flex gap-4 text-right">
              <div className="flex items-baseline gap-1">
                <div className="font-mono font-bold text-sm text-foreground/70">{wpm}</div>
                <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">wpm</div>
              </div>
            </div>
          </div>
          {/* Text */}
          <div className="p-8 md:p-12 font-mono text-xl md:text-3xl leading-relaxed select-none text-left min-h-[140px] text-muted-foreground/30">
            {DEMO_TEXT.split("").map((ch, i) => (
              <span
                key={i}
                className={
                  i < idx   ? "text-foreground opacity-100 transition-opacity"
                  : i === idx ? "border-b-2 border-primary text-foreground"
                  : "transition-opacity"
                }
              >{ch}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="w-full px-4 md:px-8 py-20 border-t border-border/40 bg-zinc-50/50 dark:bg-zinc-950/50">
        <div className="w-full max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, color, key, descKey }) => (
              <div key={key} className="p-6 rounded-2xl bg-background border border-border/50 shadow-sm hover:shadow-md transition-all group">
                <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-muted/50 transition-colors group-hover:bg-muted ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2 tracking-tight">{t(key)}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-sm text-muted-foreground bg-background border-t border-border/30">
        <p>{t("footerText")}</p>
      </footer>
    </div>
  );
}
