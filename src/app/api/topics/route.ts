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
    }));
    return NextResponse.json({ topics });
  } catch {
    return NextResponse.json({ topics: [] });
  }
}

// POST /api/topics — create a custom topic.
// Body: { text: string, category: string }
export async function POST(request: Request) {
  let body: { text?: string; category?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  const category = (body.category ?? "").trim();

  if (!text) {
    return NextResponse.json({ error: "Topic text is required." }, { status: 400 });
  }
  if (text.length > 240) {
    return NextResponse.json(
      { error: "Topic must be 240 characters or fewer." },
      { status: 400 },
    );
  }
  const isValidCategory = CATEGORIES.some((c) => c.id === category);
  if (!isValidCategory) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }

  try {
    const created = await db.customTopic.create({
      data: { text, category },
    });
    const topic: Topic = {
      id: created.id,
      text: created.text,
      category: created.category as CategoryId,
      source: "custom",
    };
    return NextResponse.json({ topic }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to save the topic." },
      { status: 500 },
    );
  }
}
