"use client";

import { useCallback, useEffect, useState, useRef } from 'react';

export function useTypingSound() {
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('typerush_muted');
      // Default to muted (true) if no preference is saved
      return saved === null ? true : saved === 'true';
    }
    return true; // Server-side: always muted
  });
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize AudioContext on first user interaction to bypass browser autoplay policies
    const initAudio = () => {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          audioCtxRef.current = new AudioCtx();
        }
      }
    };
    
    window.addEventListener('keydown', initAudio, { once: true });
    window.addEventListener('mousedown', initAudio, { once: true });
    
    return () => {
      window.removeEventListener('keydown', initAudio);
      window.removeEventListener('mousedown', initAudio);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
         audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem('typerush_muted', String(next));
      return next;
    });
  }, []);

  const playClick = useCallback((isError: boolean = false) => {
    if (isMuted || !audioCtxRef.current) return;
    
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (isError) {
      // Error sound (low muffled thud)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } else {
      // Normal click (crisp high tick to simulate mechanical switch)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    }
  }, [isMuted]);

  return { isMuted, toggleMute, playClick };
}
