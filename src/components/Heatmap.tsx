"use client";

import { useMemo } from "react";
import { UserProfile } from "@/lib/firestore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HeatmapProps {
  heatmapData?: UserProfile["heatmap"];
}

const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
];

function getColorForErrorRate(errorRate: number, totalPresses: number) {
  if (totalPresses === 0) return "bg-muted/30 text-muted-foreground/50 border-border/20"; // Unused
  if (errorRate === 0) return "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"; // Perfect
  if (errorRate < 0.05) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"; // Great
  if (errorRate < 0.15) return "bg-amber-500/30 text-amber-500 border-amber-500/40"; // Some errors
  if (errorRate < 0.3) return "bg-orange-500/50 text-orange-500 border-orange-500/50"; // Problem key
  return "bg-red-500/70 text-red-500 border-red-500"; // Severe problem key
}

export function Heatmap({ heatmapData }: HeatmapProps) {
  const stats = useMemo(() => heatmapData || {}, [heatmapData]);

  return (
    <div className="w-full flex flex-col items-center justify-center p-6 bg-background/50 rounded-xl border border-border/40 select-none overflow-x-auto">
      <div className="flex flex-col gap-2 relative">
        <TooltipProvider>
          {KEYBOARD_ROWS.map((row, rIdx) => (
            <div 
              key={rIdx} 
              className="flex justify-center gap-2" 
              style={{ paddingLeft: `${rIdx * 1.5}rem` }}
            >
              {row.map((keyChar) => {
                const data = stats[keyChar] || { correct: 0, incorrect: 0 };
                const total = data.correct + data.incorrect;
                const errorRate = total > 0 ? data.incorrect / total : 0;
                
                return (
                  <Tooltip key={keyChar}>
                    <TooltipTrigger asChild>
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-md border font-mono font-bold text-lg uppercase transition-all duration-300 hover:scale-110 cursor-pointer shadow-sm ${getColorForErrorRate(errorRate, total)}`}
                      >
                        {keyChar}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="flex flex-col gap-1 p-3">
                      <div className="font-bold text-lg text-center font-mono uppercase border-b border-border mb-1 pb-1">Key {keyChar}</div>
                      <div className="text-sm font-medium">Total Presses: <span className="font-mono">{total}</span></div>
                      <div className="text-sm font-medium text-destructive">Errors: <span className="font-mono">{data.incorrect}</span></div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Error Rate: {total > 0 ? Math.round(errorRate * 100) : 0}%
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </TooltipProvider>
      </div>

      <div className="flex items-center gap-6 mt-8 text-xs font-semibold text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-muted/30 border border-border/20" /> Unused
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500/30" /> Accurate
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-amber-500/30 border border-amber-500/40" /> Minor Issues
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-red-500/70 border border-red-500" /> Frequent Errors
        </div>
      </div>
    </div>
  );
}
