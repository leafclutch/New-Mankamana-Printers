import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    client_id: z.string().min(3),
    password: z.string().min(4)
  })
});