import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/products/[id]/group  — body: { group_id: string | null }
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const { group_id } = await req.json();

  const product = await db.product.update({
    where: { id },
    data: { group_id: group_id ?? null },
    select: { id: true, group_id: true },
  });

  return NextResponse.json({ id: product.id, group_id: product.group_id });
}
