import { z } from "zod";

export const createInstituteSchema = z.object({
  name: z.string().trim().min(2, "Institute name must be at least 2 characters."),
  code: z
    .string()
    .trim()
    .min(2, "Code must be at least 2 characters.")
    .max(20, "Code must be at most 20 characters.")
    .regex(/^[a-zA-Z0-9-]+$/, "Code may only contain letters, numbers, and hyphens."),
  contactEmail: z
    .string()
    .trim()
    .email("Enter a valid contact email.")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  adminName: z.string().trim().min(2, "Admin name must be at least 2 characters."),
  adminEmail: z.string().trim().email("Enter a valid admin email."),
});

export type CreateInstituteInput = z.infer<typeof createInstituteSchema>;
