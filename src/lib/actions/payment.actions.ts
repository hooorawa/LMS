"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import PaymentModel from "@/models/Payment";
import FeeModel from "@/models/Fee";
import UserModel from "@/models/User";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import { recordPaymentSchema } from "@/lib/validation/payment.schema";

async function generateReceiptNumber(instituteId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INST-${year}-`;
  const count = await PaymentModel.countDocuments({
    instituteId,
    receiptNumber: { $regex: `^${prefix}` },
  });
  return `${prefix}${String(count + 1).padStart(5, "0")}`;
}

export type RecordPaymentState = {
  error?: string;
  success?: {
    paymentId: string;
    receiptNumber: string;
  };
};

export async function recordPayment(
  _prevState: RecordPaymentState,
  formData: FormData
): Promise<RecordPaymentState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const parsed = recordPaymentSchema.safeParse({
    studentId: formData.get("studentId"),
    feeId: formData.get("feeId"),
    amount: formData.get("amount"),
    paymentMethod: formData.get("paymentMethod"),
    paymentDate: formData.get("paymentDate"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { studentId, feeId, amount, paymentMethod, paymentDate, notes } = parsed.data;

  await connectToDatabase();

  const student = await UserModel.findOne(
    withTenantScope({ _id: studentId, role: "student" }, session)
  );
  if (!student) {
    return { error: "Student not found in your institute." };
  }

  if (feeId) {
    const fee = await FeeModel.findOne(withTenantScope({ _id: feeId }, session));
    if (!fee) {
      return { error: "Fee not found in your institute." };
    }
  }

  let payment;
  for (let attempt = 0; attempt < 5; attempt++) {
    const receiptNumber = await generateReceiptNumber(session.instituteId as string);
    try {
      payment = await PaymentModel.create({
        instituteId: session.instituteId,
        studentId,
        feeId: feeId || undefined,
        amount,
        paymentMethod,
        paymentDate: new Date(paymentDate),
        receiptNumber,
        recordedBy: session.userId,
        notes: notes || undefined,
      });
      break;
    } catch (err) {
      const isDuplicateKey = (err as { code?: number })?.code === 11000;
      if (!isDuplicateKey || attempt === 4) throw err;
    }
  }

  if (!payment) {
    return { error: "Could not generate a receipt number. Please try again." };
  }

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "payment.record",
    targetType: "Payment",
    targetId: payment._id.toString(),
    targetName: payment.receiptNumber,
    summary: `Recorded payment of ${amount} from ${student.name} (receipt ${payment.receiptNumber})`,
    after: { amount: payment.amount, paymentMethod: payment.paymentMethod },
  });

  revalidatePath(`/fees/students/${studentId}/payments`);
  revalidatePath("/fees");

  return { success: { paymentId: payment._id.toString(), receiptNumber: payment.receiptNumber } };
}
