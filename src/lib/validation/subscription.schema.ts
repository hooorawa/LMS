import { z } from "zod";

export const assignPlanSchema = z.object({
  instituteId: z.string().min(1, "Institute id is required."),
  planId: z.string().min(1, "Plan id is required."),
  currentPeriodStart: z.coerce.date().optional(),
  currentPeriodEnd: z.coerce.date().optional(),
});

export const suspendInstituteSchema = z.object({
  instituteId: z.string().min(1, "Institute id is required."),
  reason: z.string().trim().min(2, "Provide a reason for suspending this institute."),
});

export const reactivateInstituteSchema = z.object({
  instituteId: z.string().min(1, "Institute id is required."),
});

export const cancelInstituteSchema = z.object({
  instituteId: z.string().min(1, "Institute id is required."),
  reason: z.string().trim().min(2, "Provide a reason for cancelling this institute."),
});

export type AssignPlanInput = z.infer<typeof assignPlanSchema>;
export type SuspendInstituteInput = z.infer<typeof suspendInstituteSchema>;
export type ReactivateInstituteInput = z.infer<typeof reactivateInstituteSchema>;
export type CancelInstituteInput = z.infer<typeof cancelInstituteSchema>;
