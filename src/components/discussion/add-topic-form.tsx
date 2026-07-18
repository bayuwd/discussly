"use client";

import * as React from "react";
import { Plus, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryBadge, CategoryIcon } from "@/components/discussion/category-ui";
import { CATEGORIES } from "@/lib/topics";
import type { CategoryId } from "@/lib/topics";
import { cn } from "@/lib/utils";

interface AddTopicFormProps {
  onAdd: (text: string, category: CategoryId) => Promise<void>;
  recentCount: number;
}

export function AddTopicForm({ onAdd, recentCount }: AddTopicFormProps) {
  const [text, setText] = React.useState("");
  const [category, setCategory] = React.useState<CategoryId>("philosophy");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onAdd(trimmed, category);
      setText("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="topic-text">Your discussion topic</Label>
        <Input
          id="topic-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. What makes a great leader?"
          maxLength={240}
        />
        <p className="text-right text-[11px] text-muted-foreground">
          {text.length}/240
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Category</Label>
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as CategoryId)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="inline-flex items-center gap-2">
                  <CategoryIcon name={c.icon} className="size-4" />
                  {c.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category quick preview */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
              category === c.id
                ? cn(c.bg, c.text, c.border)
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            <CategoryIcon name={c.icon} className="size-2.5" />
            {c.label}
          </button>
        ))}
      </div>

      <Button
        type="submit"
        disabled={submitting || !text.trim()}
        className="bg-emerald-600 text-white hover:bg-emerald-500"
      >
        {submitting ? (
          <Plus className="size-4 animate-pulse" />
        ) : (
          <ListPlus className="size-4" />
        )}
        {submitting ? "Adding..." : "Add topic"}
      </Button>

      {recentCount > 0 && (
        <p className="text-xs text-muted-foreground">
          You&apos;ve added {recentCount} custom{" "}
          {recentCount === 1 ? "topic" : "topics"} so far. They appear in the
          pool and the random generator.
        </p>
      )}

      <div className="rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Tip:</span> Custom topics
        are saved to your library and mixed into the random generator
        automatically. Add a category badge preview:{" "}
        <CategoryBadge category={category} className="ml-1" />
      </div>
    </form>
  );
}
