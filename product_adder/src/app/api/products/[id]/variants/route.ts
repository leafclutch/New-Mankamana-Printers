import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

const WITH_OPTION_GROUPS = {
  option_groups: {
    orderBy: { display_order: "asc" as const },
    include: { values: { orderBy: { display_order: "asc" as const } } },
  },
};

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const [product, variantCount] = await Promise.all([
    db.product.findUnique({ where: { id }, select: { product_code: true, group_id: true } }),
    db.productVariant.count({ where: { product_id: id } }),
  ]);

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  // Find the option-group template: prefer another product in the same group,
  // fall back to a sibling variant of this product if no group or group is empty.
  const template = await db.productVariant.findFirst({
    where: product.group_id
      ? { product: { group_id: product.group_id }, product_id: { not: id } }
      : { product_id: id },
    orderBy: { variant_code: "asc" },
    include: WITH_OPTION_GROUPS,
  }) ?? (product.group_id
    ? await db.productVariant.findFirst({
        where: { product_id: id },
        orderBy: { variant_code: "asc" },
        include: WITH_OPTION_GROUPS,
      })
    : null);

  const variant_code = `${product.product_code}-V${variantCount + 1}`;

  const variant = await db.productVariant.create({
    data: {
      product_id: id,
      variant_code,
      variant_name: name.trim(),
      option_groups: template?.option_groups.length
        ? {
            create: template.option_groups.map(g => ({
              name: g.name,
              label: g.label,
              display_order: g.display_order,
              is_required: g.is_required,
              is_pricing_dimension: g.is_pricing_dimension,
              values: g.values.length
                ? {
                    create: g.values.map(v => ({
                      code: v.code,
                      label: v.label,
                      display_order: v.display_order,
                      is_active: v.is_active,
                    })),
                  }
                : undefined,
            })),
          }
        : undefined,
    },
    include: WITH_OPTION_GROUPS,
  });

  return NextResponse.json(
    {
      id: variant.id,
      variant_code: variant.variant_code,
      variant_name: variant.variant_name,
      options: variant.option_groups.map(g => ({
        id: g.id,
        field_key: g.name,
        label: g.label,
        is_pricing_field: g.is_pricing_dimension,
        choices: g.values.map(v => ({ id: v.id, value: v.code, label: v.label })),
      })),
    },
    { status: 201 },
  );
}
