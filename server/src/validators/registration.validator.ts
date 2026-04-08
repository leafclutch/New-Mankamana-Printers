import { z } from "zod";

// createRegistrationRequestSchema: Validates the initial sign-up data submitted by a guest business
export const createRegistrationRequestSchema = z.object({
  business_name: z.string().min(2, "Business name is required"),
  owner_name: z.string().min(2, "Owner name is required"),
  email: z
    .string()
    .regex(
      /^[a-zA-Z0-9._%+]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Enter a valid email address"
    ),
  phone_number: z
    .string()
    .regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  business_address: z.string().optional(),
  notes: z.string().optional(),
});

// rejectRegistrationRequestSchema: Ensures the admin provides a valid reason when denying a registration
export const rejectRegistrationRequestSchema = z.object({
  reason: z.string().min(5, "Rejection reason must be at least 5 characters"),
});
