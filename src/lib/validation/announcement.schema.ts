import { z } from "zod";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

export const createAnnouncementSchema = z
  .object({
    audience: z.enum(["institute", "class", "course"]),
    classId: z.string().trim().regex(OBJECT_ID_RE, "Invalid class.").optional().or(z.literal("")),
    courseId: z.string().trim().regex(OBJECT_ID_RE, "Invalid course.").optional().or(z.literal("")),
    title: z.string().trim().min(1, "Title is required."),
    body: z.string().trim().min(1, "Announcement body is required."),
  })
  .refine((data) => data.audience !== "class" || Boolean(data.classId), {
    message: "Select a class for a class-scoped announcement.",
    path: ["classId"],
  })
  .refine((data) => data.audience !== "course" || Boolean(data.courseId), {
    message: "Select a course for a course-scoped announcement.",
    path: ["courseId"],
  });

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
