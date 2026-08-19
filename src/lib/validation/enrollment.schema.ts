import { z } from "zod";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

export const bulkEnrollSchema = z.object({
  classId: z.string().trim().regex(OBJECT_ID_RE, "Select a class."),
  courseId: z.string().trim().regex(OBJECT_ID_RE, "Select a course."),
});

export type BulkEnrollInput = z.infer<typeof bulkEnrollSchema>;
