import { z } from "zod";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

export const createCourseSchema = z.object({
  title: z.string().trim().min(1, "Course title is required."),
  description: z.string().trim().optional().or(z.literal("")),
  subjectId: z
    .string()
    .trim()
    .regex(OBJECT_ID_RE, "Invalid subject selection.")
    .optional()
    .or(z.literal("")),
  classIds: z.array(z.string().trim().regex(OBJECT_ID_RE, "Invalid class selection.")),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const updateCourseSchema = createCourseSchema.extend({
  status: z.enum(["draft", "published", "archived"]),
});

export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
