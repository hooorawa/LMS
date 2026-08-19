import { z } from "zod";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

export const createExamSchema = z.object({
  subjectId: z.string().trim().regex(OBJECT_ID_RE, "Invalid subject."),
  classId: z.string().trim().regex(OBJECT_ID_RE, "Invalid class."),
  title: z.string().trim().min(1, "Exam title is required."),
  examDate: z.string().trim().min(1, "Exam date is required."),
  maxMarks: z.coerce.number().positive("Max marks must be greater than 0."),
  term: z.string().trim().optional().or(z.literal("")),
  academicYear: z.string().trim().min(4, "Academic year is required."),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;

export const updateExamSchema = createExamSchema;

export type UpdateExamInput = z.infer<typeof updateExamSchema>;
