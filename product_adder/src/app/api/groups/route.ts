import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseCatalogModule } from "@/lib/catalog-module";

async function readJson(req: Request): Promise<Record<string, unknown>> {
  return req.json().catch(() => ({}));
}

export async function GET(req: Request) {
  const module = parseCatalogModule(new URL(req.url).searchParams.get("module"));
  const groups = await db.productGroup.findMany({
    where: { is_active: true, module },
    select: { id: true, name: true, group_code: true, module: true },
    orderBy: { created_at: "asc" },
  });
  return NextResponse.json(groups);
}

export async function POST(req: Request) {
  const body = await readJson(req);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const module = parseCatalogModule(body.module);
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const base = name.toUpperCase().replace(/[^A-Z0-9]+/g, "-").slice(0, 12) + "-" + String(Date.now()).slice(-4);
  const group = await db.productGroup.create({ data: { name, group_code: base, module } });
  return NextResponse.json({ id: group.id, name: group.name, group_code: group.group_code, module: group.module }, { status: 201 });
}

// Legacy fallback so old clients using PATCH /api/groups still work.
export async function PATCH(req: Request) {
  const body = await readJson(req);
  const id = typeof body.id === "string" ? body.id : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const module = parseCatalogModule(body.module);
  if (!id || !name) return NextResponse.json({ error: "id and name required" }, { status: 400 });

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

// Legacy fallback so old clients using DELETE /api/groups still work.
export async function DELETE(req: Request) {
  const body = await readJson(req);
  const id = typeof body.id === "string" ? body.id : "";
  const module = parseCatalogModule(body.module);
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
