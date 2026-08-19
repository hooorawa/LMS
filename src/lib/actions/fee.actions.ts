"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import FeeModel from "@/models/Fee";
import PaymentModel from "@/models/Payment";
import ClassModel from "@/models/Class";
import UserModel from "@/models/User";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import { createFeeSchema, updateFeeSchema } from "@/lib/validation/fee.schema";

export type CreateFeeState = {
  error?: string;
  success?: {
    feeId: string;
    title: string;
  };
};

export async function createFee(
  _prevState: CreateFeeState,
  formData: FormData
): Promise<CreateFeeState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const parsed = createFeeSchema.safeParse({
    title: formData.get("title"),
    amount: formData.get("amount"),
    dueDate: formData.get("dueDate"),
    academicYear: formData.get("academicYear"),
    frequency: formData.get("frequency"),
    classId: formData.get("classId"),
    studentId: formData.get("studentId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { title, amount, dueDate, academicYear, frequency, classId, studentId } = parsed.data;

  await connectToDatabase();

  if (classId) {
    const klass = await ClassModel.findOne(withTenantScope({ _id: classId }, session));
    if (!klass) {
      return { error: "Class not found in your institute." };
    }
  }

  if (studentId) {
    const student = await UserModel.findOne(
      withTenantScope({ _id: studentId, role: "student" }, session)
    );
    if (!student) {
      return { error: "Student not found in your institute." };
    }
  }

  const fee = await FeeModel.create({
    instituteId: session.instituteId,
    classId: classId || undefined,
    studentId: studentId || undefined,
    title,
    amount,
    dueDate: new Date(dueDate),
    academicYear,
    frequency,
    createdBy: session.userId,
  });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "fee.create",
    targetType: "Fee",
    targetId: fee._id.toString(),
    targetName: fee.title,
    summary: `Created fee "${fee.title}" (${academicYear})`,
    after: { title: fee.title, amount: fee.amount, dueDate: fee.dueDate },
  });

  revalidatePath("/fees");

  return { success: { feeId: fee._id.toString(), title: fee.title } };
}

export type UpdateFeeState = {
  error?: string;
  success?: {
    feeId: string;
    title: string;
  };
};

export async function updateFee(
  _prevState: UpdateFeeState,
  formData: FormData
): Promise<UpdateFeeState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Missing fee id." };
  }

  const parsed = updateFeeSchema.safeParse({
    title: formData.get("title"),
    amount: formData.get("amount"),
    dueDate: formData.get("dueDate"),
    academicYear: formData.get("academicYear"),
    frequency: formData.get("frequency"),
    classId: formData.get("classId"),
    studentId: formData.get("studentId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { title, amount, dueDate, academicYear, frequency, classId, studentId } = parsed.data;

  await connectToDatabase();

  const fee = await FeeModel.findOne(withTenantScope({ _id: id }, session));
  if (!fee) {
    return { error: "Fee not found." };
  }

  if (classId) {
    const klass = await ClassModel.findOne(withTenantScope({ _id: classId }, session));
    if (!klass) {
      return { error: "Class not found in your institute." };
    }
  }

  if (studentId) {
    const student = await UserModel.findOne(
      withTenantScope({ _id: studentId, role: "student" }, session)
    );
    if (!student) {
      return { error: "Student not found in your institute." };
    }
  }

  const before = {
    title: fee.title,
    amount: fee.amount,
    dueDate: fee.dueDate,
  };

  fee.title = title;
  fee.amount = amount;
  fee.dueDate = new Date(dueDate);
  fee.academicYear = academicYear;
  fee.frequency = frequency;
  fee.classId = classId || undefined;
  fee.studentId = studentId || undefined;
  await fee.save();

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "fee.update",
    targetType: "Fee",
    targetId: fee._id.toString(),
    targetName: fee.title,
    summary: `Updated fee "${fee.title}"`,
    before,
    after: { title: fee.title, amount: fee.amount, dueDate: fee.dueDate },
  });

  revalidatePath("/fees");

  return { success: { feeId: fee._id.toString(), title: fee.title } };
}

export async function deleteFee(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await connectToDatabase();

  const fee = await FeeModel.findOne(withTenantScope({ _id: id }, session));
  if (!fee) return;

  await FeeModel.deleteOne({ _id: fee._id });
  await PaymentModel.updateMany({ feeId: fee._id }, { $set: { feeId: null } });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "fee.delete",
    targetType: "Fee",
    targetId: fee._id.toString(),
    targetName: fee.title,
    summary: `Deleted fee "${fee.title}"`,
    before: { title: fee.title, amount: fee.amount, dueDate: fee.dueDate },
  });

  revalidatePath("/fees");
}
