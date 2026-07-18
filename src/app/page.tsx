"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageCircle, Shuffle, Sparkles, Timer as TimerIcon, Keyboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { CategoryIcon } from "@/components/discussion/category-ui";
import { TopicDisplay } from "@/components/discussion/topic-display";
import { TimerPanel } from "@/components/discussion/timer-panel";
import { TopicPool } from "@/components/discussion/topic-pool";
import { AddTopicForm } from "@/components/discussion/add-topic-form";
import { HistoryPanel } from "@/components/discussion/history-panel";
import { useDiscussionTimer } from "@/components/discussion/use-discussion-timer";
import { useAppStore } from "@/lib/store";
import { PREBUILT_TOPICS, CATEGORIES } from "@/lib/topics";
import type { Topic, CategoryId } from "@/lib/topics";
import type { HistoryEntry } from "@/app/api/history/route";
import { cn } from "@/lib/utils";

interface CategoryStat {
  id: string;
  label: string;
  icon: string;
  total: number;
  customCount: number;
  prebuiltCount: number;
}

export default function Home() {
  const qc = useQueryClient();
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);

  const [currentTopic, setCurrentTopic] = React.useState<Topic | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [randomCategory, setRandomCategory] = React.useState<CategoryId | "all">("all");
  const [tab, setTab] = React.useState("pool");

  // ---------- Server data ----------
  const topicsQuery = useQuery({
    queryKey: ["topics"],
    queryFn: async () => {
      const res = await fetch("/api/topics");
      const data = await res.json();
      return data.topics as Topic[];
    },
  });

  const historyQuery = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const res = await fetch("/api/history");
      const data = await res.json();
      return data.history as HistoryEntry[];
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      const data = await res.json();
      return data.categories as CategoryStat[];
    },
  });

  const customTopics = topicsQuery.data ?? [];
  const history = historyQuery.data ?? [];
  const categoryStats = categoriesQuery.data ?? [];

  // ---------- Mutations ----------
  const addTopicMutation = useMutation({
    mutationFn: async (input: { text: string; category: CategoryId }) => {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to add topic");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["topics"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const deleteTopicMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/topics/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete topic");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["topics"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const recordHistoryMutation = useMutation({
    mutationFn: async (input: {
      topicText: string;
      category: string;
      durationSec: number;
      elapsedSec: number;
    }) => {
      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to record session");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["history"] });
    },
  });

  const deleteHistoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/history?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete entry");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["history"] }),
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/history", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to clear history");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["history"] });
      toast.success("History cleared.");
    },
  });

  // ---------- Timer ----------
  const timer = useDiscussionTimer({
    onComplete: () => {
      if (currentTopic) {
        recordHistoryMutation.mutate(
          {
            topicText: currentTopic.text,
            category: currentTopic.category,
            durationSec: timer.durationSec,
            elapsedSec: timer.durationSec,
          },
          {
            onSuccess: () =>
              toast.success("Time's up! Session saved to history."),
            onError: () => toast.error("Time's up, but the session wasn't saved."),
          },
        );
      } else {
        toast.success("Time's up!");
      }
    },
  });

  // Keep a live ref to the timer so callbacks (which may be stale closures)
  // always read the latest state.
  const timerRef = React.useRef(timer);
  React.useEffect(() => {
    timerRef.current = timer;
  }, [timer]);

  // ---------- Actions ----------
  const generateTopic = React.useCallback(async () => {
    // Save an in-flight session before switching topics.
    if (
      currentTopic &&
      (timerRef.current.status === "running" ||
        timerRef.current.status === "paused") &&
      timerRef.current.elapsedSec > 3
    ) {
      recordHistoryMutation.mutate({
        topicText: currentTopic.text,
        category: currentTopic.category,
        durationSec: timerRef.current.durationSec,
        elapsedSec: timerRef.current.elapsedSec,
      });
    }

    setIsGenerating(true);
    try {
      const url =
        randomCategory === "all"
          ? "/api/topics/random"
          : `/api/topics/random?category=${randomCategory}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("fetch failed");
      const topic: Topic = await res.json();
      setCurrentTopic(topic);
      timerRef.current.reset();
    } catch {
      toast.error("Couldn't generate a topic. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [currentTopic, randomCategory]);

  const loadTopic = React.useCallback(
    (topic: Topic) => {
      if (
        currentTopic &&
        (timerRef.current.status === "running" ||
          timerRef.current.status === "paused") &&
        timerRef.current.elapsedSec > 3
      ) {
        recordHistoryMutation.mutate({
          topicText: currentTopic.text,
          category: currentTopic.category,
          durationSec: timerRef.current.durationSec,
          elapsedSec: timerRef.current.elapsedSec,
        });
        toast.success("Previous session saved.");
      }
      setCurrentTopic(topic);
      timerRef.current.reset();
      toast("Topic loaded. Start the timer when ready.", {
        description: topic.text,
      });
    },
    [currentTopic],
  );

  const saveSession = React.useCallback(() => {
    if (!currentTopic) return;
    recordHistoryMutation.mutate(
      {
        topicText: currentTopic.text,
        category: currentTopic.category,
        durationSec: timerRef.current.durationSec,
        elapsedSec: timerRef.current.elapsedSec,
      },
      {
        onSuccess: () => {
          toast.success("Session saved to history.");
          timerRef.current.reset();
        },
        onError: () => toast.error("Couldn't save the session."),
      },
    );
  }, [currentTopic]);

  const addTopic = React.useCallback(
    async (text: string, category: CategoryId) => {
      try {
        await addTopicMutation.mutateAsync({ text, category });
        toast.success("Topic added to your library.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't add the topic.");
      }
    },
    [addTopicMutation],
  );

  const deleteCustom = React.useCallback(
    (id: string) => {
      deleteTopicMutation.mutate(id, {
        onSuccess: () => toast.success("Custom topic removed."),
        onError: () => toast.error("Couldn't delete the topic."),
      });
    },
    [deleteTopicMutation],
  );

  const isFavorite = React.useCallback(
    (id: string) => favorites.includes(id),
    [favorites],
  );

  const onToggleFavorite = React.useCallback(
    (id: string) => {
      const willAdd = !favorites.includes(id);
      toggleFavorite(id);
      toast(willAdd ? "Added to favorites." : "Removed from favorites.");
    },
    [favorites, toggleFavorite],
  );

  // ---------- Keyboard shortcuts ----------
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        if (timerRef.current.status === "running") timerRef.current.pause();
        else if (timerRef.current.status !== "finished") timerRef.current.start();
      } else if (e.key.toLowerCase() === "r") {
        timerRef.current.reset();
      } else if (e.key.toLowerCase() === "n") {
        void generateTopic();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [generateTopic]);

  const totalTopics = PREBUILT_TOPICS.length + customTopics.length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <MessageCircle className="size-5" />
            </span>
            <div>
              <h1 className="text-base font-bold leading-tight sm:text-lg">
                Discussly
              </h1>
              <p className="text-xs text-muted-foreground">
                Random topic generator &amp; discussion timer
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="hidden bg-emerald-500/10 text-emerald-700 sm:inline-flex dark:text-emerald-400"
            >
              <Sparkles className="size-3" />
              {totalTopics} topics
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
          {/* Intro */}
          <section className="mb-6 flex flex-col gap-2 sm:mb-8">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Spark a great conversation.
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Generate a random discussion topic, set a timer, and dive in. Add
              your own topics to the library — they get mixed into the random
              pool automatically.
            </p>
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left column */}
            <div className="flex flex-col gap-6 lg:col-span-2">
              <TopicDisplay
                topic={currentTopic}
                isGenerating={isGenerating}
                onGenerate={() => void generateTopic()}
                randomCategory={randomCategory}
                onRandomCategoryChange={setRandomCategory}
                isFavorite={currentTopic ? isFavorite(currentTopic.id) : false}
                onToggleFavorite={() =>
                  currentTopic && onToggleFavorite(currentTopic.id)
                }
              />

              <TimerPanel
                timer={timer}
                topic={currentTopic}
                onSaveSession={saveSession}
              />

              {/* Category stats */}
              <Card className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Topic library</p>
                    <p className="text-xs text-muted-foreground">
                      Tap a category to filter the generator
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {PREBUILT_TOPICS.length} curated + {customTopics.length}{" "}
                    custom
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {CATEGORIES.map((c) => {
                    const stat = categoryStats.find((s) => s.id === c.id);
                    const total = stat?.total ?? 0;
                    const active = randomCategory === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          setRandomCategory(active ? "all" : (c.id as CategoryId))
                        }
                        className={cn(
                          "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all hover:shadow-sm",
                          active
                            ? cn(c.border, c.bg, "ring-2 ring-emerald-500/30")
                            : "border-border hover:bg-accent/40",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex size-8 items-center justify-center rounded-lg",
                            c.bg,
                            c.text,
                          )}
                        >
                          <CategoryIcon name={c.icon} className="size-4" />
                        </span>
                        <span className="text-xs font-semibold">{c.label}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {total} topics
                          {stat && stat.customCount > 0
                            ? ` · ${stat.customCount} yours`
                            : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Right column: tabs */}
            <div className="lg:col-span-1">
              <Card className="p-2 lg:sticky lg:top-20">
                <Tabs value={tab} onValueChange={setTab} className="gap-3">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pool">
                      <Shuffle className="size-3.5" /> Pool
                    </TabsTrigger>
                    <TabsTrigger value="add">
                      <Sparkles className="size-3.5" /> Add
                    </TabsTrigger>
                    <TabsTrigger value="history">
                      <TimerIcon className="size-3.5" /> History
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="pool" className="p-3">
                    <TopicPool
                      customTopics={customTopics}
                      onUseTopic={loadTopic}
                      onDeleteCustom={deleteCustom}
                      isFavorite={isFavorite}
                      onToggleFavorite={onToggleFavorite}
                    />
                  </TabsContent>

                  <TabsContent value="add" className="p-3">
                    <AddTopicForm
                      onAdd={addTopic}
                      recentCount={customTopics.length}
                    />
                  </TabsContent>

                  <TabsContent value="history" className="p-3">
                    <HistoryPanel
                      history={history}
                      onClearAll={() => clearHistoryMutation.mutate()}
                      onDelete={(id) => deleteHistoryMutation.mutate(id)}
                    />
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          </div>

          {/* Shortcuts hint */}
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <Keyboard className="size-3.5" /> Shortcuts
            </span>
            <span>
              <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono">
                Space
              </kbd>{" "}
              start / pause
            </span>
            <span>
              <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono">
                R
              </kbd>{" "}
              reset timer
            </span>
            <span>
              <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono">
                N
              </kbd>{" "}
              new topic
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t bg-background">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>
            Built for better conversations ·{" "}
            <span className="font-medium text-foreground">Discussly</span>
          </p>
          <p>
            {totalTopics} topics · {history.length} sessions logged
          </p>
        </div>
      </footer>
    </div>
  );
}
