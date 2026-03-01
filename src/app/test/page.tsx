"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTypingEngine } from "@/hooks/useTypingEngine";
import { useAuth } from "@/context/AuthContext";
import { saveScore, updateUserStats, unlockAchievements, getUserProfile } from "@/lib/firestore";
import { checkAchievements, ACHIEVEMENTS } from "@/lib/achievements";
import { toast } from "sonner";
import { Language } from "@/lib/words";
import Link from "next/link";
import { RotateCcw, Trophy, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type TimeMode = 15 | 30 | 60 | 120;
type WordMode = 25 | 50 | 75;
type Mode = "time" | "words";

const TIME_OPTS: TimeMode[] = [15, 30, 60, 120];
const WORD_OPTS: WordMode[] = [25, 50, 75];

export default function TestPage() {
  const [mode, setMode] = useState<Mode>("time");
  const [time, setTime] = useState<TimeMode>(30);
  const [words, setWords] = useState<WordMode>(25);
  const [lang, setLang] = useState<Language>("english");
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{ wpm: number; accuracy: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { user } = useAuth();
  const savedRef = useRef(false);

  const activeCharRef = useRef<HTMLSpanElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalBodyRef = useRef<HTMLDivElement>(null);

  const dur = mode === "time" ? time : words;
  const { chars, currentIndex, stats, reset } = useTypingEngine({ mode, duration: dur, language: lang });

  useEffect(() => {
    if (activeCharRef.current) {
      activeCharRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentIndex]);

  useEffect(() => {
    // Detect browser language on first load
    const browserLang = navigator.language.split('-')[0].toLowerCase();
    const langMap: Record<string, Language> = {
      id: "indonesian",
      es: "spanish",
      fr: "french",
      de: "german",
      en: "english"
    };
    if (langMap[browserLang]) {
      setLang(langMap[browserLang]);
    }
  }, []);

  useEffect(() => {
    if (stats.isFinished && !savedRef.current) {
      savedRef.current = true;
      setResult({ wpm: stats.wpm, accuracy: stats.accuracy });
      setShowResult(true);
      doSave(stats.wpm, stats.accuracy);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.isFinished]);

  useEffect(() => {
    savedRef.current = false;
    setShowResult(false);
    reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, time, words, lang]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      terminalRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const doSave = async (wpm: number, accuracy: number) => {
    if (!user || user.isAnonymous) return;
    try {
      await saveScore({ uid: user.uid, displayName: user.displayName || "Anonymous", photoURL: user.photoURL || "", country: "Unknown", wpm, accuracy, duration: mode === "time" ? time : 0, mode: mode === "time" ? `${time}s` : `${words}w`, language: lang });
      await updateUserStats(user.uid, wpm, mode === "time" ? time : 0);
      const profile = await getUserProfile(user.uid);
      if (profile) {
        const newAchs = checkAchievements({ wpm, accuracy, totalTests: profile.totalTests + 1, unlockedAchievements: profile.achievements || [] }, new Date().getHours());
        if (newAchs.length) {
          await unlockAchievements(user.uid, newAchs);
          newAchs.forEach((id, i) => {
            const a = ACHIEVEMENTS.find((x) => x.id === id);
            if (a) setTimeout(() => toast.success(`${a.icon} ${a.name}`, { description: a.description }), 800 + i * 500);
          });
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to save score");
    }
  };

  const restart = () => { 
    savedRef.current = false; 
    setShowResult(false); 
    reset(); 
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const progressValue = mode === "time"
    ? Math.max(0, (1 - stats.timeLeft / time) * 100)
    : (currentIndex / Math.max(1, chars.length)) * 100;

  const getRating = (wpm: number) => {
    if (wpm >= 130) return { text: "Transcendent 🔥", color: "text-amber-500" };
    if (wpm >= 100) return { text: "Century Typer 💯", color: "text-red-500" };
    if (wpm >= 75)  return { text: "Speed Demon ⚡", color: "text-purple-500" };
    if (wpm >= 50)  return { text: "Getting Fast 🚀", color: "text-blue-500" };
    return { text: "Keep Practicing 🌱", color: "text-emerald-500" };
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 py-12 flex flex-col items-center gap-10">

      {/* ── Unified Terminal Window ── */}
      <div 
        ref={terminalRef}
        className={`w-full mx-auto flex flex-col overflow-hidden transition-all duration-300
          ${isFullscreen ? "h-screen max-w-none rounded-none bg-background border-none" : "max-w-5xl mt-2 rounded-xl bg-background/50 backdrop-blur-xl shadow-2xl border border-border/40"}`}
      >
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-muted/40 border-b border-border/40">
          
          {/* Mac window dots */}
          <div className="flex items-center gap-2 flex-1 group">
            <div className="w-3.5 h-3.5 rounded-full bg-red-500/80 shadow-sm" />
            <div className="w-3.5 h-3.5 rounded-full bg-amber-500/80 shadow-sm" />
            <div 
              onClick={toggleFullscreen}
              className="w-3.5 h-3.5 rounded-full bg-emerald-500/80 shadow-sm flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-2 h-2 text-black opacity-0 group-hover:opacity-100 transition-opacity" /> : <Maximize2 className="w-2 h-2 text-black opacity-0 group-hover:opacity-100 transition-opacity" />}
            </div>
          </div>

          {/* Mode Selector - Terminal Style */}
          <div className="flex items-center gap-6 font-mono text-sm text-muted-foreground/70 tracking-wide flex-none">
            {/* Mode: Time / Words */}
            <div className="flex gap-3">
              <button onClick={() => setMode("time")} className={`transition-all hover:text-foreground ${mode === "time" ? "text-primary font-bold drop-shadow-sm" : ""}`}>time</button>
              <button onClick={() => setMode("words")} className={`transition-all hover:text-foreground ${mode === "words" ? "text-primary font-bold drop-shadow-sm" : ""}`}>words</button>
            </div>

            <Separator orientation="vertical" className="h-5 opacity-40" />

            {/* Options */}
            <div className="flex gap-3">
              {mode === "time"
                ? TIME_OPTS.map((t) => (
                    <button key={t} onClick={() => setTime(t)} className={`transition-all hover:text-foreground ${time === t ? "text-primary font-bold drop-shadow-sm" : ""}`}>{t}s</button>
                  ))
                : WORD_OPTS.map((w) => (
                    <button key={w} onClick={() => setWords(w)} className={`transition-all hover:text-foreground ${words === w ? "text-primary font-bold drop-shadow-sm" : ""}`}>{w}</button>
                  ))
              }
            </div>

            <Separator orientation="vertical" className="h-5 opacity-40" />

            {/* Language */}
            <div className="flex gap-3">
              <button onClick={() => setLang("english")} className={`transition-all hover:text-foreground uppercase ${lang === "english" ? "text-primary font-bold drop-shadow-sm" : ""}`}>en</button>
              <button onClick={() => setLang("indonesian")} className={`transition-all hover:text-foreground uppercase ${lang === "indonesian" ? "text-primary font-bold drop-shadow-sm" : ""}`}>id</button>
              <button onClick={() => setLang("spanish")} className={`transition-all hover:text-foreground uppercase ${lang === "spanish" ? "text-primary font-bold drop-shadow-sm" : ""}`}>es</button>
              <button onClick={() => setLang("french")} className={`transition-all hover:text-foreground uppercase ${lang === "french" ? "text-primary font-bold drop-shadow-sm" : ""}`}>fr</button>
              <button onClick={() => setLang("german")} className={`transition-all hover:text-foreground uppercase ${lang === "german" ? "text-primary font-bold drop-shadow-sm" : ""}`}>de</button>
            </div>
          </div>

          {/* Spacer for right flex */}
          <div className="flex-1 flex justify-end items-center gap-4">
            <div className="text-xs font-mono font-medium opacity-40 uppercase tracking-[0.2em] select-none">
               bash
            </div>
            <button 
              onClick={toggleFullscreen} 
              className="text-muted-foreground hover:text-foreground opacity-50 hover:opacity-100 transition-opacity" 
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Live Stats Header (Only visible when typing) */}
        <div className={`h-14 flex items-center justify-between px-10 text-xl md:text-2xl font-bold font-mono text-primary transition-opacity duration-300 ${stats.isStarted && !stats.isFinished ? "opacity-100 mt-4" : "opacity-0 invisible h-0"}`}>
            <div className="flex items-baseline gap-2">
               {stats.wpm} <span className="text-xs font-bold text-muted-foreground uppercase opacity-70 tracking-widest">wpm</span>
            </div>
            <div className="flex items-baseline gap-2">
               {mode === "time" && Math.ceil(stats.timeLeft)}
               {mode === "time" && <span className="text-xs font-bold text-muted-foreground uppercase opacity-70 tracking-widest">s</span>}
            </div>
        </div>

        {/* Progress bar */}
        {stats.isStarted && !stats.isFinished && (
           <div className="w-full h-0.5 bg-muted/50">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progressValue}%` }} />
           </div>
        )}

        {/* Terminal Body (Typing Area) */}
        <div 
          ref={terminalBodyRef}
          className={`p-10 sm:p-14 md:p-20 relative overflow-hidden flex flex-col ${isFullscreen ? "flex-1" : "h-[450px]"}`}
        >
          {/* Main typing text container */}
          <div className="relative w-full">
            {!stats.isStarted && !stats.isFinished && (
              <div className="absolute top-0 left-0 -mt-7 sm:-mt-8 text-primary/40 font-mono text-xs sm:text-sm flex items-center gap-2 animate-pulse w-full pointer-events-none">
                <span className="opacity-50">~</span> <span className="text-foreground/30">❯</span> <span className="opacity-70">start typing...</span>
              </div>
            )}
            <div
              className={`font-mono text-3xl sm:text-4xl md:text-5xl leading-[1.6] select-none break-words whitespace-pre-wrap transition-opacity duration-500 outline-none w-full pb-32 ${isFullscreen ? "mt-4" : "mt-2"}`}
              style={{ opacity: !stats.isStarted && !stats.isFinished ? 0.4 : 1 }}
              tabIndex={0}
            >
            {chars.map((c, i) => (
              <span
                key={i}
                ref={i === currentIndex ? activeCharRef : null}
                className={
                  i < currentIndex
                    ? c.status === "correct" ? "char-correct opacity-100" : "char-incorrect text-destructive opacity-100 underline decoration-destructive/50"
                    : i === currentIndex ? "char-current border-b-2 border-primary cursor-blink"
                    : "char-pending opacity-40"
                }
              >
                {c.char}
              </span>
            ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer hints ── */}
      <div className="flex items-center justify-between w-full max-w-5xl text-sm font-medium text-muted-foreground">
        <div className="space-x-6">
          <span><kbd className="px-2.5 py-1 bg-muted rounded-md border border-border/50 font-mono text-[11px] shadow-sm uppercase tracking-wider">Tab</kbd> Restart</span>
          <span><kbd className="px-2.5 py-1 bg-muted rounded-md border border-border/50 font-mono text-[11px] shadow-sm uppercase tracking-wider">Esc</kbd> Reset</span>
        </div>
        {user && !user.isAnonymous ? (
          <span className="text-emerald-500 font-semibold flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/> Auto-saving</span>
        ) : (
          <span>Sign in to save scores</span>
        )}
      </div>

      {/* ── Result Dialog ── */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-border/40 shadow-2xl rounded-2xl">
          <DialogHeader className="p-8 pb-4 border-b border-border/40 bg-muted/10">
            <DialogTitle className="text-2xl font-black text-center tracking-tight">Test Complete</DialogTitle>
            {result && <p className={`text-center font-bold text-lg pb-2 mt-2 ${getRating(result.wpm).color}`}>{getRating(result.wpm).text}</p>}
          </DialogHeader>
          
          <div className="p-10 flex flex-col items-center gap-10 bg-background/50 backdrop-blur-xl">
            <div className="flex items-center justify-center gap-16 w-full">
              <div className="text-center">
                <div className="text-6xl md:text-8xl font-black font-mono text-primary tracking-tighter drop-shadow-sm">
                  {result?.wpm ?? 0}
                </div>
                <div className="text-sm uppercase tracking-widest text-muted-foreground font-bold mt-3">wpm</div>
              </div>
              <Separator orientation="vertical" className="h-24 md:h-32 opacity-50" />
              <div className="text-center">
                <div className="text-6xl md:text-8xl font-black font-mono tracking-tighter text-muted-foreground drop-shadow-sm">
                  {result?.accuracy ?? 0}<span className="text-4xl md:text-5xl opacity-50">%</span>
                </div>
                <div className="text-sm uppercase tracking-widest text-muted-foreground font-bold mt-3">accuracy</div>
              </div>
            </div>

            <div className="text-sm md:text-base font-medium text-center text-muted-foreground bg-muted/30 px-6 py-3 rounded-xl border border-border/50 w-full shadow-sm">
              <span className="text-foreground">{mode === "time" ? `${time} seconds` : `${words} words`}</span> <span className="opacity-50 mx-2">•</span> {lang}
              {user && !user.isAnonymous && <span className="text-emerald-500 font-bold ml-2"> <span className="opacity-50 mx-2">•</span> Saved ✓</span>}
            </div>
            
            <div className="flex gap-4 w-full mt-2">
              <Button onClick={restart} className="flex-1 h-14 rounded-xl text-lg font-semibold shadow-sm hover:scale-[1.02] transition-transform" size="lg">
                <RotateCcw className="w-5 h-5 mr-2" /> Try Again
              </Button>
              <Button asChild variant="secondary" size="lg" className="h-14 px-8 rounded-xl shadow-sm hover:scale-[1.02] transition-transform">
                <Link href="/leaderboard">
                  <Trophy className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
