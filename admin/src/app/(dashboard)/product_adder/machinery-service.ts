import type { MachineryGroup, MachineryProduct, MachineryOption, MachineryPriceRow } from "./machinery-types";

const BASE = "/product_adder/api/machinery";

async function call<T = unknown>(path: string, method = "GET", body?: unknown): Promise<T> {
  const init: RequestInit = { method, cache: "no-store" };
  if (body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, init);
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(json?.message || `Error ${res.status}`);
  return (json?.data ?? json) as T;
}

// ── Groups ────────────────────────────────────────────────────────────────────

export async function listGroups(): Promise<MachineryGroup[]> {
  const d = await call<MachineryGroup[]>("/groups");
  return Array.isArray(d) ? d : [];
}

export async function createGroup(payload: { name: string; description?: string }): Promise<MachineryGroup> {
  return call<MachineryGroup>("/groups", "POST", payload);
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function listMachineryProducts(): Promise<MachineryProduct[]> {
  const d = await call<RawProduct[]>("/products");
  return (Array.isArray(d) ? d : []).map(toProduct);
}

export async function createMachineryProduct(groupId: string, payload: { product_code: string; name: string; description?: string }): Promise<MachineryProduct> {
  return toProduct(await call<RawProduct>(`/groups/${groupId}/products`, "POST", payload));
}

export async function updateMachineryProduct(productId: string, payload: { name?: string; description?: string }): Promise<void> {
  await call(`/products/${productId}`, "PATCH", payload);
}

export async function deleteMachineryProduct(productId: string): Promise<void> {
  await call(`/products/${productId}`, "DELETE");
}

// ── Fields ────────────────────────────────────────────────────────────────────

export async function createMachineryField(productId: string, label: string, isPricingField: boolean): Promise<MachineryOption> {
  const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");
  const raw = await call<{ id: string; field_key: string; label: string; is_pricing_field?: boolean }>(
    `/products/${productId}/fields`, "POST",
    { field_key: key, label, type: "select", is_required: true, is_pricing_field: isPricingField }
  );
  return { id: raw.id, field_key: raw.field_key, label: raw.label, is_pricing_field: raw.is_pricing_field ?? isPricingField, choices: [] };
}

export async function updateMachineryField(fieldId: string, label: string, isPricingField: boolean): Promise<void> {
  await call(`/fields/${fieldId}`, "PATCH", { label, is_pricing_field: isPricingField });
}

export async function deleteMachineryField(fieldId: string): Promise<void> {
  await call(`/fields/${fieldId}`, "DELETE");
}

// ── Choices ───────────────────────────────────────────────────────────────────

export async function createMachineryChoice(fieldId: string, label: string): Promise<{ id: string; value: string; label: string }> {
  const value = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return call(`/fields/${fieldId}/options`, "POST", { value, label });
}

export async function updateMachineryChoice(optionId: string, label: string): Promise<void> {
  await call(`/options/${optionId}`, "PATCH", { label });
}

export async function deleteMachineryChoice(optionId: string): Promise<void> {
  await call(`/options/${optionId}`, "DELETE");
}

// ── Pricing ───────────────────────────────────────────────────────────────────

export async function listMachineryPricing(productId: string): Promise<MachineryPriceRow[]> {
  const d = await call<RawPricingRow[]>(`/products/${productId}/pricing`);
  return (Array.isArray(d) ? d : []).map(toPriceRow);
}

export async function createMachineryPricingRow(productId: string, selectedOptions: Array<{ fieldId: string; value: string }>, price: number): Promise<MachineryPriceRow> {
  return toPriceRow(await call<RawPricingRow>(`/products/${productId}/pricing`, "POST", { selectedOptions, unit_price: price }));
}

export async function deleteMachineryPricingRow(pricingId: string): Promise<void> {
  await call(`/pricing/${pricingId}`, "DELETE");
}

// ── Auto-generate product code ────────────────────────────────────────────────

export function machineryAutoCode(name: string): string {
  const initials = name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 4);
  return `M-${initials}-${Math.floor(100 + Math.random() * 900)}`;
}

// ── Internal raw types + mappers ──────────────────────────────────────────────

interface RawProduct {
  id: string; name: string; product_code: string; description?: string | null; group_id?: string | null;
  fields?: Array<{ id: string; field_key: string; label: string; is_pricing_field?: boolean; options?: Array<{ id: string; value: string; label: string }> }>;
}

interface RawPricingRow {
  id: string; unit_price?: number | null;
  selected_options?: Array<{ field_id: string; field_key?: string; label?: string; value: string; display_value?: string }>;
}

function toProduct(r: RawProduct): MachineryProduct {
  return {
    id: r.id, name: r.name, product_code: r.product_code, description: r.description ?? null, group_id: r.group_id ?? "",
    options: (r.fields ?? []).map((f) => ({
      id: f.id, field_key: f.field_key, label: f.label, is_pricing_field: f.is_pricing_field ?? false,
      choices: (f.options ?? []).map((o) => ({ id: o.id, value: o.value, label: o.label })),
    })),
  };
}

function toPriceRow(r: RawPricingRow): MachineryPriceRow {
  const opts = (r.selected_options ?? []).map((o) => ({
    fieldId: o.field_id, fieldKey: o.field_key ?? "", label: o.label ?? "", value: o.value, displayValue: o.display_value ?? o.value,
  }));
  return { id: r.id, price: r.unit_price ?? null, selectedOptions: opts, combination: opts.map((o) => o.displayValue).join(" · ") || "—" };
}
