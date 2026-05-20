import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseCatalogModule } from "@/lib/catalog-module";

export async function GET(req: Request) {
  const module = parseCatalogModule(new URL(req.url).searchParams.get("module"));
  const products = await db.product.findMany({
    where: { is_active: true, module },
    include: {
      variants: {
        where: { is_active: true },
        orderBy: { created_at: "asc" },
        include: { option_groups: { include: { values: { orderBy: { display_order: "asc" } } }, orderBy: { display_order: "asc" } } },
      },
    },
    orderBy: { created_at: "asc" },
  });

  return NextResponse.json(products.map(p => {
    const v = p.variants[0];
    return {
      id: p.id,
      name: p.name,
      product_code: p.product_code,
      description: p.description,
      service_id: p.category_id,
      group_id: p.group_id,
      module: p.module,
      image_url: p.image_url,
      preview_images: p.preview_images ?? [],
      variants: p.variants.map(v => ({
        id: v.id,
        variant_code: v.variant_code,
        variant_name: v.variant_name,
        options: v.option_groups.map(g => ({
          id: g.id,
          field_key: g.name,
          label: g.label,
          is_pricing_field: g.is_pricing_dimension,
          choices: g.values.map(val => ({ id: val.id, value: val.code, label: val.label })),
        })),
      })),
    };
  }));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const service_id = typeof body?.service_id === "string" ? body.service_id : null;
  const group_id = typeof body?.group_id === "string" ? body.group_id : null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const description = typeof body?.description === "string" ? body.description : null;
  const module = parseCatalogModule(body?.module);
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const code = name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").slice(0, 8) + "-" + String(Date.now()).slice(-3);

  const product = await db.product.create({
    data: {
      category_id: service_id ?? null,
      group_id:    group_id    ?? null,
      product_code: code,
      name,
      description: description?.trim() ?? null,
      module,
    },
  });

  return NextResponse.json({
    id: product.id,
    name: product.name,
    product_code: product.product_code,
    description: product.description,
    service_id: product.category_id,
    group_id: product.group_id,
    module: product.module,
    image_url: product.image_url,
    preview_images: [],
    variants: [],
  }, { status: 201 });
}
