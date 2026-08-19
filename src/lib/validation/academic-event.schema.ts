import { z } from "zod";
export const createAcademicEventSchema = z.object({
  title: z.string().trim().min(2, "Event title is required.").max(120),
  type: z.enum(["class", "exam", "holiday", "event", "deadline"]),
  startsAt: z.string().min(1, "Start date and time are required."),
  endsAt: z.string().optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
});
