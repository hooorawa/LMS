import { z } from "zod";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

export const createClassSchema = z.object({
  name: z.string().trim().min(1, "Class name is required."),
  section: z.string().trim().optional().or(z.literal("")),
  academicYear: z
    .string()
    .trim()
    .min(4, "Academic year is required."),
  classTeacherId: z
    .string()
    .trim()
    .regex(OBJECT_ID_RE, "Invalid teacher selection.")
    .optional()
    .or(z.literal("")),
  timetableDay: z.string().optional().or(z.literal("")),
  timetableStart: z.string().optional().or(z.literal("")),
  timetableEnd: z.string().optional().or(z.literal("")),
  timetableRoom: z.string().trim().optional().or(z.literal("")),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;

export const updateClassSchema = createClassSchema.extend({
  status: z.enum(["active", "archived"]),
});

export type UpdateClassInput = z.infer<typeof updateClassSchema>;
