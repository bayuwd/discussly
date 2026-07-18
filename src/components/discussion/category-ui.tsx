"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Brain,
  Cpu,
  Rocket,
  Users,
  Briefcase,
  Palette,
  Scale,
  Globe,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { getCategoryMeta } from "@/lib/topics";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Brain,
  Cpu,
  Rocket,
  Users,
  Briefcase,
  Palette,
  Scale,
  Globe,
  Sparkles,
};

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon className={cn("size-4", className)} />;
}

export function CategoryBadge({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const data = queryClient.getQueryData(["categories"]) as any;
  
  // We expect data.rawCategories from our updated API.
  const rawCategories = data?.rawCategories as any[];
  let meta = rawCategories?.find(c => c.id === category);

  if (!meta) {
    meta = getCategoryMeta(category);
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        meta.bg,
        meta.text,
        meta.border,
        className,
      )}
    >
      <CategoryIcon name={meta.icon} className="size-3" />
      {meta.label}
    </span>
  );
}
