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

const resolveProductGroupId = async (productId: string): Promise<string | null> => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { group_id: true },
  });
  return product?.group_id ?? null;
};

export const invalidateCatalogCachesForProduct = async (productId: string, groupId?: string | null) => {
  const resolvedGroupId = groupId !== undefined ? groupId : await resolveProductGroupId(productId);

  const keys: Promise<void>[] = [
    invalidateCacheKey("catalog:browse"),
    invalidateCacheKey("catalog:active-products"),
    invalidateCacheKey(`catalog:product:${productId}`),
    invalidateCacheKey(`catalog:variants:${productId}`),
  ];

  if (resolvedGroupId) {
    keys.push(invalidateCacheKey(`catalog:group:${resolvedGroupId}`));
  }

  await Promise.all(keys);
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
