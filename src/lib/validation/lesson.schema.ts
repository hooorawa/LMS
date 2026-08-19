import { z } from "zod";

const baseLessonFields = {
  title: z.string().trim().min(1, "Lesson title is required."),
  isPreview: z.boolean().default(false),
};

export const createLessonSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("video"),
    ...baseLessonFields,
    contentUrl: z.string().trim().min(1, "Upload a video before saving."),
    durationSeconds: z.coerce.number().int().positive().optional(),
  }),
  z.object({
    type: z.literal("pdf"),
    ...baseLessonFields,
    contentUrl: z.string().trim().min(1, "Upload a PDF before saving."),
  }),
  z.object({
    type: z.literal("text"),
    ...baseLessonFields,
    textBody: z.string().trim().min(1, "Lesson text is required."),
  }),
  z.object({
    type: z.literal("link"),
    ...baseLessonFields,
    contentUrl: z.string().trim().url("Enter a valid URL."),
  }),
]);

export type CreateLessonInput = z.infer<typeof createLessonSchema>;

export const updateLessonSchema = createLessonSchema;

export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
