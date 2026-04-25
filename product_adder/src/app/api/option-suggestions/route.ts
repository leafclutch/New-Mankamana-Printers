import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Returns all distinct option labels used across all variants,
// each with the set of choice labels seen under that option label.
export async function GET() {
  const groups = await db.optionGroup.findMany({
    select: { label: true, is_pricing_dimension: true, values: { select: { label: true }, orderBy: { display_order: "asc" } } },
    orderBy: { label: "asc" },
  });

  // Merge by label: collect all unique choice labels seen per option label
  const map = new Map<string, { is_pricing_field: boolean; choices: Set<string> }>();
  for (const g of groups) {
    if (!map.has(g.label)) map.set(g.label, { is_pricing_field: g.is_pricing_dimension, choices: new Set() });
    const entry = map.get(g.label)!;
    for (const v of g.values) entry.choices.add(v.label);
  }

  const result = Array.from(map.entries()).map(([label, { is_pricing_field, choices }]) => ({
    label,
    is_pricing_field,
    choices: Array.from(choices),
  }));

  return NextResponse.json(result);
}
