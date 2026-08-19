import { z } from "zod";

export const createExpenseSchema = z.object({
  year: z.string().trim().min(4, "Year is required."),
  month: z.string().trim().min(1, "Month is required."),
  type: z.string().trim().min(1, "Expense type is required."),
  price: z.coerce.number().positive("Price must be greater than 0."),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const createExtraIncomeSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  description: z.string().trim().optional().or(z.literal("")),
  amount: z.coerce.number().positive("Amount must be greater than 0."),
  year: z.string().trim().min(4, "Year is required."),
  month: z.string().trim().min(1, "Month is required."),
});

export type CreateExtraIncomeInput = z.infer<typeof createExtraIncomeSchema>;
