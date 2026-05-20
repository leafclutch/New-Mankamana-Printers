import prisma from "../../connect";

export type PricelistModule = "PRINTING" | "MACHINERY";

export type PricelistRow = {
  id: string;
  name: string;
  description: string | null;
  product_code: string;
  module: PricelistModule;
  group: string | null;
  minPrice: number | null;
};

export type PricelistModuleTab = {
  key: PricelistModule;
  label: string;
  rows: PricelistRow[];
  productCount: number;
  pricedCount: number;
};

type Cache = {
  rows: PricelistRow[];
  moduleTabs: PricelistModuleTab[];
  computedAt: number;
};

const HOUR_MS = 60 * 60 * 1000;
const PRICELIST_MIN_REFRESH_HOURS = 3;
const PRICELIST_MAX_REFRESH_HOURS = 5;

const resolvePricelistRefreshHours = (): number => {
  const raw = Number(process.env.PRICELIST_REFRESH_HOURS ?? PRICELIST_MIN_REFRESH_HOURS);
  if (!Number.isFinite(raw)) return PRICELIST_MIN_REFRESH_HOURS;
  return Math.min(PRICELIST_MAX_REFRESH_HOURS, Math.max(PRICELIST_MIN_REFRESH_HOURS, raw));
};

const PRICELIST_REFRESH_HOURS = resolvePricelistRefreshHours();
const PRICELIST_TTL_MS = Math.round(PRICELIST_REFRESH_HOURS * HOUR_MS);

let cache: Cache | null = null;
let computing = false;

const computeDiscount = (price: number, type: string | null, value: unknown): number => {
  const v = Number(value || 0);
  if (type === "fixed") return v;
  if (type === "percentage") return (price * v) / 100;
  return 0;
};

const buildModuleTab = (rows: PricelistRow[], key: PricelistModule, label: string): PricelistModuleTab => {
  const moduleRows = rows.filter((row) => row.module === key);
  return {
    key,
    label,
    rows: moduleRows,
    productCount: moduleRows.length,
    pricedCount: moduleRows.filter((r) => r.minPrice !== null && r.minPrice > 0).length,
  };
};

export const computePricelist = async (): Promise<PricelistRow[]> => {
  const products = await prisma.product.findMany({
    where: { is_active: true },
    select: {
      id: true,
      name: true,
      description: true,
      product_code: true,
      module: true,
      group: { select: { name: true } },
      variants: {
        where: { is_active: true },
        select: {
          pricing: {
            where: { is_active: true },
            select: { price: true, discount_type: true, discount_value: true },
          },
        },
      },
    },
    orderBy: { created_at: "asc" },
  });

  const rows: PricelistRow[] = products.map((p) => {
    let minPrice: number | null = null;

    for (const variant of p.variants) {
      for (const row of variant.pricing) {
        const price = Number(row.price);
        if (price <= 0) continue;
        const discount = computeDiscount(price, row.discount_type, row.discount_value);
        const final = Math.max(0, Number((price - discount).toFixed(2)));
        if (minPrice === null || final < minPrice) minPrice = final;
      }
    }

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      product_code: p.product_code,
      module: p.module as PricelistModule,
      group: p.group?.name ?? null,
      minPrice,
    };
  });

  const moduleTabs: PricelistModuleTab[] = [
    buildModuleTab(rows, "PRINTING", "Printing Services"),
    buildModuleTab(rows, "MACHINERY", "Machinery"),
  ];

  // Only replace the cache if the new computation has at least as many priced products
  // as the current cache. This prevents a temporary DB issue from degrading the list
  // by replacing known prices with "On request" entries.
  const newPricedCount = rows.filter((r) => r.minPrice !== null && r.minPrice > 0).length;
  const oldPricedCount = cache
    ? cache.rows.filter((r) => r.minPrice !== null && r.minPrice > 0).length
    : 0;

  if (!cache || newPricedCount >= oldPricedCount) {
    cache = { rows, moduleTabs, computedAt: Date.now() };
    console.log(
      `[Pricelist] Cache updated: ${rows.length} products, ${newPricedCount} priced, refresh=${PRICELIST_REFRESH_HOURS}h at ${new Date().toISOString()}`
    );
  } else {
    console.warn(
      `[Pricelist] Cache NOT updated: new computation has ${newPricedCount} priced products vs ${oldPricedCount} in cache, keeping old data`
    );
  }

  return rows;
};

/** Returns cached rows (stale-while-revalidate). First call blocks until ready. */
export const getPricelist = async (): Promise<{
  rows: PricelistRow[];
  moduleTabs: PricelistModuleTab[];
  computedAt: number;
  refreshHours: number;
}> => {
  if (cache) {
    const age = Date.now() - cache.computedAt;
    if (age < PRICELIST_TTL_MS) {
      // Fresh: serve immediately
      return { ...cache, refreshHours: PRICELIST_REFRESH_HOURS };
    }
    // Stale: serve old data and refresh in background
    if (!computing) {
      computing = true;
      computePricelist()
        .catch((err) => console.error("[Pricelist] Background refresh failed:", err))
        .finally(() => { computing = false; });
    }
    return { ...cache, refreshHours: PRICELIST_REFRESH_HOURS };
  }

  // Nothing cached yet: compute synchronously for the first caller
  computing = true;
  try {
    await computePricelist();
  } finally {
    computing = false;
  }
  return { ...cache!, refreshHours: PRICELIST_REFRESH_HOURS };
};

/** Call once at startup on non-serverless environments to keep cache proactively warm. */
export const schedulePricelistRefresh = (intervalMs = PRICELIST_TTL_MS): NodeJS.Timeout => {
  return setInterval(() => {
    computePricelist().catch((err) =>
      console.error("[Pricelist] Scheduled refresh failed:", err)
    );
  }, intervalMs);
};

export const getPricelistRefreshHours = (): number => PRICELIST_REFRESH_HOURS;
