import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function toSlug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  const seed = base || `category-${Date.now()}`;
  const rows = await db.templateCategory.findMany({
    where: { slug: { startsWith: seed } },
    select: { slug: true },
  });
  const used = new Set(rows.map((r) => r.slug));

  let slug = seed;
  let i = 2;
  while (used.has(slug)) slug = `${seed}-${i++}`;
  return slug;
}

export async function GET() {
  const categories = await db.templateCategory.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const slug = await uniqueSlug(toSlug(name));
  const category = await db.templateCategory.create({
    data: { name, slug },
    select: { id: true, name: true, slug: true },
  });
  return NextResponse.json(category, { status: 201 });
}
