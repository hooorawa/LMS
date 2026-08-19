import { z } from "zod";

const objectId = z.string().trim().regex(/^[0-9a-fA-F]{24}$/, "Invalid identifier.");

export const createPlatformInvoiceSchema = z
  .object({
    instituteId: objectId,
    periodStart: z.string().trim().min(1, "Period start is required."),
    periodEnd: z.string().trim().min(1, "Period end is required."),
    amount: z.coerce.number().nonnegative("Amount cannot be negative."),
    currency: z.string().trim().length(3, "Use a three-letter currency code.").transform((value) => value.toUpperCase()),
    issuedAt: z.string().trim().min(1, "Issue date is required."),
    dueAt: z.string().trim().min(1, "Due date is required."),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
    discountAmount: z.coerce.number().nonnegative("Discount cannot be negative.").optional(),
    discountReason: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .refine((data) => new Date(data.periodEnd) >= new Date(data.periodStart), {
    message: "Period end must be after the period start.",
    path: ["periodEnd"],
  })
  .refine((data) => new Date(data.dueAt) >= new Date(data.issuedAt), {
    message: "Due date must be on or after the issue date.",
    path: ["dueAt"],
  })
  .refine((data) => (data.discountAmount ?? 0) <= data.amount, {
    message: "Discount cannot exceed the invoice amount.",
    path: ["discountAmount"],
  });

export type CreatePlatformInvoiceInput = z.infer<typeof createPlatformInvoiceSchema>;

export const markPlatformInvoicePaidSchema = z.object({
  invoiceId: objectId,
  paymentMethod: z.enum(["bank-transfer", "cash", "cheque", "card-manual", "other"]),
  receiptNumber: z.string().trim().max(200).optional().or(z.literal("")),
  paidAt: z.string().trim().min(1, "Payment date is required."),
});

export const voidPlatformInvoiceSchema = z.object({
  invoiceId: objectId,
  reason: z.string().trim().min(2, "A void reason is required.").max(1000),
});
