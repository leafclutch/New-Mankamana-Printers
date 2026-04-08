import { z } from "zod";

export const createRegistrationRequestSchema = z.object({
  body: z.object({
    companyName: z.string().min(2, "Company name is too short"),
    contactPerson: z.string().min(2, "Contact person name is too short"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(5, "Phone number is required"),
    address: z.string().optional(),
    message: z.string().optional(),
  }),
});
