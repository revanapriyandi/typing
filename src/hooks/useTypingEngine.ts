"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { generateParagraph, Language } from "@/lib/words";

export interface CharState {
  char: string;
  status: "pending" | "correct" | "incorrect";
}

export interface TypingStats {
  wpm: number;
  accuracy: number;
  timeLeft: number;
  timeElapsed: number;
  isFinished: boolean;
  isStarted: boolean;
  correctChars: number;
  incorrectChars: number;
  totalTyped: number;
}

interface UseTypingEngineProps {
  mode: "time" | "words";
  duration: number; // seconds for time mode, word count for word mode
  language: Language;
}

export function useTypingEngine({ mode, duration, language }: UseTypingEngineProps) {
  const [text, setText] = useState<string>("");
  const [chars, setChars] = useState<CharState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(mode === "time" ? duration : 0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [incorrectChars, setIncorrectChars] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const initTest = useCallback(() => {
    const wordCount = mode === "time" ? Math.ceil(duration * 0.9) : duration;
    const newText = generateParagraph(language, Math.max(wordCount, 60));
    setText(newText);
    setChars(newText.split("").map((c) => ({ char: c, status: "pending" })));
    setCurrentIndex(0);
    setIsStarted(false);
    setIsFinished(false);
    setTimeLeft(mode === "time" ? duration : 0);
    setTimeElapsed(0);
    setCorrectChars(0);
    setIncorrectChars(0);
    startTimeRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, [mode, duration, language]);

  useEffect(() => {
    initTest();
  }, [initTest]);

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

        if (isCorrect) setCorrectChars((c) => c + 1);
        else setIncorrectChars((c) => c + 1);

        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);

        if (mode === "words" && nextIdx >= text.length) {
          setIsFinished(true);
        }
        return next;
      });
    },
    [isFinished, isStarted, currentIndex, text, mode, initTest]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const wpm = timeElapsed > 0 ? Math.round((correctChars / 5) / (timeElapsed / 60)) : 0;
  const totalTyped = correctChars + incorrectChars;
  const accuracy = totalTyped > 0 ? Math.round((correctChars / totalTyped) * 100) : 100;

  const stats: TypingStats = {
    wpm,
    accuracy,
    timeLeft,
    timeElapsed,
    isFinished,
    isStarted,
    correctChars,
    incorrectChars,
    totalTyped,
  };

  return { chars, currentIndex, stats, reset: initTest };
}
