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

  return (
    <Dialog open={show} onOpenChange={setShow}>
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

            {/* Main Stats Row */}
            <div className="flex gap-16 md:gap-32 justify-center w-full mb-10">
               {/* WPM Display */}
               <div className="flex flex-col items-center gap-1 group">
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">net wpm</span>
                 <span className="text-6xl md:text-8xl font-black font-mono tracking-tighter bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                    {result?.wpm || 0}
                 </span>
               </div>
               {/* Accuracy Display */}
               <div className="flex flex-col items-center gap-1 group">
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">accuracy</span>
                 <span className="text-6xl md:text-8xl font-black font-mono tracking-tighter opacity-90">
                    {result?.accuracy || 0}<span className="text-4xl md:text-5xl opacity-50 ml-1">%</span>
                 </span>
               </div>
            </div>

            {/* Detailed Secondary Stats (Grid) */}
            <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-6 mb-12 py-6 border-y border-border/30 bg-muted/20 rounded-2xl">
               <div className="flex flex-col items-center gap-1">
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider opacity-70">Raw WPM</span>
                 <span className="text-2xl font-black font-mono">{result?.rawWpm || 0}</span>
               </div>
               <div className="flex flex-col items-center gap-1">
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider opacity-70">Characters</span>
                 <span className="text-2xl font-black font-mono whitespace-nowrap">
                   <span className="text-emerald-500">{result?.correctChars || 0}</span>
                   <span className="opacity-40 mx-1">/</span>
                   <span className="text-destructive">{result?.incorrectChars || 0}</span>
                 </span>
               </div>
               <div className="flex flex-col items-center gap-1">
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider opacity-70">Time</span>
                 <span className="text-2xl font-black font-mono">{result?.timeElapsed ? result.timeElapsed.toFixed(1) : 0}s</span>
               </div>
               <div className="flex flex-col items-center gap-1">
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider opacity-70">Rank</span>
                 <span className="text-2xl font-black font-mono text-amber-500">
                    {result?.wpm ? `Top ${(100 - calculatePercentile(result.wpm)).toFixed(result.wpm >= 140 ? 1 : 0)}%` : 'N/A'}
                 </span>
               </div>
               <div className="flex flex-col items-center gap-1 col-span-2 md:col-span-1">
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider opacity-70">Rating</span>
                 <span className={`text-2xl font-black font-mono ${getRating(result?.wpm || 0).color}`}>
                    {getRating(result?.wpm || 0).text}
                 </span>
               </div>
            </div>

            {/* Actions Footer */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-2">
              <Button onClick={restart} size="lg" className="font-bold tracking-tight gap-2 h-14 px-8 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all text-base">
                <RotateCcw className="w-5 h-5" />
                Try Again
              </Button>
              <Link href="/leaderboard" tabIndex={-1}>
                <Button variant="outline" size="lg" className="w-full font-bold tracking-tight gap-2 h-14 px-8 rounded-full border-border/50 hover:bg-muted text-base">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  View Leaderboard
                </Button>
              </Link>
            </div>

            {/* Auth Warning Footnote */}
            <div className="mt-8 text-xs font-mono text-muted-foreground/60 w-full">
              {!user || user.isAnonymous 
                ? "Sign in to save your results to the global leaderboard and track your progress." 
                : "Your score was automatically saved to your profile."}
            </div>
          </div>
        </DialogContent>
      </Dialog>
  );
}
