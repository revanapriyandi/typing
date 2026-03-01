"use client";

import { useState, useEffect, useRef, memo, forwardRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTypingEngine } from "@/hooks/useTypingEngine";
import { useAuth } from "@/context/AuthContext";
import { saveScore, updateUserStats, unlockAchievements, getUserProfile } from "@/lib/firestore";
import { checkAchievements, ACHIEVEMENTS } from "@/lib/achievements";
import { toast } from "sonner";
import { Language } from "@/lib/words";
import Link from "next/link";
import { RotateCcw, Trophy, Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Memoized Character component to eliminate typing input lag!
const Character = memo(forwardRef<HTMLSpanElement, { char: string, status: string, isCurrent: boolean }>(({ char, status, isCurrent }, ref) => {
  return (
    <span
      ref={ref}
      className={
        status === "correct" ? "char-correct opacity-100 text-foreground"
        : status === "incorrect" ? "char-incorrect text-destructive opacity-100 bg-destructive/20 rounded-sm"
        : isCurrent ? "char-current bg-primary/20 text-primary border-b-[3px] border-primary cursor-blink rounded-sm"
        : "char-pending opacity-40"
      }
    >
      {char}
    </span>
  );
}));
Character.displayName = "Character";

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
  const [result, setResult] = useState<{ 
    wpm: number; 
    rawWpm: number; 
    accuracy: number; 
    correctChars: number; 
    incorrectChars: number; 
    timeElapsed: number; 
  } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { user } = useAuth();
  const savedRef = useRef(false);

  const activeCharRef = useRef<HTMLSpanElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalBodyRef = useRef<HTMLDivElement>(null);

  const dur = mode === "time" ? time : words;
  const { chars, currentIndex, stats, reset, isMuted, toggleMute } = useTypingEngine({ mode, duration: dur, language: lang });

  // Prevent hydration mismatch on audio toggle
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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
      setResult({ 
        wpm: stats.wpm, 
        rawWpm: stats.rawWpm, 
        accuracy: stats.accuracy,
        correctChars: stats.correctChars,
        incorrectChars: stats.incorrectChars,
        timeElapsed: stats.timeElapsed
      });
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
    if (wpm >= 140) return { text: "Grandmaster", color: "text-amber-500" };
    if (wpm >= 100) return { text: "Expert", color: "text-red-500" };
    if (wpm >= 80)  return { text: "Advanced", color: "text-purple-500" };
    if (wpm >= 60)  return { text: "Proficient", color: "text-blue-500" };
    if (wpm >= 40)  return { text: "Intermediate", color: "text-emerald-500" };
    return { text: "Novice", color: "text-muted-foreground" };
  };

  // Based on real-world global typing distributions
  const calculatePercentile = (wpm: number) => {
    if (wpm >= 140) return 99.9;
    if (wpm >= 120) return 99 + ((wpm - 120) / 20) * 0.9;
    if (wpm >= 100) return 96 + ((wpm - 100) / 20) * 3;
    if (wpm >= 80)  return 90 + ((wpm - 80) / 20) * 6;
    if (wpm >= 60)  return 75 + ((wpm - 60) / 20) * 15;
    if (wpm >= 40)  return 50 + ((wpm - 40) / 20) * 25;
    if (wpm >= 20)  return 10 + ((wpm - 20) / 20) * 40;
    return Math.max(1, (wpm / 20) * 10);
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
              onClick={toggleMute} 
              className="text-muted-foreground hover:text-foreground opacity-50 hover:opacity-100 transition-opacity ml-2" 
              title="Toggle Sound"
            >
              {mounted ? (isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />) : <Volume2 className="w-4 h-4 opacity-0" />}
            </button>
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
              <Character 
                key={i} 
                ref={i === currentIndex ? activeCharRef : null}
                char={c.char} 
                status={c.status} 
                isCurrent={i === currentIndex} 
              />
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

      {/* ── Result Dialog (Redesigned & Fixed Width) ── */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent 
           onOpenAutoFocus={(e) => e.preventDefault()}
           className="max-w-3xl lg:max-w-4xl p-6 md:p-12 overflow-hidden border-border/40 shadow-2xl bg-background rounded-3xl"
        >
          <div className="flex flex-col items-center text-center">
            
            {/* Header */}
            <DialogTitle className="text-3xl font-black font-mono tracking-tighter mb-2">Test Complete</DialogTitle>
            <div className="text-sm font-mono text-muted-foreground uppercase opacity-80 tracking-widest mb-6">
               {mode === "time" ? `${time}s` : `${words} words`} • {lang}
            </div>

            {/* Main Stats (WPM & Accuracy) - Removed flex wrap entirely, enforcing side-by-side with smaller fonts */}
            <div className="flex flex-row justify-center items-center gap-12 sm:gap-24 w-full mb-10 border-b border-border/30 pb-10">
               <div className="flex flex-col items-center flex-1 max-w-[200px]">
                 <div className="text-sm font-bold text-muted-foreground uppercase tracking-[0.3em] mb-4 opacity-70">WPM</div>
                 <div className="text-7xl sm:text-8xl md:text-9xl font-black font-mono text-primary leading-none tracking-tighter">
                   {result?.wpm ?? 0}
                 </div>
               </div>
               <div className="w-px h-24 bg-border/40 hidden sm:block"></div>
               <div className="flex flex-col items-center flex-1 max-w-[200px]">
                 <div className="text-sm font-bold text-muted-foreground uppercase tracking-[0.3em] mb-4 opacity-70">Accuracy</div>
                 <div className="text-7xl sm:text-8xl md:text-9xl font-black font-mono text-foreground leading-none tracking-tighter flex items-start">
                   {result?.accuracy ?? 0}<span className="text-3xl sm:text-4xl md:text-5xl opacity-40 mt-2">%</span>
                 </div>
               </div>
            </div>

            {/* Additional Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 w-full p-6 bg-muted/30 rounded-2xl border border-border/50 mb-8 sm:mb-10 content-center justify-items-center">
               <div className="flex flex-col items-center gap-1">
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider opacity-70">Rank</span>
                 <span className="text-2xl font-black font-mono text-amber-500">
                    {result?.wpm ? `Top ${(100 - calculatePercentile(result.wpm)).toFixed(result.wpm >= 140 ? 1 : 0)}%` : 'N/A'}
                 </span>
               </div>
               <div className="flex flex-col items-center gap-1">
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider opacity-70">Raw WPM</span>
                 <span className="text-2xl font-black font-mono">{result?.rawWpm ?? 0}</span>
               </div>
               <div className="flex flex-col items-center gap-1">
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider opacity-70">Chars</span>
                 <div className="text-2xl font-black font-mono flex items-center gap-1">
                   <span className="text-emerald-500">{result?.correctChars ?? 0}</span>
                   <span className="opacity-30 text-xl">/</span>
                   <span className="text-destructive">{result?.incorrectChars ?? 0}</span>
                 </div>
               </div>
               <div className="flex flex-col items-center gap-1">
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider opacity-70">Time</span>
                 <span className="text-2xl font-black font-mono">{result?.timeElapsed ? Math.floor(result.timeElapsed) : 0}s</span>
               </div>
               <div className="flex flex-col items-center gap-1 lg:col-span-1 col-span-2">
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider opacity-70">Rating</span>
                 <span className={`text-xl font-black tracking-tight ${getRating(result?.wpm ?? 0).color}`}>
                   {getRating(result?.wpm ?? 0).text.split(' ')[0]}
                 </span>
               </div>
            </div>

            {/* Save Status */}
            {user && !user.isAnonymous ? (
              <div className="text-emerald-500 font-bold text-sm tracking-wide mb-6">
                ⭐ Score saved to global leaderboard
              </div>
            ) : (
              <div className="text-amber-500 font-bold text-sm tracking-wide mb-6">
                🔒 Sign in to save your scores globally
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
               <Button onClick={restart} className="flex-1 h-14 rounded-xl text-lg font-bold shadow-sm" size="lg">
                 <RotateCcw className="w-5 h-5 mr-2" /> Try Again <kbd className="hidden sm:inline-block ml-2 px-1.5 py-0.5 bg-background/20 rounded text-[10px] font-mono opacity-70">Tab</kbd>
               </Button>
               <Button asChild variant="outline" size="lg" className="flex-1 h-14 rounded-xl font-bold shadow-sm bg-background/50 hover:bg-background">
                 <Link href="/leaderboard">
                   <Trophy className="w-5 h-5 mr-2 text-primary" /> Leaderboard
                 </Link>
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
