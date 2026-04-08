import { z } from "zod";

// updateProfileSchema: Validates partial profile updates for registered clients
export const updateProfileSchema = z.object({
  business_name: z.string().min(2, "Business name is required").optional(),
  owner_name: z.string().min(2, "Owner name is required").optional(),
  email: z.string().email("Invalid email").optional(),
  address: z.string().optional(),
});
