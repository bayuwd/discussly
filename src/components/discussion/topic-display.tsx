"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, Star, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryBadge } from "@/components/discussion/category-ui";
import { CATEGORIES } from "@/lib/topics";
import type { Topic, CategoryId } from "@/lib/topics";
import { cn } from "@/lib/utils";

interface TopicDisplayProps {
  topic: Topic | null;
  isGenerating: boolean;
  onGenerate: () => void;
  randomCategory: CategoryId | "all";
  onRandomCategoryChange: (v: CategoryId | "all") => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export function TopicDisplay({
  topic,
  isGenerating,
  onGenerate,
  randomCategory,
  onRandomCategoryChange,
  isFavorite,
  onToggleFavorite,
}: TopicDisplayProps) {
  return (
    <Card className="relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-card to-teal-500/5 p-0">
      {/* decorative glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 size-64 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="relative flex flex-col gap-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight">
                Today&apos;s Discussion
              </p>
              <p className="text-xs text-muted-foreground">
                Spin the wheel of conversation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={randomCategory}
              onValueChange={(v) =>
                onRandomCategoryChange(v as CategoryId | "all")
              }
            >
              <SelectTrigger size="sm" className="w-[160px]">
                <SelectValue placeholder="Any category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🎲 All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="min-h-[180px] sm:min-h-[200px]">
          <AnimatePresence mode="wait">
            {topic ? (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex h-full flex-col justify-center gap-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryBadge category={topic.category} />
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                      topic.source === "custom"
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "border-muted-foreground/20 bg-muted text-muted-foreground",
                    )}
                  >
                    {topic.source === "custom" ? "Your topic" : "Curated"}
                  </span>
                </div>
                <blockquote className="text-pretty text-2xl font-semibold leading-snug sm:text-3xl">
                  &ldquo;{topic.text}&rdquo;
                </blockquote>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full flex-col items-center justify-center gap-3 text-center"
              >
                <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Shuffle className="size-7" />
                </div>
                <div>
                  <p className="text-lg font-semibold">No topic yet</p>
                  <p className="text-sm text-muted-foreground">
                    Hit the button below to pull a random conversation starter.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="lg"
            onClick={onGenerate}
            disabled={isGenerating}
            className="bg-emerald-600 text-white hover:bg-emerald-500"
          >
            {isGenerating ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Shuffle className="size-4" />
            )}
            {topic ? "Generate another" : "Generate a topic"}
          </Button>

          {topic && (
            <Button
              variant="outline"
              size="lg"
              onClick={onToggleFavorite}
              aria-pressed={isFavorite}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star
                className={cn(
                  "size-4",
                  isFavorite &&
                    "fill-amber-400 text-amber-400",
                )}
              />
              {isFavorite ? "Favorited" : "Favorite"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
