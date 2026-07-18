import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CATEGORIES, PREBUILT_TOPICS, type CategoryMeta } from "@/lib/topics";

export const dynamic = "force-dynamic";

// GET /api/categories — returns each category with prebuilt + custom counts.
export async function GET() {
  let customCounts: Record<string, number> = {};
  let customCategories: CategoryMeta[] = [];

  try {
    const grouped = await db.customTopic.groupBy({
      by: ["category"],
      _count: { _all: true },
    });
    customCounts = Object.fromEntries(
      grouped.map((g) => [g.category, g._count._all]),
    );

    const dbCats = await db.customCategory.findMany({
      orderBy: { createdAt: "asc" },
    });
    customCategories = dbCats.map((c) => ({
      id: c.id as any,
      label: c.label,
      description: "Custom category",
      text: "text-fuchsia-600 dark:text-fuchsia-400",
      bg: "bg-fuchsia-500/10",
      border: "border-fuchsia-500/30",
      dot: "bg-fuchsia-500",
      icon: "Sparkles",
    }));
  } catch {
    customCounts = {};
    customCategories = [];
  }

  const allCategories = [...CATEGORIES, ...customCategories];

  const data = allCategories.map((c) => {
    const prebuilt = PREBUILT_TOPICS.filter((t) => t.category === c.id).length;
    const custom = customCounts[c.id] ?? 0;
    return {
      id: c.id,
      label: c.label,
      description: c.description,
      icon: c.icon,
      prebuiltCount: prebuilt,
      customCount: custom,
      total: prebuilt + custom,
    };
  });

  return NextResponse.json({ categories: data, rawCategories: allCategories });
}
