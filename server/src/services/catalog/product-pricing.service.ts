import prisma from "../../connect";
import { withCache } from "../../utils/cache";

type PricingOptionsInput = Record<string, unknown> | undefined;

export const normalizeSelectedOptions = (options: PricingOptionsInput = {}) => {
  const entries = Object.entries(options).reduce<Array<readonly [string, string]>>((acc, [key, value]) => {
    if (key !== "configDetails" && typeof value === "string") {
      const trimmedValue = value.trim();
      if (trimmedValue.length > 0) {
        acc.push([key, trimmedValue] as const);
      }
    }
    return acc;
  }, []).sort(([left], [right]) => left.localeCompare(right));

  return Object.fromEntries(entries) as Record<string, string>;
};

export const buildCombinationKey = (selectedOptions: Record<string, string>) => {
  const entries = Object.entries(selectedOptions).sort(([left], [right]) => left.localeCompare(right));
  return entries.length === 0
    ? "__NO_OPTIONS__"
    : entries.map(([k, v]) => `${k}:${v}`).join("|");
};

// getVariantPricingCombination: Resolves the price row for a chosen option set.
// Caches pricing-dimension names per variant (2 min) to avoid repeated DB round-trips
// on every order validation call.
export const getVariantPricingCombination = async (
  variantId: string,
  options: PricingOptionsInput
) => {
  const selectedOptions = normalizeSelectedOptions(options);

  // Cache the set of pricing-dimension group names — stable until admin changes config
  const pricingDimNames = await withCache(
    `catalog:pricing-dims:${variantId}`,
    120_000,
    async () => {
      const groups = await prisma.optionGroup.findMany({
        where: { variant_id: variantId, is_pricing_dimension: true },
        select: { name: true },
      });
      return groups.map((g) => g.name);
    }
  );

  const dimSet = new Set(pricingDimNames);
  const pricingOptions = Object.fromEntries(
    Object.entries(selectedOptions).filter(([k]) => dimSet.has(k))
  );
  const combinationKey = buildCombinationKey(pricingOptions);

  // Cache each pricing row by variant + combination key (2 min — prices change occasionally)
  return withCache(
    `catalog:pricing:${variantId}:${combinationKey}`,
    120_000,
    () =>
      prisma.variantPricing.findFirst({
        where: { variant_id: variantId, combination_key: combinationKey, is_active: true },
      })
  );
};

// getVariantPricingCombinationFresh: Same as above but bypasses the pricing-row cache.
// Use this at order-creation time so the charged price is always current, regardless of
// whether in-memory or Redis caches on this instance have been invalidated yet.
export const getVariantPricingCombinationFresh = async (
  variantId: string,
  options: PricingOptionsInput
) => {
  const selectedOptions = normalizeSelectedOptions(options);

  const pricingDimNames = await withCache(
    `catalog:pricing-dims:${variantId}`,
    120_000,
    async () => {
      const groups = await prisma.optionGroup.findMany({
        where: { variant_id: variantId, is_pricing_dimension: true },
        select: { name: true },
      });
      return groups.map((g) => g.name);
    }
  );

  const dimSet = new Set(pricingDimNames);
  const pricingOptions = Object.fromEntries(
    Object.entries(selectedOptions).filter(([k]) => dimSet.has(k))
  );
  const combinationKey = buildCombinationKey(pricingOptions);

  return prisma.variantPricing.findFirst({
    where: { variant_id: variantId, combination_key: combinationKey, is_active: true },
  });
};

// resolveCombinationPrice: Helper to extract only the price value for a given option set
export const resolveCombinationPrice = async (
  variantId: string,
  options: PricingOptionsInput
) => {
  const pricing = await getVariantPricingCombination(variantId, options);
  return pricing ? pricing.price : null;
};

// calculateOrderAmount: Core business logic for applying discounts and calculating final totals
export const calculateOrderAmount = (
  unitPrice: number,
  quantity: number,
  discount?: { type: "percentage" | "fixed"; value: number }
) => {
  const totalAmount = unitPrice * quantity;
  let discountAmount = 0;

  if (discount) {
    if (discount.type === "percentage") {
      discountAmount = totalAmount * (discount.value / 100);
    } else if (discount.type === "fixed") {
      discountAmount = discount.value;
    }
  }

  const finalAmount = Math.max(0, totalAmount - discountAmount);

  return {
    totalAmount,
    discountAmount,
    finalAmount,
  };
};
