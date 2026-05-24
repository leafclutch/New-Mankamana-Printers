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

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const summarizeError = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return String(err);
};

const isTransientDbError = (err: unknown): boolean => {
  const message = summarizeError(err).toLowerCase();
  return (
    message.includes("server has closed the connection") ||
    message.includes("connection reset") ||
    message.includes("forcibly closed by the remote host") ||
    message.includes("can't reach database server") ||
    message.includes("timed out") ||
    message.includes("p1001") ||
    message.includes("p1002") ||
    message.includes("p1008") ||
    message.includes("p1017") ||
    message.includes("p2024") ||
    message.includes("p2037")
  );
};

const runWithDatabaseRetry = async <T>(label: string, task: () => Promise<T>): Promise<T> => {
  const retries = parsePositiveInt(process.env.CATALOG_WARMUP_DB_RETRIES, 2);
  const backoffMs = parsePositiveInt(process.env.CATALOG_WARMUP_DB_BACKOFF_MS, 350);

  let attempt = 0;
  while (true) {
    try {
      return await task();
    } catch (err) {
      if (!isTransientDbError(err) || attempt >= retries) {
        throw err;
      }

      attempt += 1;
      const waitMs = backoffMs * attempt;
      console.warn(
        `[CacheWarmup] ${label} transient DB error (retry ${attempt}/${retries}) in ${waitMs}ms: ${summarizeError(err)}`
      );
      await sleep(waitMs);
    }
  }
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
  const warmupEnabled = parseBoolean(process.env.CATALOG_WARMUP_ENABLED, true);
  if (!warmupEnabled) {
    console.log("[CacheWarmup] Skipped (CATALOG_WARMUP_ENABLED=false).");
    return;
  }

  try {
    const products = await runWithDatabaseRetry("Loading active products", () => listActiveProductsService());
    const productConcurrency = parsePositiveInt(process.env.CATALOG_WARMUP_PRODUCT_CONCURRENCY, 1);
    const variantConcurrency = parsePositiveInt(process.env.CATALOG_WARMUP_VARIANT_CONCURRENCY, 1);

    console.log(
      `[CacheWarmup] Warming cache for ${products.length} product(s) ` +
      `(product concurrency: ${productConcurrency}, variant concurrency: ${variantConcurrency})...`
    );

    await runWithConcurrency(products, productConcurrency, async (product) => {
      try {
        // Warm product detail and variant list in parallel for this product.
        const [, variantsData] = await Promise.all([
          runWithDatabaseRetry(`Loading product detail ${product.id}`, () => getActiveProductByIdService(product.id)),
          runWithDatabaseRetry(`Loading variants for product ${product.id}`, () => listActiveVariantsByProductService(product.id)),
        ]);

        // Warm variant options with bounded concurrency to avoid DB pool exhaustion.
        await runWithConcurrency(variantsData.data ?? [], variantConcurrency, async (variant) => {
          try {
            await runWithDatabaseRetry(`Loading options for variant ${variant.id}`, () => listVariantOptionsService(variant.id));
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
