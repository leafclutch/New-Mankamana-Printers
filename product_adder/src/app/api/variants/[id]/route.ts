import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const v = await db.productVariant.update({ where: { id }, data: { variant_name: name.trim() } });
  return NextResponse.json({ id: v.id, variant_name: v.variant_name });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const { id } = await params;

  const variant = await db.productVariant.findUnique({ where: { id }, select: { product_id: true } });
  if (!variant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // refuse to delete the last variant of a product
  const count = await db.productVariant.count({ where: { product_id: variant.product_id, is_active: true } });
  if (count <= 1) return NextResponse.json({ error: "Cannot delete the only variant" }, { status: 400 });

  // soft-delete
  await db.productVariant.update({ where: { id }, data: { is_active: false } });
  return NextResponse.json({ ok: true });
}
