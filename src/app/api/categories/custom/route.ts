import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CATEGORIES } from "@/lib/topics";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

// POST /api/categories/custom
export async function POST(request: Request) {
  let body: { label?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const label = (body.label ?? "").trim();
  if (!label) {
    return NextResponse.json({ error: "Label is required." }, { status: 400 });
  }
  if (label.length > 50) {
    return NextResponse.json(
      { error: "Label must be 50 characters or fewer." },
      { status: 400 },
    );
  }

  // Create a sluggified ID
  const baseId = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
  const id = `custom-${baseId}-${uuidv4().slice(0, 6)}`;

  // Make sure it doesn't conflict with built-in categories (though the prefix helps)
  if (CATEGORIES.some((c) => c.id === id)) {
    return NextResponse.json({ error: "Invalid category ID." }, { status: 400 });
  }

  try {
    const created = await db.customCategory.create({
      data: { id, label },
    });
    return NextResponse.json({ category: created }, { status: 201 });
  } catch (err) {
    console.error("Failed to create custom category:", err);
    return NextResponse.json(
      { error: "Failed to save the category." },
      { status: 500 },
    );
  }
}

// DELETE /api/categories/custom
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Category ID is required." }, { status: 400 });
  }

  try {
    await db.customCategory.delete({
      where: { id },
    });
    // Also delete any custom topics associated with this category
    await db.customTopic.deleteMany({
      where: { category: id },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete the category." },
      { status: 500 },
    );
  }
}
