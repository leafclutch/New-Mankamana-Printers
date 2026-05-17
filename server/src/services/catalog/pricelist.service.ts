import prisma from "../../connect";

export type PricelistRow = {
  id: string;
  name: string;
  description: string | null;
  product_code: string;
  group: string | null;
  minPrice: number | null;
};

type Cache = {
  rows: PricelistRow[];
  computedAt: number;
};

const PRICELIST_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

let cache: Cache | null = null;
let computing = false;

const computeDiscount = (price: number, type: string | null, value: unknown): number => {
  const v = Number(value || 0);
  if (type === "fixed") return v;
  if (type === "percentage") return (price * v) / 100;
  return 0;
};

export const computePricelist = async (): Promise<PricelistRow[]> => {
  const products = await prisma.product.findMany({
    where: { is_active: true },
    select: {
      id: true,
      name: true,
      description: true,
      product_code: true,
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
      group: p.group?.name ?? null,
      minPrice,
    };
  });

  // Only replace the cache if the new computation has at least as many priced products
  // as the current cache. This prevents a temporary DB issue from degrading the list
  // by replacing known prices with "On request" entries.
  const newPricedCount = rows.filter((r) => r.minPrice !== null && r.minPrice > 0).length;
  const oldPricedCount = cache
    ? cache.rows.filter((r) => r.minPrice !== null && r.minPrice > 0).length
    : 0;

  if (!cache || newPricedCount >= oldPricedCount) {
    cache = { rows, computedAt: Date.now() };
    console.log(
      `[Pricelist] Cache updated: ${rows.length} products, ${newPricedCount} priced at ${new Date().toISOString()}`
    );
  } else {
    console.warn(
      `[Pricelist] Cache NOT updated: new computation has ${newPricedCount} priced products vs ${oldPricedCount} in cache — keeping old data`
    );
  }

  return rows;
};

/** Returns cached rows (stale-while-revalidate). First call blocks until ready. */
export const getPricelist = async (): Promise<{ rows: PricelistRow[]; computedAt: number }> => {
  if (cache) {
    const age = Date.now() - cache.computedAt;
    if (age < PRICELIST_TTL_MS) {
      // Fresh — serve immediately
      return cache;
    }
    // Stale — serve old data and refresh in background
    if (!computing) {
      computing = true;
      computePricelist()
        .catch((err) => console.error("[Pricelist] Background refresh failed:", err))
        .finally(() => { computing = false; });
    }
    return cache;
  }

  // Nothing cached yet — compute synchronously for the first caller
  computing = true;
  try {
    await computePricelist();
  } finally {
    computing = false;
  }
  return cache!;
};

/** Call once at startup on non-serverless environments to keep cache proactively warm. */
export const schedulePricelistRefresh = (intervalMs = PRICELIST_TTL_MS): NodeJS.Timeout => {
  return setInterval(() => {
    computePricelist().catch((err) =>
      console.error("[Pricelist] Scheduled refresh failed:", err)
    );
  }, intervalMs);
};
