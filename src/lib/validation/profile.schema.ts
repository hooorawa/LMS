import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  phone: z.string().trim().optional().or(z.literal("")),
  avatarUrl: z.string().trim().url("Enter a valid URL.").optional().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const notificationPreferencesSchema = z.object({
  announcements: z.boolean(),
  billing: z.boolean(),
  academic: z.boolean(),
});
