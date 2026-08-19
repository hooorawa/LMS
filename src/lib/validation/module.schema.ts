import { z } from "zod";

export const createModuleSchema = z.object({
  title: z.string().trim().min(1, "Module title is required."),
});

export type CreateModuleInput = z.infer<typeof createModuleSchema>;

export const updateModuleSchema = createModuleSchema;

export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
