import { z } from "zod";

export const createInstituteAdminSchema = z.object({
  instituteId: z.string().trim().min(1, "Institute is required."),
  name: z.string().trim().min(2, "Admin name must be at least 2 characters."),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().optional().or(z.literal("")),
});

export type CreateInstituteAdminInput = z.infer<typeof createInstituteAdminSchema>;
