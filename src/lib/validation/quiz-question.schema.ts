import { z } from "zod";

const baseQuestionFields = {
  prompt: z.string().trim().min(1, "Prompt is required."),
  points: z.coerce.number().int().positive().default(1),
};

export const createQuizQuestionSchema = z
  .discriminatedUnion("type", [
    z.object({
      type: z.literal("mcq"),
      ...baseQuestionFields,
      options: z
        .array(z.string().trim().min(1, "Option text is required."))
        .min(2, "Provide at least two options."),
      correctOptionIndex: z.coerce.number().int().nonnegative(),
    }),
    z.object({
      type: z.literal("truefalse"),
      ...baseQuestionFields,
      correctBoolean: z.coerce.boolean(),
    }),
    z.object({
      type: z.literal("short"),
      ...baseQuestionFields,
      sampleAnswer: z.string().trim().optional().or(z.literal("")),
    }),
  ])
  .refine((data) => data.type !== "mcq" || data.correctOptionIndex < data.options.length, {
    message: "Correct option index is out of range.",
    path: ["correctOptionIndex"],
  });

export type CreateQuizQuestionInput = z.infer<typeof createQuizQuestionSchema>;

export const updateQuizQuestionSchema = createQuizQuestionSchema;

export type UpdateQuizQuestionInput = z.infer<typeof updateQuizQuestionSchema>;
