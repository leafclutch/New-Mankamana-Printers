import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const { variant_id, label, is_pricing_field, import_choices } = await req.json();
  // import_choices: optional string[] of choice labels to pre-populate

  const variant = variant_id
    ? await db.productVariant.findUnique({ where: { id: variant_id } })
    : await db.productVariant.findFirst({ where: { product_id: id } });

  if (!variant) return NextResponse.json({ error: "Variant not found" }, { status: 404 });

  // derive base key; if it already exists for this variant, suffix with _2, _3 ...
  const base = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");
  const existing = await db.optionGroup.findMany({ where: { variant_id: variant.id }, select: { name: true } });
  const usedKeys = new Set(existing.map(g => g.name));
  let key = base;
  let n = 2;
  while (usedKeys.has(key)) key = `${base}_${n++}`;

  const group = await db.optionGroup.create({
    data: { variant_id: variant.id, name: key, label, is_required: true, is_pricing_dimension: !!is_pricing_field, display_order: existing.length },
  });

  // optionally pre-populate choices from a template
  const createdChoices: { id: string; value: string; label: string }[] = [];
  if (Array.isArray(import_choices) && import_choices.length > 0) {
    for (let i = 0; i < import_choices.length; i++) {
      const choiceLabel: string = import_choices[i];
      const code = choiceLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      try {
        const val = await db.optionValue.create({ data: { group_id: group.id, code, label: choiceLabel, display_order: i, is_active: true } });
        createdChoices.push({ id: val.id, value: val.code, label: val.label });
      } catch { /* skip duplicate codes */ }
    }
  }

  return NextResponse.json({ id: group.id, field_key: group.name, label: group.label, is_pricing_field: group.is_pricing_dimension, choices: createdChoices }, { status: 201 });
}
