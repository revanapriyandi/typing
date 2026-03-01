import { memo, forwardRef } from "react";

interface CharacterProps {
  char: string;
  status: string;
  isCurrent: boolean;
}

export const Character = memo(forwardRef<HTMLSpanElement, CharacterProps>(({ char, status, isCurrent }, ref) => {
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
