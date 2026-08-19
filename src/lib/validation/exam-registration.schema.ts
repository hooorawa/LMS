import { z } from "zod";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

export const registerForExamSchema = z.object({
  examId: z.string().trim().regex(OBJECT_ID_RE, "Invalid exam."),
  specialRequirements: z.string().trim().max(1000, "Keep special requirements under 1,000 characters.").optional(),
});

export const cancelExamRegistrationSchema = z.object({
  registrationId: z.string().trim().regex(OBJECT_ID_RE, "Invalid registration."),
});
