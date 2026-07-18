"use client";

import * as React from "react";
import { Search, Star, Trash2, ArrowRight, Inbox } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryBadge, CategoryIcon } from "@/components/discussion/category-ui";
import { PREBUILT_TOPICS, CATEGORIES } from "@/lib/topics";
import type { Topic, CategoryId } from "@/lib/topics";
import { cn } from "@/lib/utils";

interface TopicPoolProps {
  customTopics: Topic[];
  onUseTopic: (topic: Topic) => void;
  onDeleteCustom: (id: string) => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
}

export function TopicPool({
  customTopics,
  onUseTopic,
  onDeleteCustom,
  isFavorite,
  onToggleFavorite,
}: TopicPoolProps) {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<CategoryId | "all">("all");

  const all = React.useMemo(
    () => [...customTopics, ...PREBUILT_TOPICS],
    [customTopics],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((t) => {
      if (category !== "all" && t.category !== category) return false;
      if (q && !t.text.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [all, query, category]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics..."
            className="pl-8"
          />
        </div>
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as CategoryId | "all")}
        >
          <SelectTrigger size="sm" className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {all.length} topics
        </p>
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.slice(0, 8).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(category === c.id ? "all" : c.id)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                category === c.id
                  ? cn(c.bg, c.text, c.border)
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
              title={c.label}
            >
              <CategoryIcon name={c.icon} className="size-2.5" />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="max-h-[420px] rounded-lg border">
        <ul className="divide-y">
          {filtered.length === 0 && (
            <li className="flex flex-col items-center gap-2 px-4 py-12 text-center text-sm text-muted-foreground">
              <Inbox className="size-6" />
              No topics match your search.
            </li>
          )}
          {filtered.map((t) => {
            const fav = isFavorite(t.id);
            return (
              <li
                key={t.id}
                className="group flex items-start gap-2 px-3 py-2.5 transition-colors hover:bg-accent/40"
              >
                <button
                  type="button"
                  onClick={() => onToggleFavorite(t.id)}
                  className="mt-0.5 shrink-0 rounded-md p-1 transition-colors hover:bg-accent"
                  aria-label={fav ? "Remove favorite" : "Add favorite"}
                >
                  <Star
                    className={cn(
                      "size-4",
                      fav ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
                    )}
                  />
                </button>

                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">{t.text}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <CategoryBadge category={t.category} />
                    {t.source === "custom" && (
                      <Badge
                        variant="outline"
                        className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-600 dark:text-amber-400"
                      >
                        Custom
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    onClick={() => onUseTopic(t)}
                    title="Use this topic"
                  >
                    <ArrowRight className="size-4" />
                  </Button>
                  {t.source === "custom" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => onDeleteCustom(t.id)}
                      title="Delete custom topic"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );
}
