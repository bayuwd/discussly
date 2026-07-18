import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CATEGORIES, PREBUILT_TOPICS } from "@/lib/topics";

export const dynamic = "force-dynamic";

// GET /api/categories — returns each category with prebuilt + custom counts.
export async function GET() {
  let customCounts: Record<string, number> = {};
  try {
    const grouped = await db.customTopic.groupBy({
      by: ["category"],
      _count: { _all: true },
    });
    customCounts = Object.fromEntries(
      grouped.map((g) => [g.category, g._count._all]),
    );
  } catch {
    customCounts = {};
  }

  const data = CATEGORIES.map((c) => {
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

  return NextResponse.json({ categories: data });
}
