"use client";

import * as React from "react";
import { History, Trash2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CategoryBadge } from "@/components/discussion/category-ui";
import { formatDuration } from "@/lib/store";
import type { HistoryEntry } from "@/app/api/history/route";

interface HistoryPanelProps {
  history: HistoryEntry[];
  onClearAll: () => void;
  onDelete: (id: string) => void;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `Today, ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString())
    return `Yesterday, ${time}`;
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryPanel({
  history,
  onClearAll,
  onDelete,
}: HistoryPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {history.length} recorded{" "}
          {history.length === 1 ? "session" : "sessions"}
        </p>
        {history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onClearAll}
          >
            <Trash2 className="size-4" /> Clear all
          </Button>
        )}
      </div>

      <ScrollArea className="max-h-[460px] rounded-lg border">
        {history.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-sm text-muted-foreground">
            <Inbox className="size-6" />
            No sessions yet. Finish a timer to record one.
          </div>
        ) : (
          <ul className="divide-y">
            {history.map((h) => {
              const completed = h.elapsedSec >= h.durationSec;
              return (
                <li
                  key={h.id}
                  className="group flex items-start gap-3 px-3 py-3 transition-colors hover:bg-accent/40"
                >
                  <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <History className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug break-words whitespace-pre-wrap">{h.topicText}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <CategoryBadge category={h.category} />
                      <span>·</span>
                      <span>{formatWhen(h.completedAt)}</span>
                      <span>·</span>
                      <span>
                        {completed
                          ? `Completed ${formatDuration(h.durationSec)}`
                          : `${formatDuration(h.elapsedSec)} / ${formatDuration(h.durationSec)}`}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 opacity-60 transition-opacity group-hover:opacity-100"
                    onClick={() => onDelete(h.id)}
                    title="Delete entry"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
