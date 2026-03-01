"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { generateParagraph, Language } from "@/lib/words";
import { useTypingSound } from "./useTypingSound";

export interface CharState {
  char: string;
  status: "pending" | "correct" | "incorrect";
}

export interface TypingStats {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  timeLeft: number;
  timeElapsed: number;
  isFinished: boolean;
  isStarted: boolean;
  correctChars: number;
  incorrectChars: number;
  totalTyped: number;
  heatmap: Record<string, { correct: number; incorrect: number }>;
  keystrokes: { char: string; time: number; index: number }[];
}

interface UseTypingEngineProps {
  mode: "time" | "words";
  duration: number; // seconds for time mode, word count for word mode
  language: Language;
  initialText?: string;
  customText?: string;
}

export function useTypingEngine({ mode, duration, language, initialText, customText }: UseTypingEngineProps) {
  const [text, setText] = useState<string>(() => {
    if (initialText) return initialText;
    const wordCount = mode === "time" ? Math.ceil(duration * 0.9) : duration;
    return generateParagraph(language, Math.max(wordCount, 60), customText);
  });
  const [chars, setChars] = useState<CharState[]>(() => 
    text.split("").map((c) => ({ char: c, status: "pending" }))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(mode === "time" ? duration : 0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [incorrectChars, setIncorrectChars] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const [heatmap, setHeatmap] = useState<Record<string, { correct: number, incorrect: number }>>({});
  const [keystrokes, setKeystrokes] = useState<{ char: string; time: number; index: number }[]>([]);

  const { playClick, isMuted, toggleMute } = useTypingSound();

  const initTest = useCallback(() => {
    let newText = initialText;
    if (!newText) {
      const wordCount = mode === "time" ? Math.ceil(duration * 0.9) : duration;
      newText = generateParagraph(language, Math.max(wordCount, 60), customText);
    }
    setText(newText);
    setChars(newText.split("").map((c) => ({ char: c, status: "pending" })));
    setCurrentIndex(0);
    setIsStarted(false);
    setIsFinished(false);
    setTimeLeft(mode === "time" ? duration : 0);
    setTimeElapsed(0);
    setCorrectChars(0);
    setIncorrectChars(0);
    setHeatmap({});
    setKeystrokes([]);
    startTimeRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, [mode, duration, language, initialText, customText]);

  // Initialize test handled by lazy state initialization and manual reset calls from consumer Components

  useEffect(() => {
    if (!isStarted || isFinished) return;

    const tick = () => {
      const elapsed = (Date.now() - startTimeRef.current!) / 1000;
      setTimeElapsed(elapsed);
      if (mode === "time") {
        const left = Math.max(0, duration - elapsed);
        setTimeLeft(left);
        if (left <= 0) {
          setIsFinished(true);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isStarted, isFinished, mode, duration]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isFinished) return;
      if (e.key === "Tab") {
        e.preventDefault();
        initTest();
        return;
      }
      if (e.key === "Escape") {
        initTest();
        return;
      }
      if (e.key.length !== 1 && e.key !== "Backspace") return;
      if (e.key === " ") e.preventDefault();

      if (!isStarted && e.key.length === 1) {
        setIsStarted(true);
        startTimeRef.current = Date.now();
      }

      setChars((prev) => {
        const next = [...prev];
        if (e.key === "Backspace") {
          playClick();
          if (currentIndex > 0) {
            const prevIdx = currentIndex - 1;
            if (next[prevIdx].status === "incorrect") {
              setIncorrectChars((c) => Math.max(0, c - 1));
            } else if (next[prevIdx].status === "correct") {
              setCorrectChars((c) => Math.max(0, c - 1));
            }
            next[prevIdx] = { ...next[prevIdx], status: "pending" };
            setCurrentIndex(prevIdx);
          }
          return next;
        }

        if (currentIndex >= text.length) return next;

        const isCorrect = e.key === text[currentIndex];
        next[currentIndex] = { ...next[currentIndex], status: isCorrect ? "correct" : "incorrect" };

        const stamp = { char: e.key, time: Date.now() - (startTimeRef.current || Date.now()), index: currentIndex };
        setKeystrokes((prev) => [...prev, stamp]);

        const expectedChar = text[currentIndex].toLowerCase();
        
        setHeatmap((prev) => {
          const map = { ...prev };
          if (!map[expectedChar]) map[expectedChar] = { correct: 0, incorrect: 0 };
          if (isCorrect) map[expectedChar].correct += 1;
          else map[expectedChar].incorrect += 1;
          return map;
        });

        if (isCorrect) {
          setCorrectChars((c) => c + 1);
          playClick();
        } else {
          setIncorrectChars((c) => c + 1);
          playClick(true);
        }

        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);

        if (mode === "words" && nextIdx >= text.length) {
          setIsFinished(true);
        }
        return next;
      });
    },
    [isFinished, isStarted, currentIndex, text, mode, initTest, playClick]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const actualTime = isFinished && mode === "time" ? duration : timeElapsed;
  const timeMins = actualTime > 0 ? actualTime / 60 : 0;

  const totalTyped = correctChars + incorrectChars;
  const wpm = timeMins > 0 ? Math.round((correctChars / 5) / timeMins) : 0;
  const rawWpm = timeMins > 0 ? Math.round((totalTyped / 5) / timeMins) : 0;
  const accuracy = totalTyped > 0 
    ? (incorrectChars === 0 ? 100 : Math.floor((correctChars / totalTyped) * 100)) 
    : 100;

  const stats: TypingStats = {
    wpm,
    rawWpm,
    accuracy,
    timeLeft,
    timeElapsed: actualTime,
    isFinished,
    isStarted,
    correctChars,
    incorrectChars,
    totalTyped,
    heatmap,
    keystrokes,
  };

  return { chars, currentIndex, stats, reset: initTest, isMuted, toggleMute };
}
