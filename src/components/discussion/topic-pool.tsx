"use client";

import * as React from "react";
import { Search, Star, Trash2, ArrowRight, Inbox } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  categories: any[];
}

export function TopicPool({
  customTopics,
  onUseTopic,
  onDeleteCustom,
  isFavorite,
  onToggleFavorite,
  categories,
}: TopicPoolProps) {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<CategoryId | "all">("all");
  const [spiciness, setSpiciness] = React.useState<number | "all">("all");

  const [page, setPage] = React.useState(1);
  const ITEMS_PER_PAGE = 5;

  const all = React.useMemo(
    () => [...customTopics, ...PREBUILT_TOPICS],
    [customTopics],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((t) => {
      if (category !== "all" && t.category !== category) return false;
      if (spiciness !== "all" && t.spiciness !== spiciness) return false;
      if (q && !t.text.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [all, query, category, spiciness]);

  React.useEffect(() => {
    setPage(1);
  }, [query, category, spiciness]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

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
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            {filtered.length} of {all.length} topics
          </p>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as CategoryId | "all")}
          >
            <SelectTrigger size="sm" className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={spiciness.toString()}
            onValueChange={(v) => setSpiciness(v === "all" ? "all" : parseInt(v, 10))}
          >
            <SelectTrigger size="sm" className="w-[140px]">
              <SelectValue placeholder="Any spiciness" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🌶️ Any level</SelectItem>
              <SelectItem value="1">🌶️ Level 1</SelectItem>
              <SelectItem value="2">🌶️🌶️ Level 2</SelectItem>
              <SelectItem value="3">🌶️🌶️🌶️ Level 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>



      <div className="flex flex-col rounded-lg border">
        <ul className="divide-y">
            {paginated.length === 0 && (
              <li className="flex flex-col items-center gap-2 px-4 py-12 text-center text-sm text-muted-foreground">
                <Inbox className="size-6" />
                No topics match your search.
              </li>
            )}
            {paginated.map((t) => {
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
                    <p className="text-sm leading-snug break-words whitespace-pre-wrap">{t.text}</p>
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
                      {t.spiciness && t.spiciness > 0 ? (
                        <span className="text-[10px]" title="Spiciness">
                          {"🌶️".repeat(t.spiciness)}
                        </span>
                      ) : null}
                      {t.tags && t.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {t.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
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
        {filtered.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between border-t px-3 py-2 text-xs">
            <span className="text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
