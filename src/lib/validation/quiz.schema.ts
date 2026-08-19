import { z } from "zod";

export const createQuizSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  instructions: z.string().trim().optional().or(z.literal("")),
  timeLimitMinutes: z.coerce.number().int().positive("Time limit must be a positive number."),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;

export const updateQuizSchema = createQuizSchema.extend({
  status: z.enum(["draft", "published"]),
});

export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
