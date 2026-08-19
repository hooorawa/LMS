import { z } from "zod";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

export const attendanceRecordSchema = z.object({
  studentId: z.string().trim().regex(OBJECT_ID_RE, "Invalid student."),
  status: z.enum(["present", "absent", "late", "excused"]),
});

export const markAttendanceSchema = z.object({
  classId: z.string().trim().regex(OBJECT_ID_RE, "Invalid class."),
  subjectId: z
    .string()
    .trim()
    .regex(OBJECT_ID_RE, "Invalid subject.")
    .optional()
    .or(z.literal("")),
  date: z.string().trim().min(1, "Date is required."),
  records: z.array(attendanceRecordSchema).min(1, "No students to mark."),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
