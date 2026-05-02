import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { supabase, BUCKET } from "@/lib/supabase";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

function toSlug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function mapTemplate(t: {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  categoryId: string;
  createdAt: Date;
  category: { name: string; slug: string };
}) {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    fileUrl: t.fileUrl,
    categoryId: t.categoryId,
    categoryName: t.category.name,
    categorySlug: t.category.slug,
    createdAt: t.createdAt.toISOString(),
  };
}

export async function GET() {
  const templates = await db.template.findMany({
    where: { isActive: true },
    include: { category: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(templates.map(mapTemplate));
}

export async function POST(req: Request) {
  const form = await req.formData();
  const title = String(form.get("title") ?? "").trim();
  const descriptionRaw = String(form.get("description") ?? "").trim();
  const categoryId = String(form.get("categoryId") ?? "").trim();
  const file = form.get("file");

  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });
  if (!categoryId) return NextResponse.json({ error: "Category required" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "File required" }, { status: 400 });
  if (file.size <= 0) return NextResponse.json({ error: "File cannot be empty" }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "File must be 20 MB or smaller" }, { status: 400 });

  const category = await db.templateCategory.findUnique({ where: { id: categoryId }, select: { id: true, slug: true } });
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  const nameParts = file.name.split(".");
  const ext = (nameParts.length > 1 ? nameParts.pop() : "bin") ?? "bin";
  const base = toSlug(nameParts.join(".") || title) || `template-${Date.now()}`;
  const filePath = `templates/${category.slug}/${Date.now()}-${base}.${ext.toLowerCase()}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const upload = await supabase.storage.from(BUCKET).upload(filePath, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (upload.error) return NextResponse.json({ error: upload.error.message }, { status: 500 });

  const fileUrl = supabase.storage.from(BUCKET).getPublicUrl(filePath).data.publicUrl;
  const template = await db.template.create({
    data: {
      title,
      description: descriptionRaw || null,
      categoryId: category.id,
      fileUrl,
      isActive: true,
    },
    include: { category: { select: { name: true, slug: true } } },
  });

  return NextResponse.json(mapTemplate(template), { status: 201 });
}
