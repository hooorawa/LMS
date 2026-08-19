import { z } from "zod";

export const createAssignmentSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  instructions: z.string().trim().optional().or(z.literal("")),
  dueAt: z.coerce.date({ message: "A valid due date is required." }),
  maxScore: z.coerce.number().int().positive(),
  attachmentKey: z.string().trim().optional().or(z.literal("")),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

export const updateAssignmentSchema = createAssignmentSchema.extend({
  status: z.enum(["draft", "published"]),
});

export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
