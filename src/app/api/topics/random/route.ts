import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  PREBUILT_TOPICS,
  CATEGORIES,
  type CategoryId,
  type Topic,
} from "@/lib/topics";

export const dynamic = "force-dynamic";

// GET /api/topics/random?category=<id>
// Returns one random topic drawn from the combined pool of prebuilt
// topics and the user's custom topics (stored in the database).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as CategoryId | null;

  const validCategory = category
    ? CATEGORIES.some((c) => c.id === category)
      ? category
      : null
    : null;

  // Fetch custom topics from the DB.
  let customTopics: Topic[] = [];
  try {
    const rows = await db.customTopic.findMany({
      orderBy: { createdAt: "desc" },
    });
    customTopics = rows.map((r) => ({
      id: r.id,
      text: r.text,
      category: r.category as CategoryId,
      source: "custom",
    }));
  } catch {
    // DB not ready yet — degrade gracefully to prebuilt only.
    customTopics = [];
  }

  let pool: Topic[] = [...PREBUILT_TOPICS, ...customTopics];
  if (validCategory) {
    pool = pool.filter((t) => t.category === validCategory);
  }

  if (pool.length === 0) {
    return NextResponse.json(
      { error: "No topics available for this category." },
      { status: 404 },
    );
  }

  const pick = pool[Math.floor(Math.random() * pool.length)];
  return NextResponse.json(pick);
}
