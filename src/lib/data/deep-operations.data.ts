import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import { requireRole, requireSession, withTenantScope } from "@/lib/tenant/scope";
import AcademicTermModel from "@/models/AcademicTerm";
import AuditLogModel from "@/models/AuditLog";
import FeeConcessionModel from "@/models/FeeConcession";
import FeeModel from "@/models/Fee";
import StudentFollowUpModel from "@/models/StudentFollowUp";
import UserModel from "@/models/User";

export async function listAcademicTermsForInstitute() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();

  return AcademicTermModel.find(withTenantScope({}, session))
    .sort({ startsAt: -1 })
    .lean();
}

export async function listConcessionManagementData() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();

  const [students, fees, concessions] = await Promise.all([
    UserModel.find(withTenantScope({ role: "student" }, session))
      .select("name email studentMeta.rollNumber")
      .sort({ name: 1 })
      .lean(),
    FeeModel.find(withTenantScope({}, session)).select("title amount").sort({ title: 1 }).lean(),
    FeeConcessionModel.find(withTenantScope({}, session))
      .populate("studentId", "name studentMeta.rollNumber")
      .populate("feeId", "title")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return { students, fees, concessions };
}

export async function listTeacherFollowUpData() {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();

  const [students, followUps] = await Promise.all([
    UserModel.find(withTenantScope({ role: "student" }, session))
      .select("name email studentMeta.rollNumber studentMeta.classId")
      .populate("studentMeta.classId", "name section")
      .sort({ name: 1 })
      .lean(),
    StudentFollowUpModel.find(withTenantScope({ createdBy: session.userId }, session))
      .populate("studentId", "name")
      .sort({ createdAt: -1 })
      .limit(40)
      .lean(),
  ]);

  return { students, followUps };
}

export async function listInstituteAuditLogs(limit = 100) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();

  return AuditLogModel.find(withTenantScope({}, session))
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}
