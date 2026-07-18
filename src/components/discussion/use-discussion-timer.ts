"use client";

import * as React from "react";
import { useAppStore } from "@/lib/store";
import type { TimerStatus } from "@/lib/store";

export interface DiscussionTimerApi {
  durationSec: number;
  remainingSec: number;
  elapsedSec: number;
  status: TimerStatus;
  progress: number; // 0..1 of time elapsed
  start: () => void;
  pause: () => void;
  reset: () => void;
  setDurationSec: (sec: number) => void;
  /** Record the current session to history and reset the timer. */
  finishNow: () => void;
}

interface Options {
  onComplete: () => void;
}

/**
 * A wall-clock accurate countdown timer. While running it derives the
 * remaining time from `Date.now()` vs an end timestamp, so background-tab
 * throttling never drifts the clock.
 */
export function useDiscussionTimer({
  onComplete,
}: Options): DiscussionTimerApi {
  const soundEnabled = useAppStore((s) => s.soundEnabled);
  const defaultDurationSec = useAppStore((s) => s.defaultDurationSec);

  const [durationSec, setDurationSecState] = React.useState(defaultDurationSec);
  const [remainingSec, setRemainingSec] = React.useState(defaultDurationSec);
  const [status, setStatus] = React.useState<TimerStatus>("idle");

  const endAtRef = React.useRef<number | null>(null);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = React.useRef(false);
  const onCompleteRef = React.useRef(onComplete);
  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const clearTick = React.useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stop = React.useCallback(() => {
    clearTick();
    endAtRef.current = null;
  }, [clearTick]);

  const tick = React.useCallback(() => {
    if (endAtRef.current == null) return;
    const remaining = Math.max(
      0,
      Math.round((endAtRef.current - Date.now()) / 1000),
    );
    setRemainingSec(remaining);
    if (remaining <= 0 && !completedRef.current) {
      completedRef.current = true;
      stop();
      setStatus("finished");
      onCompleteRef.current();
    }
  }, [stop]);

  const start = React.useCallback(() => {
    if (status === "finished") return;
    // (re)compute end timestamp from the current remaining time
    endAtRef.current = Date.now() + remainingSec * 1000;
    setStatus("running");
    clearTick();
    intervalRef.current = setInterval(tick, 200);
    tick();
  }, [status, remainingSec, tick, clearTick]);

  const pause = React.useCallback(() => {
    if (status !== "running") return;
    stop();
    setStatus("paused");
  }, [status, stop]);

  const reset = React.useCallback(() => {
    stop();
    completedRef.current = false;
    setRemainingSec(durationSec);
    setStatus("idle");
  }, [durationSec, stop]);

  const setDurationSec = React.useCallback((sec: number) => {
    const next = Math.max(10, Math.min(3600, Math.floor(sec)));
    stop();
    completedRef.current = false;
    setDurationSecState(next);
    setRemainingSec(next);
    setStatus("idle");
  }, [stop]);

  const finishNow = React.useCallback(() => {
    stop();
    completedRef.current = true;
    setStatus("finished");
    onCompleteRef.current();
  }, [stop]);

  // Play a short beep sequence when the timer finishes (Web Audio, no asset).
  const playBeep = React.useCallback(() => {
    if (!soundEnabled) return;
    if (typeof window === "undefined") return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const notes = [880, 880, 1320];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const start = now + i * 0.25;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.22);
      });
      setTimeout(() => ctx.close(), 1200);
    } catch {
      // Audio not available — silently ignore.
    }
  }, [soundEnabled]);

  // Trigger the beep + (the caller's onComplete handles history).
  React.useEffect(() => {
    if (status === "finished") {
      playBeep();
    }
  }, [status, playBeep]);

  React.useEffect(() => () => stop(), [stop]);

  const elapsedSec = Math.max(0, durationSec - remainingSec);
  const progress = durationSec > 0 ? elapsedSec / durationSec : 0;

  return {
    durationSec,
    remainingSec,
    elapsedSec,
    status,
    progress,
    start,
    pause,
    reset,
    setDurationSec,
    finishNow,
  };
}
