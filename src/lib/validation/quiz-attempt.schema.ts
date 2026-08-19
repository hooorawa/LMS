import { z } from "zod";

const quizAnswerSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("mcq"),
    questionId: z.string().trim().min(1),
    selectedOptionIndex: z.coerce.number().int().nonnegative().optional(),
  }),
  z.object({
    type: z.literal("truefalse"),
    questionId: z.string().trim().min(1),
    selectedBoolean: z.coerce.boolean().optional(),
  }),
  z.object({
    type: z.literal("short"),
    questionId: z.string().trim().min(1),
    textAnswer: z.string().trim().optional().or(z.literal("")),
  }),
]);

export const submitQuizAttemptSchema = z.object({
  answers: z.array(quizAnswerSchema).default([]),
});

export type SubmitQuizAttemptInput = z.infer<typeof submitQuizAttemptSchema>;

export const gradeShortAnswerSchema = z.object({
  points: z.coerce.number().min(0, "Points cannot be negative."),
});

export type GradeShortAnswerInput = z.infer<typeof gradeShortAnswerSchema>;
