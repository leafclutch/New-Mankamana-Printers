import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/products/[id]/group  — body: { group_id: string | null }
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const { group_id } = await req.json();

  const existingProduct = await db.product.findUnique({
    where: { id },
    select: { id: true, module: true },
  });
  if (!existingProduct) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  if (group_id) {
    const group = await db.productGroup.findFirst({
      where: { id: group_id, is_active: true, module: existingProduct.module },
      select: { id: true },
    });
    if (!group) {
      return NextResponse.json({ error: "Group does not belong to the same module as this product" }, { status: 400 });
    }
  }

  const product = await db.product.update({
    where: { id },
    data: { group_id: group_id ?? null },
    select: { id: true, group_id: true },
  });

  return NextResponse.json({ id: product.id, group_id: product.group_id });
}
