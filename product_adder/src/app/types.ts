export interface Service {
  id: string;
  name: string;
  image_url?: string | null;
}

export interface Choice { id: string; value: string; label: string }

export interface Option {
  id: string;
  field_key: string;
  label: string;
  is_pricing_field: boolean;
  choices: Choice[];
}

export interface Variant {
  id: string;
  variant_code: string;
  variant_name: string;
  options: Option[];
}

export interface Group {
  id: string;
  name: string;
  group_code: string;
  image_url?: string | null;
}

export interface TemplateCategory {
  id: string;
  name: string;
  slug: string;
}

export interface FreeDesignTemplate {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  product_code: string;
  description: string | null;
  service_id: string;
  group_id: string | null;
  image_url: string | null;
  preview_images: string[];
  variants: Variant[];
}

export interface PriceRow {
  id: string;
  price: number | null;
  combination: string;
  selectedOptions: Array<{ fieldId: string; fieldKey: string; value: string; displayValue: string }>;
}
