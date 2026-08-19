import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import SubjectModel from "@/models/Subject";
import UserModel from "@/models/User";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";

export async function listSubjects() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return SubjectModel.find(withTenantScope({}, session))
    .populate("teacherId", "name")
    .populate("classIds", "name section")
    .sort({ createdAt: -1 })
    .lean();
}

export async function getSubject(id: string) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return SubjectModel.findOne(withTenantScope({ _id: id }, session)).lean();
}

export async function listSubjectsForTeacher() {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();
  return SubjectModel.find(withTenantScope({ teacherId: session.userId }, session))
    .sort({ name: 1 })
    .lean();
}

export async function listSubjectsForStudent() {
  const session = await requireSession();
  requireRole(session, ["student"]);

  await connectToDatabase();

  const student = await UserModel.findById(session.userId).select("studentMeta.classId").lean();
  const classId = student?.studentMeta?.classId;
  if (!classId) return [];

  return SubjectModel.find(withTenantScope({ classIds: classId }, session))
    .populate("teacherId", "name")
    .sort({ name: 1 })
    .lean();
}
