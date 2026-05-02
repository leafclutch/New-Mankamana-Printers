import {
  getActiveProductByIdService,
  listActiveProductsService,
  listActiveVariantsByProductService,
  listVariantOptionsService,
} from "../services/catalog/catalog-pricing.service";

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.floor(parsed);
};

const runWithConcurrency = async <T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
) => {
  if (items.length === 0) {
    return;
  }

  const effectiveConcurrency = Math.max(1, Math.min(concurrency, items.length));
  let cursor = 0;

  await Promise.all(
    Array.from({ length: effectiveConcurrency }, async () => {
      while (true) {
        const index = cursor;
        cursor += 1;
        if (index >= items.length) {
          break;
        }
        await worker(items[index]);
      }
    })
  );
};

/**
 * preWarmCatalogCache
 *
 * Called once on server startup. Fetches every active product, variant, and
 * variant-options record so the first real user request can hit cache.
 *
 * Runs fire-and-forget. Errors are logged but never crash the server.
 */
export const preWarmCatalogCache = async (): Promise<void> => {
  try {
    const products = await listActiveProductsService();
    const productConcurrency = parsePositiveInt(process.env.CATALOG_WARMUP_PRODUCT_CONCURRENCY, 2);
    const variantConcurrency = parsePositiveInt(process.env.CATALOG_WARMUP_VARIANT_CONCURRENCY, 2);

    console.log(
      `[CacheWarmup] Warming cache for ${products.length} product(s) ` +
      `(product concurrency: ${productConcurrency}, variant concurrency: ${variantConcurrency})...`
    );

    await runWithConcurrency(products, productConcurrency, async (product) => {
      try {
        // Warm product detail and variant list in parallel for this product.
        const [, variantsData] = await Promise.all([
          getActiveProductByIdService(product.id),
          listActiveVariantsByProductService(product.id),
        ]);

        // Warm variant options with bounded concurrency to avoid DB pool exhaustion.
        await runWithConcurrency(variantsData.data ?? [], variantConcurrency, async (variant) => {
          try {
            await listVariantOptionsService(variant.id);
          } catch (err: any) {
            console.warn(`[CacheWarmup] Skipping variant ${variant.id}: ${err?.message}`);
          }
        });
      } catch (err: any) {
        console.warn(`[CacheWarmup] Skipping product ${product.id}: ${err?.message}`);
      }
    });

    console.log("[CacheWarmup] Catalog cache warm-up complete.");
  } catch (err: any) {
    console.warn("[CacheWarmup] Warm-up failed (non-fatal):", err?.message);
  }
};
