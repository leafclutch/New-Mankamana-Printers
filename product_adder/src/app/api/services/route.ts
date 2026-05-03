import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function resolveCategoryImage(input: {
  image_url: string | null;
  products: Array<{ image_url: string | null; preview_images: string[] }>;
}): string | null {
  if (input.image_url?.trim()) return input.image_url;

  for (const product of input.products) {
    if (product.image_url?.trim()) return product.image_url;
    const preview = (product.preview_images ?? []).find((url) => url?.trim());
    if (preview) return preview;
  }

  return null;
}

export async function GET() {
  const data = await db.productCategory.findMany({
    where: { is_active: true },
    orderBy: { created_at: "asc" },
    include: {
      products: {
        where: { is_active: true },
        select: { image_url: true, preview_images: true },
        orderBy: { created_at: "asc" },
      },
    },
  });

  return NextResponse.json(
    data.map((category) => ({
      id: category.id,
      name: category.name,
      image_url: resolveCategoryImage(category),
    }))
  );
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const productCount = await db.product.count({ where: { category_id: id, is_active: true } });
  if (productCount > 0)
    return NextResponse.json({ error: `Cannot delete — ${productCount} product${productCount > 1 ? "s" : ""} still in this category` }, { status: 409 });

  await db.productCategory.update({ where: { id }, data: { is_active: false } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const { id, name } = await req.json();
  if (!id || !name?.trim()) return NextResponse.json({ error: "id and name required" }, { status: 400 });
  const category = await db.productCategory.update({ where: { id }, data: { name: name.trim() } });
  return NextResponse.json({ id: category.id, name: category.name, image_url: category.image_url });
}

export async function POST(req: Request) {
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const base = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  // ensure unique slug
  const existing = await db.productCategory.findMany({ where: { slug: { startsWith: base } }, select: { slug: true } });
  const slugs = new Set(existing.map(c => c.slug));
  let slug = base;
  let i = 2;
  while (slugs.has(slug)) slug = `${base}-${i++}`;

  const category = await db.productCategory.create({ data: { name: name.trim(), slug } });
  return NextResponse.json({ id: category.id, name: category.name, image_url: category.image_url }, { status: 201 });
}
