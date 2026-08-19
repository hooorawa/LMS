import { z } from "zod";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

export const createSubjectSchema = z.object({
  name: z.string().trim().min(1, "Subject name is required."),
  code: z
    .string()
    .trim()
    .min(1, "Subject code is required.")
    .max(20, "Code must be at most 20 characters.")
    .regex(/^[a-zA-Z0-9-]+$/, "Code may only contain letters, numbers, and hyphens."),
  teacherId: z
    .string()
    .trim()
    .regex(OBJECT_ID_RE, "Invalid teacher selection.")
    .optional()
    .or(z.literal("")),
  classIds: z.array(z.string().trim().regex(OBJECT_ID_RE, "Invalid class selection.")).optional(),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;

export const updateSubjectSchema = createSubjectSchema;

export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
