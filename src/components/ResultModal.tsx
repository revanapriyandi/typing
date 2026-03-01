import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export interface TestResult {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  timeElapsed: number;
}

interface ResultModalProps {
  show: boolean;
  setShow: (open: boolean) => void;
  result: TestResult | null;
  mode: string;
  lang: string;
  time: number;
  words: number;
  restart: () => void;
  getRating: (wpm: number) => { text: string, color: string };
  calculatePercentile: (wpm: number) => number;
}

export function ResultModal({ show, setShow, result, mode, lang, time, words, restart, getRating, calculatePercentile }: ResultModalProps) {
  const { user } = useAuth();
  if (!result) return null;

  const topPercent = result.wpm ? (100 - calculatePercentile(result.wpm)).toFixed(result.wpm >= 140 ? 1 : 0) : null;

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-[95vw] max-w-2xl p-4 sm:p-8 md:p-10 overflow-y-auto max-h-[90dvh] border-border/40 shadow-2xl bg-background rounded-2xl"
      >
        <div className="flex flex-col items-center text-center gap-4">

          {/* Header */}
          <div>
            <DialogTitle className="text-2xl sm:text-3xl font-black font-mono tracking-tighter">Test Complete</DialogTitle>
            <div className="text-xs sm:text-sm font-mono text-muted-foreground uppercase opacity-70 tracking-widest mt-1">
              {mode === "time" ? `${time}s` : `${words} words`} • {lang}
            </div>
          </div>

          {/* Main Stats */}
          <div className="flex gap-8 sm:gap-20 justify-center w-full pt-2 pb-4 border-b border-border/30">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">net wpm</span>
              <span className="text-5xl sm:text-7xl font-black font-mono tracking-tighter bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                {result.wpm}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">accuracy</span>
              <span className="text-5xl sm:text-7xl font-black font-mono tracking-tighter opacity-90">
                {result.accuracy}<span className="text-2xl sm:text-4xl opacity-50 ml-0.5">%</span>
              </span>
            </div>
          </div>

          {/* Secondary Stats Grid */}
          <div className="w-full grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4 bg-muted/20 rounded-xl p-3 sm:p-5 border border-border/30">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider opacity-70">Raw</span>
              <span className="text-lg sm:text-2xl font-black font-mono">{result.rawWpm}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider opacity-70">Chars</span>
              <span className="text-lg sm:text-2xl font-black font-mono">
                <span className="text-emerald-500">{result.correctChars}</span>
                <span className="opacity-40 mx-0.5">/</span>
                <span className="text-destructive">{result.incorrectChars}</span>
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider opacity-70">Time</span>
              <span className="text-lg sm:text-2xl font-black font-mono">{result.timeElapsed.toFixed(1)}s</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider opacity-70">Rank</span>
              <span className="text-lg sm:text-2xl font-black font-mono text-amber-500">
                {topPercent ? `Top ${topPercent}%` : 'N/A'}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5 col-span-3 sm:col-span-1">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider opacity-70">Rating</span>
              <span className={`text-lg sm:text-2xl font-black font-mono ${getRating(result.wpm).color}`}>
                {getRating(result.wpm).text}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button onClick={restart} size="lg" className="flex-1 font-bold gap-2 h-12 rounded-xl shadow-lg shadow-primary/20">
              <RotateCcw className="w-4 h-4" />
              Try Again
            </Button>
            <Link href="/leaderboard" tabIndex={-1} className="flex-1">
              <Button variant="outline" size="lg" className="w-full font-bold gap-2 h-12 rounded-xl border-border/50">
                <Trophy className="w-4 h-4 text-amber-500" />
                Leaderboard
              </Button>
            </Link>
          </div>

          {/* Auth status footnote */}
          <p className="text-xs font-mono text-muted-foreground/60">
            {!user || user.isAnonymous
              ? "Sign in to save your results to the global leaderboard."
              : "✓ Score saved to your profile."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
