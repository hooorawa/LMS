import { z } from "zod";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

export const recordPaymentSchema = z.object({
  studentId: z.string().trim().regex(OBJECT_ID_RE, "Invalid student."),
  feeId: z.string().trim().regex(OBJECT_ID_RE, "Invalid fee.").optional().or(z.literal("")),
  amount: z.coerce.number().positive("Amount must be greater than 0."),
  paymentMethod: z.enum(["cash", "bank-transfer", "card", "cheque", "other"]),
  paymentDate: z.string().trim().min(1, "Payment date is required."),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
