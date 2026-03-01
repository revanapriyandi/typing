import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslations, useLocale } from "next-intl";

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
  const t = useTranslations("Result");
  const locale = useLocale();

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
            <DialogTitle className="text-2xl sm:text-3xl font-black font-mono tracking-tighter">{t("testComplete")}</DialogTitle>
            <div className="text-xs sm:text-sm font-mono text-muted-foreground uppercase opacity-70 tracking-widest mt-1">
              {mode === "time" ? `${time}s` : `${words} words`} • {lang}
            </div>
          </div>

          {/* Main Stats */}
          <div className="flex gap-8 sm:gap-20 justify-center w-full pt-2 pb-4 border-b border-border/30">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">{t("netWpm")}</span>
              <span className="text-5xl sm:text-7xl font-black font-mono tracking-tighter bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                {result.wpm}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">{t("accuracy")}</span>
              <span className="text-5xl sm:text-7xl font-black font-mono tracking-tighter opacity-90">
                {result.accuracy}<span className="text-2xl sm:text-4xl opacity-50 ml-0.5">%</span>
              </span>
            </div>
          </div>

          {/* Secondary Stats Flex */}
          <div className="w-full flex flex-wrap justify-center sm:justify-between gap-y-6 gap-x-4 bg-muted/20 rounded-xl p-4 sm:p-6 border border-border/30">
            <div className="flex flex-col items-center gap-1 min-w-[70px]">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-80">{t("raw")}</span>
              <span className="text-xl sm:text-2xl font-black font-mono tracking-tight">{result.rawWpm}</span>
            </div>
            <div className="flex flex-col items-center gap-1 min-w-[90px]">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-80">{t("chars")}</span>
              <span className="text-xl sm:text-2xl font-black font-mono tracking-tight flex items-center gap-1">
                <span className="text-emerald-500">{result.correctChars}</span>
                <span className="opacity-40 font-light text-xl">/</span>
                <span className="text-destructive">{result.incorrectChars}</span>
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 min-w-[70px]">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-80">{t("time")}</span>
              <span className="text-xl sm:text-2xl font-black font-mono tracking-tight">{result.timeElapsed.toFixed(1)}s</span>
            </div>
            <div className="flex flex-col items-center gap-1 min-w-[90px]">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-80">{t("rank")}</span>
              <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-amber-500">
                {topPercent ? t("topPercent", { percent: topPercent }) : t("na")}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 min-w-[100px]">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-80">{t("rating")}</span>
              <span className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${getRating(result.wpm).color}`}>
                {getRating(result.wpm).text}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button onClick={restart} size="lg" className="flex-1 font-bold gap-2 h-12 rounded-xl shadow-lg shadow-primary/20">
              <RotateCcw className="w-4 h-4" />
              {t("tryAgain")}
            </Button>
            <Link href={`/${locale}/leaderboard`} tabIndex={-1} className="flex-1">
              <Button variant="outline" size="lg" className="w-full font-bold gap-2 h-12 rounded-xl border-border/50">
                <Trophy className="w-4 h-4 text-amber-500" />
                {t("leaderboard")}
              </Button>
            </Link>
          </div>

          {/* Auth status footnote */}
          <p className="text-xs font-mono text-muted-foreground/60">
            {!user || user.isAnonymous
              ? t("loginToSave")
              : t("scoreSaved")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
