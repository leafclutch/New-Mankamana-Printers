import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const product = await db.product.findUnique({ where: { id }, select: { product_code: true } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  // generate next variant code: {PRODUCT_CODE}-V{N}
  const existing = await db.productVariant.count({ where: { product_id: id } });
  const variant_code = `${product.product_code}-V${existing + 1}`;

  const variant = await db.productVariant.create({
    data: { product_id: id, variant_code, variant_name: name.trim() },
  });

  return NextResponse.json({
    id: variant.id,
    variant_code: variant.variant_code,
    variant_name: variant.variant_name,
    options: [],
  }, { status: 201 });
}
