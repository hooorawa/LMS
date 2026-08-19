import { z } from "zod";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

export const marksEntrySchema = z.object({
  studentId: z.string().trim().regex(OBJECT_ID_RE, "Invalid student."),
  marksObtained: z.coerce.number().min(0, "Marks cannot be negative."),
  remarks: z.string().trim().optional().or(z.literal("")),
});

export const enterMarksSchema = z.object({
  examId: z.string().trim().regex(OBJECT_ID_RE, "Invalid exam."),
  entries: z.array(marksEntrySchema).min(1, "No students to grade."),
});

export type EnterMarksInput = z.infer<typeof enterMarksSchema>;
