"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import ExamModel from "@/models/Exam";
import ExamRegistrationModel from "@/models/ExamRegistration";
import UserModel from "@/models/User";
import { requireRole, requireSession, withTenantScope } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import { cancelExamRegistrationSchema, registerForExamSchema } from "@/lib/validation/exam-registration.schema";

export type ExamRegistrationState = { error?: string; success?: string };

export async function registerForExam(
  _previous: ExamRegistrationState,
  formData: FormData
): Promise<ExamRegistrationState> {
  const session = await requireSession();
  requireRole(session, ["student"]);
  const parsed = registerForExamSchema.safeParse({
    examId: formData.get("examId"),
    specialRequirements: formData.get("specialRequirements") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid registration." };

  await connectToDatabase();
  const student = await UserModel.findById(session.userId).select("name studentMeta.classId");
  const exam = await ExamModel.findOne(withTenantScope({ _id: parsed.data.examId }, session));
  if (!student?.studentMeta?.classId || !exam || String(exam.classId) !== String(student.studentMeta.classId)) {
    return { error: "This exam is not available for your class." };
  }
  if (exam.examDate.getTime() < Date.now()) return { error: "Registration is closed because this exam has already started." };

  const existing = await ExamRegistrationModel.findOne({ examId: exam._id, studentId: session.userId });
  if (existing?.status === "registered") return { error: "You are already registered for this exam." };
  if (existing) {
    existing.status = "registered";
    existing.specialRequirements = parsed.data.specialRequirements || undefined;
    existing.registeredAt = new Date();
    existing.cancelledAt = null;
    await existing.save();
  } else {
    await ExamRegistrationModel.create({
      instituteId: session.instituteId,
      examId: exam._id,
      studentId: session.userId,
      specialRequirements: parsed.data.specialRequirements || undefined,
    });
  }

  await recordAuditEntry({
    session,
    actorName: student.name,
    action: "exam_registration.create",
    targetType: "Exam",
    targetId: exam._id.toString(),
    targetName: exam.title,
    summary: `Registered for exam "${exam.title}"`,
  });
  revalidatePath("/exam-registration");
  return { success: "Exam registration submitted." };
}

export async function cancelExamRegistration(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["student"]);
  const parsed = cancelExamRegistrationSchema.safeParse({ registrationId: formData.get("registrationId") });
  if (!parsed.success) return;
  await connectToDatabase();

  const registration = await ExamRegistrationModel.findOne({
    _id: parsed.data.registrationId,
    instituteId: session.instituteId,
    studentId: session.userId,
    status: "registered",
  }).populate("examId", "title examDate");
  if (!registration) return;
  const exam = registration.examId as unknown as { title?: string; examDate?: Date };
  if (!exam.examDate || exam.examDate.getTime() <= Date.now()) return;

  registration.status = "cancelled";
  registration.cancelledAt = new Date();
  await registration.save();
  const student = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({
    session,
    actorName: student?.name ?? "Unknown",
    action: "exam_registration.cancel",
    targetType: "Exam",
    targetId: String(registration.examId),
    targetName: exam.title ?? "Exam",
    summary: `Cancelled exam registration for "${exam.title ?? "Exam"}"`,
  });
  revalidatePath("/exam-registration");
}
