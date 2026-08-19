"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { requireRole, requireSession } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import UserModel from "@/models/User";
import InstituteModel from "@/models/Institute";
import SubscriptionModel from "@/models/Subscription";
import PlatformInvoiceModel from "@/models/PlatformInvoice";
import {
  createPlatformInvoiceSchema,
  markPlatformInvoicePaidSchema,
  voidPlatformInvoiceSchema,
} from "@/lib/validation/platform-invoice.schema";

async function getActorName(userId: string) {
  const actor = await UserModel.findById(userId).select("name").lean();
  return actor?.name ?? "Unknown";
}

async function nextInvoiceNumber() {
  const year = new Date().getFullYear();
  const prefix = `PLAT-${year}-`;
  const count = await PlatformInvoiceModel.countDocuments({ invoiceNumber: { $regex: `^${prefix}` } });
  return `${prefix}${String(count + 1).padStart(5, "0")}`;
}

export type InvoiceActionState = { error?: string; success?: { invoiceId: string; invoiceNumber: string } };

export async function createInvoice(
  _previousState: InvoiceActionState,
  formData: FormData
): Promise<InvoiceActionState> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);
  const parsed = createPlatformInvoiceSchema.safeParse({
    instituteId: formData.get("instituteId"), periodStart: formData.get("periodStart"), periodEnd: formData.get("periodEnd"),
    amount: formData.get("amount"), currency: formData.get("currency"), issuedAt: formData.get("issuedAt"),
    dueAt: formData.get("dueAt"), notes: formData.get("notes"),
    discountAmount: formData.get("discountAmount") || undefined, discountReason: formData.get("discountReason"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  await connectToDatabase();
  const [institute, subscription] = await Promise.all([
    InstituteModel.findById(parsed.data.instituteId),
    SubscriptionModel.findOne({ instituteId: parsed.data.instituteId }).populate("planId"),
  ]);
  if (!institute) return { error: "Institute not found." };
  if (!subscription || !subscription.planId || typeof subscription.planId === "string") return { error: "This institute has no assigned subscription plan." };
  let invoice: InstanceType<typeof PlatformInvoiceModel> | undefined;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      invoice = await PlatformInvoiceModel.create({
        ...parsed.data, subscriptionId: subscription._id, planId: subscription.planId._id,
        planNameSnapshot: subscription.planId.name, invoiceNumber: await nextInvoiceNumber(), recordedBy: session.userId,
        notes: parsed.data.notes || undefined,
        discountAmount: parsed.data.discountAmount ?? 0,
        discountReason: parsed.data.discountReason || undefined,
      });
      break;
    } catch (error) {
      if ((error as { code?: number }).code !== 11000 || attempt === 4) throw error;
    }
  }
  if (!invoice) return { error: "Could not create an invoice. Please try again." };
  const actorName = await getActorName(session.userId);
  await recordAuditEntry({ session, actorName, action: "platformInvoice.create", targetType: "PlatformInvoice", targetId: String(invoice._id), targetName: invoice.invoiceNumber, instituteId: institute._id.toString(), summary: `Created invoice ${invoice.invoiceNumber} for ${institute.name}.`, after: { amount: invoice.amount, currency: invoice.currency, instituteId: String(institute._id), discountAmount: invoice.discountAmount, discountReason: invoice.discountReason } });
  revalidatePath("/billing"); revalidatePath("/billing/invoices");
  return { success: { invoiceId: String(invoice._id), invoiceNumber: invoice.invoiceNumber } };
}

export async function markInvoicePaid(_previousState: InvoiceActionState, formData: FormData): Promise<InvoiceActionState> {
  const session = await requireSession(); requireRole(session, ["super-admin"]);
  const parsed = markPlatformInvoicePaidSchema.safeParse({ invoiceId: formData.get("invoiceId"), paymentMethod: formData.get("paymentMethod"), receiptNumber: formData.get("receiptNumber"), paidAt: formData.get("paidAt") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  await connectToDatabase();
  const invoice = await PlatformInvoiceModel.findById(parsed.data.invoiceId);
  if (!invoice) return { error: "Invoice not found." };
  if (invoice.status === "void") return { error: "A void invoice cannot be paid." };
  if (invoice.status === "paid") return { error: "This invoice is already paid." };
  invoice.status = "paid"; invoice.paymentMethod = parsed.data.paymentMethod; invoice.receiptNumber = parsed.data.receiptNumber || undefined; invoice.paidAt = new Date(parsed.data.paidAt); await invoice.save();
  const actorName = await getActorName(session.userId);
  await recordAuditEntry({ session, actorName, action: "platformInvoice.markPaid", targetType: "PlatformInvoice", targetId: String(invoice._id), targetName: invoice.invoiceNumber, instituteId: invoice.instituteId.toString(), summary: `Marked invoice ${invoice.invoiceNumber} as paid.`, after: { paymentMethod: invoice.paymentMethod, paidAt: invoice.paidAt } });
  revalidatePath("/billing"); revalidatePath("/billing/invoices"); revalidatePath(`/billing/invoices/${invoice._id}`);
  return { success: { invoiceId: String(invoice._id), invoiceNumber: invoice.invoiceNumber } };
}

export async function voidInvoice(_previousState: InvoiceActionState, formData: FormData): Promise<InvoiceActionState> {
  const session = await requireSession(); requireRole(session, ["super-admin"]);
  const parsed = voidPlatformInvoiceSchema.safeParse({ invoiceId: formData.get("invoiceId"), reason: formData.get("reason") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  await connectToDatabase(); const invoice = await PlatformInvoiceModel.findById(parsed.data.invoiceId);
  if (!invoice) return { error: "Invoice not found." }; if (invoice.status === "paid") return { error: "A paid invoice cannot be voided." }; if (invoice.status === "void") return { error: "This invoice is already void." };
  invoice.status = "void"; invoice.notes = [invoice.notes, `Voided: ${parsed.data.reason}`].filter(Boolean).join("\n"); await invoice.save();
  const actorName = await getActorName(session.userId);
  await recordAuditEntry({ session, actorName, action: "platformInvoice.void", targetType: "PlatformInvoice", targetId: String(invoice._id), targetName: invoice.invoiceNumber, instituteId: invoice.instituteId.toString(), summary: `Voided invoice ${invoice.invoiceNumber}: ${parsed.data.reason}`, after: { status: "void", reason: parsed.data.reason } });
  revalidatePath("/billing"); revalidatePath("/billing/invoices"); revalidatePath(`/billing/invoices/${invoice._id}`);
  return { success: { invoiceId: String(invoice._id), invoiceNumber: invoice.invoiceNumber } };
}
