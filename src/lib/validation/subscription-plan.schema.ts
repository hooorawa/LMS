import { z } from "zod";

export const createSubscriptionPlanSchema = z.object({
  name: z.string().trim().min(2, "Plan name must be at least 2 characters."),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters.")
    .max(40, "Slug must be at most 40 characters.")
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens."),
  description: z.string().trim().optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Price cannot be negative."),
  currency: z.string().trim().min(3).max(3).default("USD"),
  billingInterval: z.enum(["monthly", "yearly"]),
  limits: z
    .object({
      maxStudents: z.coerce.number().int().positive().nullable().optional(),
      maxStaff: z.coerce.number().int().positive().nullable().optional(),
      maxClasses: z.coerce.number().int().positive().nullable().optional(),
      maxSubjects: z.coerce.number().int().positive().nullable().optional(),
      storageMb: z.coerce.number().int().positive().nullable().optional(),
    })
    .default({}),
  features: z.array(z.string().trim()).default([]),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const updateSubscriptionPlanSchema = createSubscriptionPlanSchema.partial().extend({
  id: z.string().min(1, "Plan id is required."),
});

export type CreateSubscriptionPlanInput = z.infer<typeof createSubscriptionPlanSchema>;
export type UpdateSubscriptionPlanInput = z.infer<typeof updateSubscriptionPlanSchema>;
