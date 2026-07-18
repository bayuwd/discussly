import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CATEGORIES, type CategoryId, type Topic } from "@/lib/topics";

export const dynamic = "force-dynamic";

// GET /api/topics — returns the user's custom topics (newest first).
export async function GET() {
  try {
    const rows = await db.customTopic.findMany({
      orderBy: { createdAt: "desc" },
    });
    const topics: Topic[] = rows.map((r) => ({
      id: r.id,
      text: r.text,
      category: r.category as CategoryId,
      source: "custom",
      spiciness: r.spiciness ?? undefined,
      tags: r.tags ? r.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
    }));
    return NextResponse.json({ topics });
  } catch {
    return NextResponse.json({ topics: [] });
  }
}

// POST /api/topics — create a custom topic.
// Body: { text: string, category: string, spiciness?: number, tags?: string }
export async function POST(request: Request) {
  let body: { text?: string; category?: string; spiciness?: number; tags?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  const category = (body.category ?? "").trim();
  const spiciness = body.spiciness;
  const tags = body.tags?.trim() || null;

  if (!text) {
    return NextResponse.json({ error: "Topic text is required." }, { status: 400 });
  }
  if (text.length > 240) {
    return NextResponse.json(
      { error: "Topic must be 240 characters or fewer." },
      { status: 400 },
    );
  }
  const isValidPrebuilt = CATEGORIES.some((c) => c.id === category);
  let isValidCategory = isValidPrebuilt;

  if (!isValidCategory) {
    const customCat = await db.customCategory.findUnique({ where: { id: category } });
    isValidCategory = !!customCat;
  }

  if (!isValidCategory) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }

  if (spiciness !== undefined && (spiciness < 1 || spiciness > 3)) {
    return NextResponse.json({ error: "Spiciness must be between 1 and 3." }, { status: 400 });
  }

  try {
    const created = await db.customTopic.create({
      data: { text, category, spiciness, tags },
    });
    const topic: Topic = {
      id: created.id,
      text: created.text,
      category: created.category as CategoryId,
      source: "custom",
      spiciness: created.spiciness ?? undefined,
      tags: created.tags ? created.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
    };
    return NextResponse.json({ topic }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to save the topic." },
      { status: 500 },
    );
  }
}
