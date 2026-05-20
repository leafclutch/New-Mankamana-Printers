import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseCatalogModule } from "@/lib/catalog-module";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const module = parseCatalogModule(new URL(req.url).searchParams.get("module"));

  if (!id || !name) {
    return NextResponse.json({ error: "id and name required" }, { status: 400 });
  }

  const existing = await db.productGroup.findFirst({ where: { id, module } });
  if (!existing) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  try {
    const group = await db.productGroup.update({
      where: { id },
      data: { name },
      select: { id: true, name: true, group_code: true, module: true },
    });
    return NextResponse.json(group);
  } catch {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  const module = parseCatalogModule(new URL(req.url).searchParams.get("module"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await db.productGroup.findFirst({ where: { id, module } });
  if (!existing) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const productCount = await db.product.count({ where: { group_id: id, is_active: true, module } });
  if (productCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete - ${productCount} product${productCount > 1 ? "s" : ""} still in this group` },
      { status: 409 }
    );
  }

  try {
    await db.productGroup.update({ where: { id }, data: { is_active: false } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }
}
