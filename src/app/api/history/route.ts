import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CATEGORIES, type CategoryId } from "@/lib/topics";

export const dynamic = "force-dynamic";

export interface HistoryEntry {
  id: string;
  topicText: string;
  category: string;
  durationSec: number;
  elapsedSec: number;
  completedAt: string;
}

// GET /api/history — list discussion history (newest first).
export async function GET() {
  try {
    const rows = await db.discussionHistory.findMany({
      orderBy: { completedAt: "desc" },
      take: 200,
    });
    const history: HistoryEntry[] = rows.map((r) => ({
      id: r.id,
      topicText: r.topicText,
      category: r.category,
      durationSec: r.durationSec,
      elapsedSec: r.elapsedSec,
      completedAt: r.completedAt.toISOString(),
    }));
    return NextResponse.json({ history });
  } catch {
    return NextResponse.json({ history: [] });
  }
}

// POST /api/history — record a finished discussion session.
// Body: { topicText, category, durationSec, elapsedSec }
export async function POST(request: Request) {
  let body: {
    topicText?: string;
    category?: string;
    durationSec?: number;
    elapsedSec?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const topicText = (body.topicText ?? "").trim();
  const category = (body.category ?? "").trim();
  const durationSec = Math.max(0, Math.floor(Number(body.durationSec) || 0));
  const elapsedSec = Math.max(0, Math.floor(Number(body.elapsedSec) || 0));

  if (!topicText) {
    return NextResponse.json({ error: "topicText is required." }, { status: 400 });
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

  try {
    const created = await db.discussionHistory.create({
      data: {
        topicText,
        category: category as CategoryId,
        durationSec,
        elapsedSec,
      },
    });
    const entry: HistoryEntry = {
      id: created.id,
      topicText: created.topicText,
      category: created.category,
      durationSec: created.durationSec,
      elapsedSec: created.elapsedSec,
      completedAt: created.completedAt.toISOString(),
    };
    return NextResponse.json({ entry }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to record the session." },
      { status: 500 },
    );
  }
}

// DELETE /api/history?id=<id> — delete one entry; or clear all if no id.
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      await db.discussionHistory.delete({ where: { id } });
    } else {
      await db.discussionHistory.deleteMany({});
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not delete history entry." },
      { status: 500 },
    );
  }
}
