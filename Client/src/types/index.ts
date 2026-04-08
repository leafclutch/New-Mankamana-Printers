export interface User {
  id: string;
  clientId: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  printingRequirements?: string;
}

export type OrderStatus =
  | "ORDER_PLACED"
  | "ORDER_PROCESSING"
  | "ORDER_PREPARED"
  | "ORDER_DISPATCHED"
  | "ORDER_DELIVERED"
  | "ORDER_CANCELLED";

export interface Order {
  id: string;
  orderName: string;
  service: string;
  quantity: number;
  paperType: string;
  finishingOption: string;
  designId?: string;
  orderType: "STANDARD" | "CUSTOM";
  status: OrderStatus;
  date: string;
}

export interface Service {
  id: string;
  name: string;
  minimumQuantity: number;
  imageUrl?: string;
  image?: string;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  previewUrl?: string;
  downloadUrl?: string;
  image?: string;
}

export interface DashboardStats {
  totalOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  availableTemplates: number;
}

// ─── Order Form / Product Types ──────────────────────────────────────────────

export type FieldDef =
  | { type: "number"; id: string; label: string; min: number; icon: string; hint?: string }
  | { type: "select"; id: string; label: string; options: { value: string; label: string }[]; icon: string; hint?: string }
  | { type: "text"; id: string; label: string; icon: string; placeholder?: string; hint?: string };

export type ProductDef = {
  id: string;
  categoryId: string;
  name: string;
  images: string[];
  fields: FieldDef[];
  calculatePrice: (state: Record<string, string>) => { applicableCost: number; discount: number };
  getActiveImageIndex?: (state: Record<string, string>) => number;
  emailExtraCharge: number;
  freeDeliveryThreshold: number;
  renderProductInfo: () => React.ReactNode;
};
