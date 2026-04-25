import type { Product, Option, PriceRow, Service, Variant, Group } from "./types";

async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    cache: "no-store",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error ?? json?.message ?? `Error ${res.status}`);
  return json as T;
}

export const getServices    = () => api<Service[]>("/services");
export const getGroups      = () => api<Group[]>("/groups");
export const setProductGroup = (productId: string, groupId: string | null) =>
  api<{ id: string; group_id: string | null }>(`/products/${productId}/group`, "PATCH", { group_id: groupId });
export const addService     = (name: string) => api<Service>("/services", "POST", { name });
export const removeService  = (id: string) => api("/services", "DELETE", { id });

export const getProducts  = () => api<Product[]>("/products");
export const addProduct   = (service_id: string, name: string, description?: string) =>
  api<Product>("/products", "POST", { service_id, name, description });
export const saveProduct  = (id: string, name: string, description?: string) =>
  api<Partial<Product>>(`/products/${id}`, "PATCH", { name, description });
export const removeProduct = (id: string) => api(`/products/${id}`, "DELETE");

export const addVariant    = (productId: string, name: string) =>
  api<Variant>(`/products/${productId}/variants`, "POST", { name });
export const renameVariant = (variantId: string, name: string) =>
  api<{ id: string; variant_name: string }>(`/variants/${variantId}`, "PATCH", { name });
export const removeVariant = (variantId: string) => api(`/variants/${variantId}`, "DELETE");

export const getOptionSuggestions = () =>
  api<Array<{ label: string; is_pricing_field: boolean; choices: string[] }>>("/option-suggestions");

export const addField = (productId: string, variantId: string, label: string, is_pricing_field: boolean, import_choices?: string[]) =>
  api<Option>(`/products/${productId}/fields`, "POST", { variant_id: variantId, label, is_pricing_field, import_choices });
export const removeField  = (fieldId: string) => api(`/fields/${fieldId}`, "DELETE");

export const addChoice    = (fieldId: string, label: string) =>
  api<{ id: string; value: string; label: string }>(`/fields/${fieldId}/options`, "POST", { label });
export const removeChoice = (optionId: string) => api(`/options/${optionId}`, "DELETE");

export const listImages   = (productId: string) =>
  api<Array<{ name: string; url: string; path: string }>>(`/products/${productId}/images`);
export const uploadImage  = (productId: string, file: File) => {
  const form = new FormData(); form.append("file", file);
  return fetch(`/api/products/${productId}/images`, { method: "POST", body: form })
    .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j?.error ?? `Error ${r.status}`); return j as { url: string; path: string; name: string }; });
};
export const deleteImage  = (productId: string, path: string) =>
  api(`/products/${productId}/images`, "DELETE", { path });

const getPricing = (productId: string, variantId: string) =>
  api<Array<{ id: string; unit_price: number; selected_options: Array<{ field_id: string; field_key: string; value: string; display_value: string }> }>>(`/products/${productId}/pricing?variantId=${variantId}`);

export const addPricing = (productId: string, variantId: string, selectedOptions: Array<{ fieldId: string; value: string }>, unit_price: number) =>
  api(`/products/${productId}/pricing`, "POST", { variant_id: variantId, selectedOptions, unit_price });
export const savePrice    = (pricingId: string, unit_price: number) => api(`/pricing/${pricingId}`, "PATCH", { unit_price });
export const removePrice  = (pricingId: string) => api(`/pricing/${pricingId}`, "DELETE");

// Load pricing and reshape into PriceRow[]
export async function loadPricing(productId: string, variantId: string): Promise<PriceRow[]> {
  const rows = await getPricing(productId, variantId);
  return rows.map(r => ({
    id: r.id,
    price: r.unit_price,
    combination: (r.selected_options ?? []).map(o => o.display_value || o.value).join(" · ") || "—",
    selectedOptions: (r.selected_options ?? []).map(o => ({
      fieldId: o.field_id, fieldKey: o.field_key, value: o.value, displayValue: o.display_value ?? o.value,
    })),
  }));
}

// Cartesian product helper
export function cartesian<T>(arrays: T[][]): T[][] {
  if (!arrays.length) return [[]];
  const [first, ...rest] = arrays;
  return first.flatMap(item => cartesian(rest).map(combo => [item, ...combo]));
}
