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
  onAdd: (text: string, category: CategoryId, spiciness?: number, tags?: string) => Promise<void>;
  recentCount: number;
  categories: any[];
  onAddCategory: (label: string) => Promise<void>;
}

export function AddTopicForm({ onAdd, recentCount, categories, onAddCategory }: AddTopicFormProps) {
  const [text, setText] = React.useState("");
  const [category, setCategory] = React.useState<CategoryId>("philosophy");
  const [submitting, setSubmitting] = React.useState(false);
  const [newCatLabel, setNewCatLabel] = React.useState("");
  const [creatingCat, setCreatingCat] = React.useState(false);
  const [spiciness, setSpiciness] = React.useState<number>(0);
  const [tags, setTags] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onAdd(trimmed, category, spiciness || undefined, tags.trim() || undefined);
      setText("");
      setSpiciness(0);
      setTags("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCategory = async () => {
    const label = newCatLabel.trim();
    if (!label) return;
    setCreatingCat(true);
    try {
      await onAddCategory(label);
      setNewCatLabel("");
    } finally {
      setCreatingCat(false);
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
            {categories.map((c) => (
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

      {/* Add new category inline */}
      <div className="flex items-center gap-2">
        <Input 
          placeholder="New category name..." 
          value={newCatLabel}
          onChange={(e) => setNewCatLabel(e.target.value)}
          className="h-8 text-xs"
        />
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          className="h-8 text-xs"
          onClick={handleAddCategory}
          disabled={!newCatLabel.trim() || creatingCat}
        >
          {creatingCat ? "Adding..." : "Add"}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Spiciness</Label>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setSpiciness(spiciness === level ? 0 : level)}
              className={cn(
                "flex h-8 items-center justify-center rounded-md border px-3 text-sm transition-colors",
                spiciness >= level
                  ? "border-red-500/30 bg-red-500/10 text-red-500"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              🌶️
            </button>
          ))}
          <span className="text-xs text-muted-foreground ml-2">
            {spiciness === 0 ? "None" : spiciness === 1 ? "Mild" : spiciness === 2 ? "Spicy" : "Extra Spicy!"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g. deep, funny, dating"
        />
      </div>

      {/* Category quick preview */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((c) => (
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
