"use client";

import * as React from "react";
import { useAppStore } from "@/lib/store";
import type { TimerStatus } from "@/lib/store";
import { useStorage, useMutation, useSelf } from "@liveblocks/react";

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
  finishNow: () => void;
}

interface Options {
  onComplete: () => void;
}

// Global AudioContext to avoid autoplay restrictions by resuming it on user interaction
let globalAudioCtx: AudioContext | null = null;

function initAudio() {
  if (typeof window === "undefined") return;
  if (!globalAudioCtx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (AudioCtx) {
      globalAudioCtx = new AudioCtx();
    }
  }
  if (globalAudioCtx && globalAudioCtx.state === "suspended") {
    globalAudioCtx.resume().catch(() => {});
  }
}

export function useDiscussionTimer({
  onComplete,
}: Options): DiscussionTimerApi {
  const soundEnabled = useAppStore((s) => s.soundEnabled);
  const defaultDurationSec = useAppStore((s) => s.defaultDurationSec);
  const self = useSelf();

  // Read shared state from Liveblocks
  const status = useStorage((root) => root.timerStatus) ?? "idle";
  const durationSec = useStorage((root) => root.timerDurationSec) ?? defaultDurationSec;
  const endAt = useStorage((root) => root.timerEndAt);
  const timerRemainingSec = useStorage((root) => root.timerRemainingSec);
  const timerStarterId = useStorage((root) => root.timerStarterId);

  // We maintain a local remainingSec that ticks down while running.
  // When idle or paused, we derive it from timerRemainingSec or durationSec.
  const [localRemainingSec, setLocalRemainingSec] = React.useState(durationSec);
  
  const completedRef = React.useRef(false);
  const onCompleteRef = React.useRef(onComplete);
  
  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Handle local ticking when status is running
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (status === "running" && endAt !== null) {
      completedRef.current = false;
      const tick = () => {
        const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000));
        setLocalRemainingSec(remaining);
        
        if (remaining <= 0 && !completedRef.current) {
          completedRef.current = true;
          // Only the user who started the timer triggers the onComplete 
          // (which saves history) to prevent duplicate history entries.
          // Other clients will still hear the beep (via useEffect below).
          if (self?.connectionId === timerStarterId) {
             onCompleteRef.current();
          }
        }
      };
      tick(); // initial tick
      interval = setInterval(tick, 200);
    } else {
      // If idle, reset to duration. If paused, use the paused remaining sec.
      if (status === "idle") {
        setLocalRemainingSec(durationSec);
        completedRef.current = false;
      } else if (status === "paused" && timerRemainingSec !== null) {
        setLocalRemainingSec(timerRemainingSec);
      } else if (status === "finished") {
        setLocalRemainingSec(0);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, endAt, durationSec, timerRemainingSec, self?.connectionId, timerStarterId]);

  // Mutations to update shared state
  const start = useMutation(({ storage, self }: any) => {
    initAudio();
    const currentStatus = storage.get("timerStatus");
    if (currentStatus === "finished") return;

    const currentRem = storage.get("timerRemainingSec");
    const currentDur = storage.get("timerDurationSec") ?? defaultDurationSec;
    const remainingToUse = (currentStatus === "paused" && currentRem !== null) ? currentRem : currentDur;
    
    storage.set("timerEndAt", Date.now() + remainingToUse * 1000);
    storage.set("timerStatus", "running");
    storage.set("timerRemainingSec", null);
    storage.set("timerStarterId", self.connectionId);
  }, [defaultDurationSec]);

  const pause = useMutation(({ storage }: any) => {
    if (storage.get("timerStatus") !== "running") return;
    const e = storage.get("timerEndAt");
    const remaining = e ? Math.max(0, Math.round((e - Date.now()) / 1000)) : 0;
    
    storage.set("timerStatus", "paused");
    storage.set("timerRemainingSec", remaining);
    storage.set("timerEndAt", null);
  }, []);

  const reset = useMutation(({ storage }: any) => {
    storage.set("timerStatus", "idle");
    storage.set("timerEndAt", null);
    storage.set("timerRemainingSec", null);
    // durationSec remains whatever it is globally
  }, []);

  const setDurationSec = useMutation(({ storage }: any, sec: number) => {
    initAudio();
    const next = Math.max(10, Math.min(3600, Math.floor(sec)));
    storage.set("timerStatus", "idle");
    storage.set("timerEndAt", null);
    storage.set("timerRemainingSec", null);
    storage.set("timerDurationSec", next);
  }, []);

  const finishNow = useMutation(({ storage, self }: any) => {
    initAudio();
    storage.set("timerStatus", "finished");
    storage.set("timerEndAt", null);
    storage.set("timerRemainingSec", 0);
    storage.set("timerStarterId", self.connectionId); // To ensure onComplete triggers for them if needed
    onCompleteRef.current(); // Explicitly trigger for the user who clicked finishNow
  }, []);

  // Play a short beep sequence when the timer finishes (Web Audio, no asset).
  const playBeep = React.useCallback(() => {
    if (!soundEnabled) return;
    if (typeof window === "undefined") return;
    try {
      initAudio();
      if (!globalAudioCtx) return;
      
      const now = globalAudioCtx.currentTime;
      const notes = [880, 880, 1320];
      notes.forEach((freq, i) => {
        const osc = globalAudioCtx!.createOscillator();
        const gain = globalAudioCtx!.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const start = now + i * 0.25;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
        osc.connect(gain);
        gain.connect(globalAudioCtx!.destination);
        osc.start(start);
        osc.stop(start + 0.22);
      });
    } catch {
      // Audio not available — silently ignore.
    }
  }, [soundEnabled]);

  React.useEffect(() => {
    if (status === "finished") {
      playBeep();
    }
  }, [status, playBeep]);

  const elapsedSec = Math.max(0, durationSec - localRemainingSec);
  const progress = durationSec > 0 ? elapsedSec / durationSec : 0;

  return {
    durationSec,
    remainingSec: localRemainingSec,
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
