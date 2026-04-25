import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { supabase, BUCKET } from "@/lib/supabase";

function toSlug(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function GET() {
  const products = await db.product.findMany({
    where: { is_active: true },
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
  const { service_id, group_id, name, description } = await req.json();
  const code = name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").slice(0, 8) + "-" + String(Date.now()).slice(-3);

  // resolve slugs for the folder path
  const category = service_id
    ? await db.productCategory.findUnique({ where: { id: service_id }, select: { slug: true, name: true } })
    : null;
  const group = group_id
    ? await db.productGroup.findUnique({ where: { id: group_id }, select: { group_code: true, name: true } })
    : null;

  const catSlug  = category ? toSlug(category.name) : "uncategorized";
  const grpSlug  = group    ? toSlug(group.name)     : "general";
  const prodSlug = toSlug(name.trim());

  // folder path inside the bucket: {category}/{group}/{product}/images/
  const folderPath = `${catSlug}/${grpSlug}/${prodSlug}/images`;

  // create the folder by uploading a tiny placeholder (.keep file)
  await supabase.storage
    .from(BUCKET)
    .upload(`${folderPath}/.keep`, new Blob([""]), { upsert: true });

  // public URL prefix for this product's images
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(`${folderPath}/.keep`);
  const folderUrl = urlData.publicUrl.replace("/.keep", "");

  const product = await db.product.create({
    data: {
      category_id: service_id ?? null,
      group_id:    group_id    ?? null,
      product_code: code,
      name: name.trim(),
      description: description?.trim() ?? null,
      image_url: folderUrl,
    },
  });

  return NextResponse.json({
    id: product.id,
    name: product.name,
    product_code: product.product_code,
    description: product.description,
    service_id: product.category_id,
    image_url: product.image_url,
    preview_images: [],
    variants: [],
  }, { status: 201 });
}
