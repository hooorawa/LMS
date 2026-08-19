"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import { recordAuditEntry } from "@/lib/audit/log";
import { requireRole, requireSession, withTenantScope } from "@/lib/tenant/scope";
import FeeConcessionModel from "@/models/FeeConcession";
import FeeModel from "@/models/Fee";
import UserModel from "@/models/User";

export async function createFeeConcession(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const studentId = String(formData.get("studentId") ?? "").trim();
  const feeId = String(formData.get("feeId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "fixed");
  const value = Number(formData.get("value") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim();

  if (!studentId || !title || !["fixed", "percent"].includes(type) || value <= 0) return;

  await connectToDatabase();

  const student = await UserModel.findOne(withTenantScope({ _id: studentId, role: "student" }, session));
  if (!student) return;

  if (feeId) {
    const fee = await FeeModel.findOne(withTenantScope({ _id: feeId }, session));
    if (!fee) return;
  }

  const concession = await FeeConcessionModel.create({
    instituteId: session.instituteId,
    studentId,
    feeId: feeId || null,
    title,
    type,
    value,
    reason: reason || undefined,
    createdBy: session.userId,
  });

  const actor = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "fee_concession.create",
    targetType: "FeeConcession",
    targetId: String(concession._id),
    targetName: title,
    summary: `Created fee concession "${title}" for ${student.name}`,
    after: { studentId, feeId: feeId || null, type, value },
  });

  revalidatePath("/concessions");
  revalidatePath("/fees");
}
