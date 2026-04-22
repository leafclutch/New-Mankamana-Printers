import prisma from "../../connect";
import { invalidateCacheByPrefix, invalidateCacheKey } from "../../utils/cache";

export const invalidateAllCatalogCaches = async () => {
  await invalidateCacheByPrefix("catalog:");
};

export const invalidateCatalogGroupCache = async (groupId?: string) => {
  const keys: Promise<void>[] = [invalidateCacheKey("catalog:browse")];
  if (groupId) keys.push(invalidateCacheKey(`catalog:group:${groupId}`));
  await Promise.all(keys);
};

export const invalidateCatalogCachesForProduct = async (productId: string) => {
  await Promise.all([
    invalidateCacheKey("catalog:active-products"),
    invalidateCacheKey(`catalog:product:${productId}`),
    invalidateCacheKey(`catalog:variants:${productId}`),
  ]);
};

export const invalidateCatalogPricingForVariant = async (variantId: string) => {
  await Promise.all([
    invalidateCacheKey(`catalog:variant-options:${variantId}`),
    invalidateCacheByPrefix(`catalog:pricing:${variantId}:`),
  ]);
};

export const invalidateCatalogCachesForVariant = async (variantId: string, productId?: string) => {
  const resolvedProductId =
    productId ??
    (
      await prisma.productVariant.findUnique({
        where: { id: variantId },
        select: { product_id: true },
      })
    )?.product_id;

  await invalidateCatalogPricingForVariant(variantId);

  if (resolvedProductId) {
    await invalidateCatalogCachesForProduct(resolvedProductId);
  } else {
    await invalidateCacheKey("catalog:active-products");
  }
};
