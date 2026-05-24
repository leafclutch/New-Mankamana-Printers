import { z } from "zod";

const panVatTypeSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .refine((value) => value === "PAN" || value === "VAT", "Please select PAN or VAT.");

// updateProfileSchema: Validates partial profile updates for registered clients
export const updateProfileSchema = z.object({
  business_name: z.string().min(2, "Business name is required").optional(),
  owner_name: z.string().min(2, "Owner name is required").optional(),
  email: z.string().email("Invalid email").optional(),
  address: z.string().optional(),
  pan_vat_type: panVatTypeSchema.optional(),
  pan_vat_no: z.string().trim().min(1, "PAN/VAT number is required").max(50, "PAN/VAT number is too long").optional(),
});
