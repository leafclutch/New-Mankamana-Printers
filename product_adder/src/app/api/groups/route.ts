import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const groups = await db.productGroup.findMany({
    where: { is_active: true },
    select: { id: true, name: true, group_code: true },
    orderBy: { created_at: "asc" },
  });
  return NextResponse.json(groups);
}
