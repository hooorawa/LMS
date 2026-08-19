import { z } from "zod";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

export const createFeeSchema = z.object({
  title: z.string().trim().min(1, "Fee title is required."),
  amount: z.coerce.number().positive("Amount must be greater than 0."),
  dueDate: z.string().trim().min(1, "Due date is required."),
  academicYear: z.string().trim().min(4, "Academic year is required."),
  frequency: z.enum(["one-time", "monthly", "term"]),
  classId: z.string().trim().regex(OBJECT_ID_RE, "Invalid class.").optional().or(z.literal("")),
  studentId: z.string().trim().regex(OBJECT_ID_RE, "Invalid student.").optional().or(z.literal("")),
});

export type CreateFeeInput = z.infer<typeof createFeeSchema>;

export const updateFeeSchema = createFeeSchema;

export type UpdateFeeInput = z.infer<typeof updateFeeSchema>;
