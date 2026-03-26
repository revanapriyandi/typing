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
  const [isComposing, setIsComposing] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const isComposingRef = useRef(false);
  const currentIndexRef = useRef(0);
  const pendingCompositionTextRef = useRef<string | null>(null);
  const skipNextCompositionInputRef = useRef(false);
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
    setIsComposing(false);
    setHeatmap({});
    setKeystrokes([]);
    startTimeRef.current = null;
    isComposingRef.current = false;
    currentIndexRef.current = 0;
    pendingCompositionTextRef.current = null;
    skipNextCompositionInputRef.current = false;
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

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const applyInput = useCallback((input: string) => {
    if (!input || isFinished) return;

    if (!isStarted) {
      setIsStarted(true);
      startTimeRef.current = Date.now();
    }

    setChars((prev) => {
      const next = [...prev];
      let nextIdx = currentIndexRef.current;
      let correctDelta = 0;
      let incorrectDelta = 0;
      const stamps: { char: string; time: number; index: number }[] = [];
      const heatmapDeltas: Record<string, { correct: number; incorrect: number }> = {};

      for (const typedChar of input) {
        if (nextIdx >= text.length) break;

        const isCorrect = typedChar === text[nextIdx];
        next[nextIdx] = { ...next[nextIdx], status: isCorrect ? "correct" : "incorrect" };
        stamps.push({ char: typedChar, time: Date.now() - (startTimeRef.current || Date.now()), index: nextIdx });

        const expectedChar = text[nextIdx].toLowerCase();
        if (!heatmapDeltas[expectedChar]) heatmapDeltas[expectedChar] = { correct: 0, incorrect: 0 };
        if (isCorrect) {
          heatmapDeltas[expectedChar].correct += 1;
          correctDelta += 1;
          playClick();
        } else {
          heatmapDeltas[expectedChar].incorrect += 1;
          incorrectDelta += 1;
          playClick(true);
        }

        nextIdx += 1;
      }

      if (stamps.length === 0) return next;

      setKeystrokes((prevKeys) => [...prevKeys, ...stamps]);
      setHeatmap((prevMap) => {
        const map = { ...prevMap };
        for (const [char, delta] of Object.entries(heatmapDeltas)) {
          if (!map[char]) map[char] = { correct: 0, incorrect: 0 };
          map[char].correct += delta.correct;
          map[char].incorrect += delta.incorrect;
        }
        return map;
      });
      if (correctDelta > 0) setCorrectChars((c) => c + correctDelta);
      if (incorrectDelta > 0) setIncorrectChars((c) => c + incorrectDelta);

      currentIndexRef.current = nextIdx;
      setCurrentIndex(nextIdx);
      if (mode === "words" && nextIdx >= text.length) {
        setIsFinished(true);
      }

      return next;
    });
  }, [isFinished, isStarted, mode, playClick, text]);

  const handleBackspace = useCallback(() => {
    if (isFinished) return;
    playClick();

    setChars((prev) => {
      const next = [...prev];
      const index = currentIndexRef.current;
      if (index > 0) {
        const prevIdx = index - 1;
        if (next[prevIdx].status === "incorrect") {
          setIncorrectChars((c) => Math.max(0, c - 1));
        } else if (next[prevIdx].status === "correct") {
          setCorrectChars((c) => Math.max(0, c - 1));
        }
        next[prevIdx] = { ...next[prevIdx], status: "pending" };
        currentIndexRef.current = prevIdx;
        setCurrentIndex(prevIdx);
      }
      return next;
    });
  }, [isFinished, playClick]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
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

    if (isComposingRef.current || e.isComposing) return;
    if (e.key.length !== 1 && e.key !== "Backspace") return;
    if (e.key === " ") e.preventDefault();

    if (e.key === "Backspace") {
      handleBackspace();
      return;
    }

    applyInput(e.key);
  }, [isFinished, initTest, handleBackspace, applyInput]);

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
    setIsComposing(true);
  }, []);

  const handleCompositionUpdate = useCallback(() => {
    isComposingRef.current = true;
    setIsComposing(true);
  }, []);

  const handleCompositionEnd = useCallback((e: CompositionEvent) => {
    isComposingRef.current = false;
    setIsComposing(false);
    pendingCompositionTextRef.current = e.data ?? "";
  }, []);

  const handleInput = useCallback((e: Event) => {
    if (isFinished) return;
    const inputEvent = e as InputEvent;
    if (skipNextCompositionInputRef.current && inputEvent.inputType === "insertFromComposition") {
      skipNextCompositionInputRef.current = false;
      return;
    }
    const data = inputEvent.data ?? "";
    const isCompositionCommit =
      inputEvent.inputType === "insertFromComposition" ||
      (pendingCompositionTextRef.current !== null && data === pendingCompositionTextRef.current);

    if (!isCompositionCommit || !data) return;

    pendingCompositionTextRef.current = null;
    applyInput(data);
  }, [isFinished, applyInput]);

  const handleBeforeInput = useCallback((e: Event) => {
    if (isFinished) return;
    const inputEvent = e as InputEvent;
    if (inputEvent.inputType !== "insertFromComposition") return;

    const data = inputEvent.data ?? "";
    if (!data) return;

    pendingCompositionTextRef.current = null;
    skipNextCompositionInputRef.current = true;
    applyInput(data);
  }, [isFinished, applyInput]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("compositionstart", handleCompositionStart);
    window.addEventListener("compositionupdate", handleCompositionUpdate);
    window.addEventListener("compositionend", handleCompositionEnd);
    window.addEventListener("beforeinput", handleBeforeInput);
    window.addEventListener("input", handleInput);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("compositionstart", handleCompositionStart);
      window.removeEventListener("compositionupdate", handleCompositionUpdate);
      window.removeEventListener("compositionend", handleCompositionEnd);
      window.removeEventListener("beforeinput", handleBeforeInput);
      window.removeEventListener("input", handleInput);
    };
  }, [handleKeyDown, handleCompositionStart, handleCompositionUpdate, handleCompositionEnd, handleBeforeInput, handleInput]);

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

  return { chars, currentIndex, stats, reset: initTest, isMuted, toggleMute, isComposing };
}
