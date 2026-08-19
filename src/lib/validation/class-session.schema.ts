import { z } from "zod";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

export const classSessionIdSchema = z.object({
  classId: z.string().trim().regex(OBJECT_ID_RE, "Invalid class."),
});

export const markAttemptAttendanceSchema = z.object({
  classId: z.string().trim().regex(OBJECT_ID_RE, "Invalid class."),
  studentId: z.string().trim().regex(OBJECT_ID_RE, "Invalid student."),
  attendance: z.enum(["attended", "absent"]),
});

export type MarkAttemptAttendanceInput = z.infer<typeof markAttemptAttendanceSchema>;
