"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageCircle, Shuffle, Sparkles, Timer as TimerIcon, Keyboard, Users } from "lucide-react";
import { RoomProvider, ClientSideSuspense, useStorage, useMutation as useLiveblocksMutation, useUpdateMyPresence, useOthers } from "@liveblocks/react";

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
import { LiveCursors } from "@/components/discussion/live-cursors";
import { MultiplayerModal } from "@/components/discussion/multiplayer-modal";
import { useAppStore, useEphemeralStore } from "@/lib/store";
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

export function HomeContent({ isMultiplayer, roomCode }: { isMultiplayer: boolean, roomCode: string | null }) {
  const qc = useQueryClient();
  const router = useRouter();
  const [multiplayerModalOpen, setMultiplayerModalOpen] = React.useState(false);

  const handleLeaveRoom = () => {
    router.push("/");
  };
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);

  const currentTopic = useStorage((root) => root.topic);
  const setCurrentTopic = useLiveblocksMutation(({ storage }: any, newTopic: Topic | null) => {
    storage.set("topic", newTopic);
  }, []);

  const updateMyPresence = useUpdateMyPresence();
  const others = useOthers();
  const othersCount = others.length;

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isAIGenerating, setIsAIGenerating] = React.useState(false);
  const [randomCategory, setRandomCategory] = React.useState<CategoryId | "all">("all");
  const [tab, setTab] = React.useState("pool");
  const [customTopics, setCustomTopics] = React.useState<Topic[]>([]);

  // ---------- Server data ----------

  const [history, setHistory] = React.useState<HistoryEntry[]>([]);
  const customCategories = useEphemeralStore(s => s.customCategories);
  const setCustomCategories = useEphemeralStore(s => s.setCustomCategories);

  const rawCategories = React.useMemo(() => [...CATEGORIES, ...customCategories], [customCategories]);

  const categoryStats = React.useMemo(() => {
    return rawCategories.map((cat: any) => {
      const prebuiltCount = PREBUILT_TOPICS.filter((t) => t.category === cat.id).length;
      const customCount = customTopics.filter((t) => t.category === cat.id).length;
      return {
        id: cat.id,
        label: cat.label,
        icon: cat.icon,
        prebuiltCount,
        customCount,
        total: prebuiltCount + customCount,
      };
    });
  }, [rawCategories, customTopics]);

  // ---------- Mutations ----------

  const addCategoryMutation = useMutation({
    mutationFn: async (input: { label: string }) => {
      const label = input.label.trim();
      if (!label) throw new Error("Label is required.");
      if (label.length > 50) throw new Error("Label must be 50 characters or fewer.");
      const baseId = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      const id = `custom-${baseId}-${Math.random().toString(36).slice(2, 8)}`;
      if (rawCategories.some((c) => c.id === id)) {
        throw new Error("Invalid category ID.");
      }
      const newCategory = {
        id,
        label,
        description: "Custom category",
        text: "text-fuchsia-600 dark:text-fuchsia-400",
        bg: "bg-fuchsia-500/10",
        border: "border-fuchsia-500/30",
        dot: "bg-fuchsia-500",
        icon: "Sparkles",
      };
      setCustomCategories((prev) => [...prev, newCategory]);
      return newCategory;
    },
  });


  const recordHistoryMutation = useMutation({
    mutationFn: async (input: {
      topicText: string;
      category: string;
      durationSec: number;
      elapsedSec: number;
    }) => {
      const newEntry = {
        id: Math.random().toString(36).slice(2, 10),
        ...input,
        completedAt: new Date().toISOString(),
      };
      setHistory((prev) => [newEntry, ...prev]);
      return newEntry;
    },
  });

  const deleteHistoryMutation = useMutation({
    mutationFn: async (id: string) => {
      setHistory((prev) => prev.filter((entry) => entry.id !== id));
    },
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      setHistory([]);
    },
    onSuccess: () => {
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
      // Small simulated delay for effect
      await new Promise((resolve) => setTimeout(resolve, 300));
      let pool = [...PREBUILT_TOPICS, ...customTopics];
      if (randomCategory !== "all") {
        pool = pool.filter(t => t.category === randomCategory);
      }
      
      if (pool.length === 0) {
        throw new Error("No topics available in this category.");
      }

      let nextTopic = currentTopic;
      if (pool.length > 1) {
        while (nextTopic?.id === currentTopic?.id) {
          nextTopic = pool[Math.floor(Math.random() * pool.length)];
        }
      } else {
        nextTopic = pool[0];
      }
      
      setCurrentTopic(nextTopic);
      timerRef.current.reset();
    } catch (e: any) {
      toast.error(e.message || "Couldn't generate a topic. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [currentTopic, randomCategory, customTopics]);

  const generateAITopic = React.useCallback(async (prompt: string) => {
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

    setIsAIGenerating(true);
    try {
      const res = await fetch("/api/topics/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "fetch failed");
      }
      const { topic } = await res.json();
      setCurrentTopic(topic);
      timerRef.current.reset();
    } catch (e: any) {
      toast.error(e.message || "Couldn't generate a topic with AI. Please try again.");
    } finally {
      setIsAIGenerating(false);
    }
  }, [currentTopic]);

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
    async (text: string, category: CategoryId, spiciness?: number, tags?: string) => {
      const newTopic: Topic = {
        id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        text,
        category,
        source: "custom",
        spiciness,
        tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
      };
      setCustomTopics(prev => [newTopic, ...prev]);
      toast.success("Topic added temporarily (will reset on reload).");
    },
    [],
  );

  const deleteCustom = React.useCallback(
    (id: string) => {
      setCustomTopics(prev => prev.filter(t => t.id !== id));
      toast.success("Custom topic removed.");
    },
    [],
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
    <div 
      className="flex min-h-screen flex-col bg-background relative overflow-hidden"
      onPointerMove={(e) => {
        if (isMultiplayer) {
          updateMyPresence({ cursor: { x: Math.round(e.clientX), y: Math.round(e.clientY) } });
        }
      }}
      onPointerLeave={() => {
        if (isMultiplayer) {
          updateMyPresence({ cursor: null });
        }
      }}
    >
      {isMultiplayer && <LiveCursors />}
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <button 
            onClick={() => window.location.reload()} 
            className="flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md transition-opacity hover:opacity-80"
          >
            <img src="/logo.png" alt="Discussly Logo" className="size-10" />
            <div>
              <h1 className="text-base font-bold leading-tight sm:text-lg">
                Discussly
              </h1>
              <p className="text-xs text-muted-foreground">
                Random topic generator &amp; discussion timer
              </p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            {isMultiplayer ? (
              <>
                <Badge variant="outline" className="hidden bg-blue-500/10 text-blue-700 sm:inline-flex dark:text-blue-400 gap-1.5 font-mono">
                  Room: {roomCode}
                </Badge>
                <Badge variant="outline" className="hidden bg-emerald-500/10 text-emerald-700 sm:inline-flex dark:text-emerald-400 gap-1.5">
                  <Users className="size-3" />
                  {othersCount + 1} online
                </Badge>
                <Button variant="outline" size="sm" onClick={handleLeaveRoom}>
                  Leave
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setMultiplayerModalOpen(true)} className="inline-flex gap-2">
                <Users className="size-4 text-emerald-500" />
                <span className="hidden sm:inline">Multiplayer</span>
              </Button>
            )}
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

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            {/* Left Column (Primary Discussion Area) */}
            <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
              <TopicDisplay
                topic={currentTopic}
                isGenerating={isGenerating}
                isAIGenerating={isAIGenerating}
                onGenerate={() => void generateTopic()}
                onGenerateAI={(prompt) => void generateAITopic(prompt)}
                randomCategory={randomCategory}
                onRandomCategoryChange={setRandomCategory}
                isFavorite={currentTopic ? isFavorite(currentTopic.id) : false}
                onToggleFavorite={() =>
                  currentTopic && onToggleFavorite(currentTopic.id)
                }
                categories={rawCategories}
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
                  {rawCategories.map((c) => {
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

            {/* Right Column (Side Panels) */}
            <div className="lg:col-span-4 min-w-0">
              <Card className="p-2 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
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
                      categories={rawCategories}
                    />
                  </TabsContent>

                  <TabsContent value="add" className="p-3">
                    <AddTopicForm
                      onAdd={addTopic}
                      recentCount={customTopics.length}
                      categories={rawCategories}
                      onAddCategory={async (label) => {
                        try {
                          await addCategoryMutation.mutateAsync({ label });
                          toast.success("Category added.");
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Couldn't add category.");
                        }
                      }}
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
            {" "}· Powered by <a href="https://www.instagram.com/fgd.community/" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:underline">FGDC</a>
          </p>
          <p>
            {totalTopics} topics · {history.length} sessions logged
          </p>
        </div>
      </footer>

      {/* Modals */}
      <MultiplayerModal 
        open={multiplayerModalOpen} 
        onOpenChange={setMultiplayerModalOpen} 
      />
    </div>
  );
}

function HomeWrapper() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("room");
  const isMultiplayer = !!roomCode;
  
  // Persistent solo room logic
  const [soloRoomId, setSoloRoomId] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    let id = localStorage.getItem("discussly_solo_room");
    if (!id) {
      id = "solo-" + Math.random().toString(36).substring(2, 10);
      localStorage.setItem("discussly_solo_room", id);
    }
    setSoloRoomId(id);
  }, []);

  if (!isMultiplayer && !soloRoomId) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  const roomId = isMultiplayer ? `discussly-${roomCode}` : soloRoomId!;

  return (
    <RoomProvider 
      id={roomId} 
      initialPresence={{}} 
      initialStorage={{ topic: null, timerEndAt: null, timerStatus: "idle", timerDurationSec: 180, timerRemainingSec: null, timerStarterId: null }}
    >
      <ClientSideSuspense fallback={<div className="flex min-h-screen items-center justify-center">Loading Room...</div>}>
        <HomeContent isMultiplayer={isMultiplayer} roomCode={roomCode} />
      </ClientSideSuspense>
    </RoomProvider>
  );
}

export default function Home() {
  return (
    <React.Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <HomeWrapper />
    </React.Suspense>
  );
}
