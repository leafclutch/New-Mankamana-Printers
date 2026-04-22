export type DiscountType = "percentage" | "fixed" | null;

export interface AdminService {
  id: string;
  name: string;
  description?: string | null;
  is_active?: boolean | null;
}

export interface AdminProductFieldOption {
  id: string;
  value: string;
  label: string;
  display_order?: number | null;
}

export interface AdminProductField {
  id: string;
  field_key: string;
  label: string;
  type: string;
  is_required: boolean;
  is_pricing_field?: boolean;
  display_order?: number | null;
  options?: AdminProductFieldOption[];
}

export interface AdminProduct {
  id: string;
  service_id: string;
  product_code: string;
  name: string;
  description?: string | null;
  base_price?: number | null;
  discount_type?: DiscountType;
  discount_value?: number | null;
  fields?: AdminProductField[];
}

export interface PricingRow {
  id: string;
  unit_price?: number;
  discount_type?: DiscountType;
  discount_value?: number | null;
  selected_options?: Array<{
    field_id: string;
    field_key?: string;
    label?: string;
    value: string;
    display_value?: string;
  }>;
}

const safeJson = async (response: Response) => {
  const raw = await response.text();
  if (!raw || raw.trim().length === 0) {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
};

const unwrapData = <T>(payload: unknown, fallback: T): T => {
  if (!payload) return fallback;
  if (Array.isArray(payload)) return payload as T;
  if (typeof payload === "object" && "data" in payload) return (payload as { data: T }).data;
  return payload as T;
};

export const fetchAdminServices = async (): Promise<AdminService[]> => {
  const response = await fetch("/api/admin/services", { cache: "no-store" });
  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data?.message || "Failed to load services.");
  }
  return unwrapData<AdminService[]>(data, []);
};

export const createAdminService = async (payload: {
  name: string;
  description?: string;
  is_active?: boolean;
}): Promise<AdminService> => {
  const response = await fetch("/api/admin/services", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data?.message || "Failed to create service.");
  }
  return unwrapData<AdminService>(data, data as AdminService);
};

export const fetchAdminProducts = async (): Promise<AdminProduct[]> => {
  const response = await fetch("/api/admin/products", { cache: "no-store" });
  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data?.message || "Failed to load products.");
  }
  return unwrapData<AdminProduct[]>(data, []);
};

export const fetchAdminProductById = async (
  productId: string
): Promise<AdminProduct> => {
  const response = await fetch(`/api/admin/products/${productId}`, {
    cache: "no-store",
  });
  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data?.message || "Failed to load product.");
  }
  return unwrapData<AdminProduct>(data, data as AdminProduct);
};

export const createAdminProduct = async (
  serviceId: string,
  payload: {
    product_code: string;
    name: string;
    description?: string;
    base_price?: number;
    discount_type?: DiscountType;
    discount_value?: number;
  }
) => {
  const response = await fetch(`/api/admin/services/${serviceId}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data?.message || "Failed to create product.");
  }
  return unwrapData<AdminProduct>(data, data as AdminProduct);
};

export const updateAdminProduct = async (
  productId: string,
  payload: Partial<{
    product_code: string;
    name: string;
    description: string;
    base_price: number;
    discount_type: DiscountType;
    discount_value: number;
  }>
) => {
  const response = await fetch(`/api/admin/products/${productId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data?.message || "Failed to update product.");
  }
  return unwrapData<AdminProduct>(data, data as AdminProduct);
};

export const removeAdminProductDiscount = async (productId: string) => {
  const response = await fetch(`/api/admin/products/${productId}/discount`, {
    method: "DELETE",
  });
  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data?.message || "Failed to remove product discount.");
  }
  return data;
};

export const createAdminProductField = async (
  productId: string,
  payload: {
    field_key: string;
    label: string;
    type: string;
    is_required: boolean;
    display_order?: number;
    is_pricing_field?: boolean;
  }
) => {
  const response = await fetch(`/api/admin/products/${productId}/fields`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data?.message || "Failed to create product field.");
  }
  return unwrapData<AdminProductField>(data, data as AdminProductField);
};

export const updateAdminProductField = async (
  fieldId: string,
  payload: Partial<{
    label: string;
    is_required: boolean;
    display_order: number;
    is_pricing_field: boolean;
  }>
) => {
  const response = await fetch(`/api/admin/fields/${fieldId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data?.message || "Failed to update field.");
  }
  return unwrapData<AdminProductField>(data, data as AdminProductField);
};

export const createAdminFieldOption = async (
  fieldId: string,
  payload: {
    value: string;
    label: string;
    display_order?: number;
  }
) => {
  const response = await fetch(`/api/admin/fields/${fieldId}/options`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data?.message || "Failed to create option.");
  }
  return unwrapData<AdminProductFieldOption>(data, data as AdminProductFieldOption);
};

export const updateAdminFieldOption = async (
  optionId: string,
  payload: Partial<{
    value: string;
    label: string;
    display_order: number;
  }>
) => {
  const response = await fetch(`/api/admin/options/${optionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data?.message || "Failed to update option.");
  }
  return unwrapData<AdminProductFieldOption>(data, data as AdminProductFieldOption);
};

export const fetchAdminPricingRows = async (
  productId: string
): Promise<PricingRow[]> => {
  const response = await fetch(`/api/admin/products/${productId}/pricing`, {
    cache: "no-store",
  });
  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data?.message || "Failed to load pricing rows.");
  }
  const payload = unwrapData<unknown>(data, []);
  if (Array.isArray(payload)) return payload as PricingRow[];
  if (payload !== null && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    if (Array.isArray(p.items)) return p.items as PricingRow[];
    if (Array.isArray(p.data)) return p.data as PricingRow[];
  }
  return [];
};

export const createAdminPricingRow = async (
  productId: string,
  payload: {
    selectedOptions: Array<{ fieldId: string; value: string }>;
    unit_price: number;
    discount_type?: DiscountType;
    discount_value?: number;
  }
) => {
  const response = await fetch(`/api/admin/products/${productId}/pricing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data?.message || "Failed to create pricing row.");
  }
  return unwrapData<PricingRow>(data, data as PricingRow);
};

export const updateAdminPricingRow = async (
  pricingId: string,
  payload: Partial<{
    unit_price: number;
    discount_type: DiscountType;
    discount_value: number;
  }>
) => {
  const response = await fetch(`/api/admin/pricing/${pricingId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data?.message || "Failed to update pricing row.");
  }
  return unwrapData<PricingRow>(data, data as PricingRow);
};

export const removeAdminPricingDiscount = async (pricingId: string) => {
  const response = await fetch(`/api/admin/pricing/${pricingId}/discount`, {
    method: "DELETE",
  });
  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data?.message || "Failed to remove pricing discount.");
  }
  return data;
};
