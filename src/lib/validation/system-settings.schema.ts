import { z } from "zod";

export const updateSystemSettingsSchema = z.object({
  systemName: z.string().trim().min(2, "System name must be at least 2 characters."),
  tagline: z.string().trim().optional().or(z.literal("")),
  logoUrl: z.string().trim().optional().or(z.literal("")),
  supportEmail: z
    .string()
    .trim()
    .email("Enter a valid support email.")
    .optional()
    .or(z.literal("")),
  defaultTrialDays: z.coerce
    .number()
    .int()
    .min(0, "Default trial days must be 0 or more.")
    .max(365, "Default trial days must be 365 or fewer."),
  primaryColor: z.string().trim().optional().or(z.literal("")),
  privacyPolicy: z.string().trim().optional().or(z.literal("")),
  termsOfUse: z.string().trim().optional().or(z.literal("")),
  helpCenterContent: z.string().trim().optional().or(z.literal("")),
});

export type UpdateSystemSettingsInput = z.infer<typeof updateSystemSettingsSchema>;
