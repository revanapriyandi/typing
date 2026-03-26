"use client";

import { useState, useEffect, useRef } from "react";
import { useTypingEngine } from "@/hooks/useTypingEngine";
import { useAuth } from "@/context/AuthContext";
import { saveScore, updateUserStats, unlockAchievements, getUserProfile, VerifyScoreResponse } from "@/lib/firestore";
import { checkAchievements, ACHIEVEMENTS } from "@/lib/achievements";
import { toast } from "sonner";
import { Language } from "@/lib/words";
import { Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ResultModal } from "@/components/ResultModal";
import { Character } from "@/components/Character";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";



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
  const [customText, setCustomText] = useState("");
  const t = useTranslations("Test");
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
  const [showExitWarning, setShowExitWarning] = useState(false);
  const { user } = useAuth();
  const savedRef = useRef(false);

  const activeCharRef = useRef<HTMLSpanElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalBodyRef = useRef<HTMLDivElement>(null);

  const dur = mode === "time" ? time : words;
  const { chars, currentIndex, stats, reset, isMuted, toggleMute } = useTypingEngine({ mode, duration: dur, language: lang, customText });

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

  const doSave = async (): Promise<VerifyScoreResponse | null> => {
    if (!user || user.isAnonymous) return null;
    try {
      const idToken = await user.getIdToken();
      const verified = await saveScore({
        idToken,
        session: {
          displayName: user.displayName || "Anonymous",
          photoURL: user.photoURL || "",
          country: "Unknown",
          duration: mode === "time" ? time : 0,
          mode: mode === "time" ? `${time}s` : `${words}w`,
          language: lang,
          sourceText: chars.map((c) => c.char).join(""),
          keystrokes: stats.keystrokes,
          timeElapsed: stats.timeElapsed,
        },
      });

      await updateUserStats(user.uid, verified.wpm, mode === "time" ? time : 0, stats.heatmap);
      const profile = await getUserProfile(user.uid);
      if (profile) {
        const newAchs = checkAchievements({ wpm: verified.wpm, accuracy: verified.accuracy, totalTests: profile.totalTests + 1, unlockedAchievements: profile.achievements || [], duration: mode === "time" ? time : 0 }, new Date().getHours());
        if (newAchs.length) {
          await unlockAchievements(user.uid, newAchs);
          newAchs.forEach((id, i) => {
            const a = ACHIEVEMENTS.find((x) => x.id === id);
            if (a) setTimeout(() => toast.success(`${a.icon} ${a.name}`, { description: a.description }), 800 + i * 500);
          });
        }
      }
      return verified;
    } catch (e) {
      console.error(e);
      toast.error("Failed to save score");
      return null;
    }
  };

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
      void doSave().then((verified) => {
        if (verified) {
          setResult({
            wpm: verified.wpm,
            rawWpm: verified.rawWpm,
            accuracy: verified.accuracy,
            correctChars: verified.correctChars,
            incorrectChars: verified.incorrectChars,
            timeElapsed: verified.timeElapsed,
          });
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.isFinished]);

  useEffect(() => {
    savedRef.current = false;
    setShowResult(false);
    reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, time, words, lang, customText]);

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

  useEffect(() => {
    // 1. Prevent accidental reload / tab close via browser's native dialog
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (stats.isStarted && !stats.isFinished) {
        e.preventDefault();
        e.returnValue = ""; // Required for Chrome
        return ""; // Required for older browsers
      }
    };

    // 2. Detect tab switching (visibility change)
    const handleVisibilityChange = () => {
      if (document.hidden && stats.isStarted && !stats.isFinished) {
        setShowExitWarning(true);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [stats.isStarted, stats.isFinished]);

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
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 bg-muted/40 border-b border-border/40 gap-2">
          
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

          {/* Mode Selector - Terminal Style: scrollable on mobile */}
          <div className="flex items-center gap-3 sm:gap-6 font-mono text-xs sm:text-sm text-muted-foreground/70 tracking-wide overflow-x-auto flex-1 min-w-0 py-1">
            {/* Mode: Time / Words */}
            <div className="flex gap-3">
              <button onClick={() => setMode("time")} className={`transition-all hover:text-foreground ${mode === "time" ? "text-primary font-bold drop-shadow-sm" : ""}`}>{t("modeTime")}</button>
              <button onClick={() => setMode("words")} className={`transition-all hover:text-foreground ${mode === "words" ? "text-primary font-bold drop-shadow-sm" : ""}`}>{t("modeWords")}</button>
            </div>

            <Separator orientation="vertical" className="h-5 opacity-40" />

            {/* Options */}
            <div className="flex gap-3">
              {mode === "time"
                ? TIME_OPTS.map((opt) => (
                    <button key={opt} onClick={() => setTime(opt)} className={`transition-all hover:text-foreground ${time === opt ? "text-primary font-bold drop-shadow-sm" : ""}`}>{opt}s</button>
                  ))
                : WORD_OPTS.map((opt) => (
                    <button key={opt} onClick={() => setWords(opt)} className={`transition-all hover:text-foreground ${words === opt ? "text-primary font-bold drop-shadow-sm" : ""}`}>{opt}</button>
                  ))
              }
            </div>

            <Separator orientation="vertical" className="h-5 opacity-40" />

            {/* Language */}
            <div className="flex gap-3">
              <button onClick={() => setLang("english")} className={`transition-all hover:text-foreground uppercase ${lang === "english" ? "text-primary font-bold drop-shadow-sm" : ""}`}>{t("langEn")}</button>
              <button onClick={() => setLang("indonesian")} className={`transition-all hover:text-foreground uppercase ${lang === "indonesian" ? "text-primary font-bold drop-shadow-sm" : ""}`}>{t("langId")}</button>
              <button onClick={() => setLang("spanish")} className={`transition-all hover:text-foreground uppercase ${lang === "spanish" ? "text-primary font-bold drop-shadow-sm" : ""}`}>{t("langEs")}</button>
              <button onClick={() => setLang("french")} className={`transition-all hover:text-foreground uppercase ${lang === "french" ? "text-primary font-bold drop-shadow-sm" : ""}`}>{t("langFr")}</button>
              <button onClick={() => setLang("german")} className={`transition-all hover:text-foreground uppercase ${lang === "german" ? "text-primary font-bold drop-shadow-sm" : ""}`}>{t("langDe")}</button>
              <Separator orientation="vertical" className="h-5 opacity-40 mx-1" />
              <button onClick={() => setLang("coding")} className={`transition-all hover:text-foreground uppercase ${lang === "coding" ? "text-primary font-bold drop-shadow-sm" : ""}`}>{"</>"}</button>
              <button onClick={() => setLang("custom")} className={`transition-all hover:text-foreground uppercase ${lang === "custom" ? "text-primary font-bold drop-shadow-sm" : ""}`}>Custom</button>
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

        {/* Live Stats Header & Custom Input */}
        <div className={`h-10 sm:h-14 flex items-center justify-between px-4 sm:px-10 text-base sm:text-2xl font-bold font-mono text-primary transition-opacity duration-300 ${stats.isStarted && !stats.isFinished ? "opacity-100 mt-2 sm:mt-4" : "opacity-0 invisible h-0"}`}>
            <div className="flex items-baseline gap-2">
               {stats.wpm} <span className="text-xs font-bold text-muted-foreground uppercase opacity-70 tracking-widest">wpm</span>
            </div>
            <div className="flex items-baseline gap-2">
               {mode === "time" && Math.ceil(stats.timeLeft)}
               {mode === "time" && <span className="text-xs font-bold text-muted-foreground uppercase opacity-70 tracking-widest">s</span>}
            </div>
        </div>

        {!stats.isStarted && !stats.isFinished && lang === "custom" && (
          <div className="w-full px-4 sm:px-10 mt-4 mb-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <textarea
              className="w-full h-24 bg-muted/30 border border-border/50 rounded-lg p-3 font-mono text-sm text-foreground/80 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none transition-all"
              placeholder="Paste or type your custom text here..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
            />
          </div>
        )}

        {/* Progress bar */}
        {stats.isStarted && !stats.isFinished && (
           <div className="w-full h-0.5 bg-muted/50">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progressValue}%` }} />
           </div>
        )}

        {/* Terminal Body (Typing Area) */}
        <div 
          ref={terminalBodyRef}
          className={`p-4 sm:p-10 md:p-16 relative overflow-hidden flex flex-col ${isFullscreen ? "flex-1" : "h-[320px] sm:h-[400px] md:h-[450px]"}`}
        >
          {/* Main typing text container */}
          <div className="relative w-full">
            {!stats.isStarted && !stats.isFinished && (
              <div className="absolute top-0 left-0 -mt-7 sm:-mt-8 text-primary/40 font-mono text-xs sm:text-sm flex items-center gap-2 animate-pulse w-full pointer-events-none">
                <span className="opacity-50">~</span> <span className="text-foreground/30">❯</span> <span className="opacity-70">{t("startTyping")}</span>
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

      {/* ── Extracted Result Dialog ── */}
      <ResultModal 
        show={showResult} 
        setShow={setShowResult} 
        result={result} 
        mode={mode} 
        lang={lang} 
        time={time} 
        words={words} 
        restart={restart} 
        getRating={getRating} 
        calculatePercentile={calculatePercentile} 
      />
      {/* ── Tab Switch Warning Dialog ── */}
      <AlertDialog open={showExitWarning} onOpenChange={setShowExitWarning}>
        <AlertDialogContent className="bg-background border-border/40 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
              <span className="text-destructive">⚠️</span> Test Interrupted
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              You switched tabs or lost focus during an active typing test. Do you want to continue where you left off or restart the test?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel onClick={() => setShowExitWarning(false)} className="border-border/40">
              Continue Test
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowExitWarning(false);
                restart();
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            >
              Restart Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
