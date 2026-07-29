"use client";

import * as React from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  Volume2,
  VolumeX,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/discussion/category-ui";
import { useAppStore, formatClock } from "@/lib/store";
import type { DiscussionTimerApi } from "@/components/discussion/use-discussion-timer";
import type { Topic } from "@/lib/topics";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "1m", sec: 60 },
  { label: "3m", sec: 180 },
  { label: "5m", sec: 300 },
  { label: "10m", sec: 600 },
];

interface TimerPanelProps {
  timer: DiscussionTimerApi;
  topic: Topic | null;
  onSaveSession: () => void;
}

export function TimerPanel({ timer, topic, onSaveSession }: TimerPanelProps) {
  const soundEnabled = useAppStore((s) => s.soundEnabled);
  const toggleSound = useAppStore((s) => s.toggleSound);
  const setDefaultDurationSec = useAppStore((s) => s.setDefaultDurationSec);

  const [customMin, setCustomMin] = React.useState("");

  const remainingFrac =
    timer.durationSec > 0 ? timer.remainingSec / timer.durationSec : 0;

  // Ring geometry
  const size = 220;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const dashOffset = C * (1 - remainingFrac);

  const isLow = remainingFrac <= 0.2 && timer.status !== "idle";
  const isMid = remainingFrac <= 0.5 && remainingFrac > 0.2;
  const ringColor = isLow
    ? "stroke-rose-500"
    : isMid
      ? "stroke-amber-500"
      : "stroke-emerald-500";

  const statusLabel: Record<typeof timer.status, string> = {
    idle: "Ready",
    running: "In progress",
    paused: "Paused",
    finished: "Time's up!",
  };

  const applyCustom = () => {
    const n = Number(customMin);
    if (!Number.isFinite(n) || n <= 0) return;
    const sec = Math.max(1, Math.min(60, Math.round(n))) * 60;
    timer.setDurationSec(sec);
    setDefaultDurationSec(sec);
    setCustomMin("");
  };

  const selectPreset = (sec: number) => {
    timer.setDurationSec(sec);
    setDefaultDurationSec(sec);
  };

  const canStart = timer.status !== "running" && timer.status !== "finished";

  return (
    <Card className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Discussion Timer</p>
          <p className="text-xs text-muted-foreground">
            {topic ? "Keep the conversation on track" : "Pick a topic to begin"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={toggleSound}
          aria-label={soundEnabled ? "Mute alarm" : "Unmute alarm"}
          title={soundEnabled ? "Alarm on" : "Alarm off"}
        >
          {soundEnabled ? (
            <Volume2 className="size-4" />
          ) : (
            <VolumeX className="size-4" />
          )}
        </Button>
      </div>

      {/* Ring */}
      <div className="flex flex-col items-center gap-4">
        <div
          className="relative"
          style={{ width: size, height: size }}
          role="timer"
          aria-live="polite"
          aria-label={`Time remaining: ${formatClock(timer.remainingSec)}`}
        >
          <svg
            width={size}
            height={size}
            className="-rotate-90"
            viewBox={`0 0 ${size} ${size}`}
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={stroke}
              className="stroke-muted"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              className={cn(
                "transition-[stroke-dashoffset,stroke] duration-300 ease-linear",
                ringColor,
              )}
              strokeDasharray={C}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span
              className={cn(
                "font-mono text-5xl font-bold tabular-nums",
                isLow && "text-rose-500",
              )}
            >
              {formatClock(timer.remainingSec)}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {statusLabel[timer.status]}
            </span>
            {timer.status === "finished" && (
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" /> Saved to history
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {PRESETS.map((p) => {
          const active = timer.durationSec === p.sec && timer.status === "idle";
          return (
            <Button
              key={p.label}
              variant={active ? "default" : "outline"}
              size="sm"
              onClick={() => selectPreset(p.sec)}
              disabled={timer.status === "running"}
              className={cn(
                active && "bg-emerald-600 text-white hover:bg-emerald-500",
              )}
            >
              {p.label}
            </Button>
          );
        })}
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min={1}
            max={60}
            value={customMin}
            onChange={(e) => setCustomMin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyCustom()}
            placeholder="min"
            className="h-8 w-16"
            disabled={timer.status === "running"}
            aria-label="Custom minutes"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={applyCustom}
            disabled={timer.status === "running" || !customMin}
          >
            Set
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {canStart ? (
          <Button
            size="lg"
            onClick={timer.start}
            disabled={!topic && timer.status === "idle"}
            className="bg-emerald-600 text-white hover:bg-emerald-500"
          >
            <Play className="size-4" />
            {timer.status === "paused" ? "Resume" : "Start"}
          </Button>
        ) : (
          <Button size="lg" variant="default" onClick={timer.pause}>
            <Pause className="size-4" /> Pause
          </Button>
        )}
        <Button
          size="lg"
          variant="outline"
          onClick={timer.reset}
          disabled={timer.status === "idle"}
        >
          <RotateCcw className="size-4" /> Reset
        </Button>
        <Button
          size="lg"
          variant="secondary"
          onClick={onSaveSession}
          disabled={!topic || timer.status === "idle"}
          title="Save this session to history"
        >
          <Square className="size-4" /> Save &amp; stop
        </Button>
      </div>

      {topic && (
        <div className="flex flex-wrap items-center justify-center gap-2 border-t pt-4">
          <span className="text-xs text-muted-foreground">Discussing:</span>
          <CategoryBadge category={topic.category} />
          <Badge variant="outline" className="max-w-full whitespace-normal text-center font-normal leading-snug">
            <span>{topic.text}</span>
          </Badge>
        </div>
      )}
    </Card>
  );
}
