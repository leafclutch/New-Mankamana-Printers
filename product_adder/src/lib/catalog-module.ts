import type { ProductModule } from "@prisma/client";

export const DEFAULT_CATALOG_MODULE: ProductModule = "PRINTING";

export function parseCatalogModule(raw: unknown): ProductModule {
  if (typeof raw !== "string") return DEFAULT_CATALOG_MODULE;
  const normalized = raw.trim().toUpperCase();
  return normalized === "MACHINERY" ? "MACHINERY" : DEFAULT_CATALOG_MODULE;
}

