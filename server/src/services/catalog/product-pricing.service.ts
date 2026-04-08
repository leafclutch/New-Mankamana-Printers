import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

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
    : JSON.stringify(Object.fromEntries(entries));
};

// getVariantPricingCombination: Queries the database for a price record matching the specific chosen options
export const getVariantPricingCombination = async (
  variantId: string,
  options: PricingOptionsInput
) => {
  const selectedOptions = normalizeSelectedOptions(options);
  const combinationKey = buildCombinationKey(selectedOptions);

  return await prisma.variantPricing.findFirst({
    where: {
      variant_id: variantId,
      combination_key: combinationKey,
      is_active: true,
    },
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
