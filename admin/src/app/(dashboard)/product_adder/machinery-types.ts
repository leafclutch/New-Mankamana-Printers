export interface MachineryGroup {
  id: string;
  name: string;
  description?: string | null;
}

export interface MachineryChoice {
  id: string;
  value: string;
  label: string;
}

export interface MachineryOption {
  id: string;
  field_key: string;
  label: string;
  is_pricing_field: boolean;
  choices: MachineryChoice[];
}

export interface MachineryPriceRow {
  id: string;
  price: number | null;
  selectedOptions: Array<{
    fieldId: string;
    fieldKey: string;
    label: string;
    value: string;
    displayValue: string;
  }>;
  combination: string;
}

export interface MachineryProduct {
  id: string;
  name: string;
  product_code: string;
  description: string | null;
  group_id: string;
  options: MachineryOption[];
}
