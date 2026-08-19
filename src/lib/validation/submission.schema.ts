import { z } from "zod";

export const submitAssignmentSchema = z
  .object({
    textResponse: z.string().trim().optional().or(z.literal("")),
    attachmentKey: z.string().trim().optional().or(z.literal("")),
  })
  .refine((data) => Boolean(data.textResponse) || Boolean(data.attachmentKey), {
    message: "Provide a text response or an attachment.",
    path: ["textResponse"],
  });

export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;

export const gradeSubmissionSchema = z.object({
  score: z.coerce.number().min(0, "Score cannot be negative."),
  feedback: z.string().trim().optional().or(z.literal("")),
});

export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
