import { z } from "zod";

const uuidMessage = "Must be a valid UUID.";

export const productIdParamSchema = z.object({
  productId: z.string().uuid(uuidMessage),
});

export const variantIdParamSchema = z.object({
  variantId: z.string().uuid(uuidMessage),
});

export const pricingIdParamSchema = z.object({
  pricingId: z.string().uuid(uuidMessage),
});

export const selectedOptionsSchema = z.object({}).catchall(
  z.string().trim().min(1, "Selected option codes must be non-empty strings.")
);

export const calculatePricingBodySchema = z
  .object({
    variant_id: z.string().uuid("variant_id must be a valid UUID."),
    selected_options: selectedOptionsSchema,
    quantity: z.coerce
      .number()
      .int("quantity must be an integer.")
      .positive("quantity must be greater than 0."),
  })
  .strict();

export const legacyCalculatePriceBodySchema = z
  .object({
    quantity: z.coerce
      .number()
      .int("quantity must be an integer.")
      .positive("quantity must be greater than 0."),
    options: selectedOptionsSchema,
  })
  .strict();

export const updatePricingBodySchema = z
  .object({
    price: z.coerce.number().positive("price must be greater than 0.").optional(),
    discount: z.coerce.number().min(0, "discount must be greater than or equal to 0.").optional(),
  })
  .strict()
  .refine((value) => value.price !== undefined || value.discount !== undefined, {
    message: "At least one of price or discount must be provided.",
  });

