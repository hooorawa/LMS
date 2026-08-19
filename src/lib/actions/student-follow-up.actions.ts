"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { recordAuditEntry } from "@/lib/audit/log";
import { requireRole, requireSession, withTenantScope } from "@/lib/tenant/scope";
import StudentFollowUpModel from "@/models/StudentFollowUp";
import UserModel from "@/models/User";

export async function createStudentFollowUp(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-staff", "institute-admin"]);

  const studentId = String(formData.get("studentId") ?? "").trim();
  const type = String(formData.get("type") ?? "general");
  const note = String(formData.get("note") ?? "").trim();
  const nextActionAtRaw = String(formData.get("nextActionAt") ?? "").trim();

  if (!studentId || !note) return;

  await connectToDatabase();

  const student = await UserModel.findOne(
    withTenantScope({ _id: studentId, role: "student" }, session)
  ).select("name studentMeta.classId");
  if (!student) return;

  const followUp = await StudentFollowUpModel.create({
    instituteId: session.instituteId,
    studentId,
    classId: student.studentMeta?.classId ?? null,
    type,
    note,
    nextActionAt: nextActionAtRaw ? new Date(nextActionAtRaw) : null,
    createdBy: session.userId,
  });

  const actor = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "student_follow_up.create",
    targetType: "StudentFollowUp",
    targetId: String(followUp._id),
    targetName: student.name,
    summary: `Added ${type} follow-up for ${student.name}`,
  });

  revalidatePath("/student-followups");
  revalidatePath("/workspace");
}

export async function createBillingFollowUps(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const studentIds = formData
    .getAll("ids")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const note = String(formData.get("note") ?? "").trim() || "Review outstanding fee balance and follow up with the student.";

  if (studentIds.length === 0) return;

  await connectToDatabase();

  const students = await UserModel.find(
    withTenantScope({ _id: { $in: studentIds }, role: "student" }, session)
  ).select("name studentMeta.classId");
  if (students.length === 0) return;

  const followUps = students.map((student) => ({
    instituteId: session.instituteId,
    studentId: student._id,
    classId: student.studentMeta?.classId ?? null,
    type: "general",
    note,
    createdBy: session.userId,
  }));

  await StudentFollowUpModel.insertMany(followUps);

  const actor = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "student_follow_up.bulk-billing-create",
    targetType: "StudentFollowUp",
    summary: `Created ${students.length} billing follow-ups`,
    after: { studentIds, note },
  });

  revalidatePath("/student-followups");
  revalidatePath("/payment-desk");
}
