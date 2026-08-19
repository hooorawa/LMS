import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import ClassModel from "@/models/Class";
import UserModel from "@/models/User";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";

export async function listClasses() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return ClassModel.find(withTenantScope({}, session))
    .populate("classTeacherId", "name")
    .sort({ createdAt: -1 })
    .lean();
}

export async function getClass(id: string) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return ClassModel.findOne(withTenantScope({ _id: id }, session)).lean();
}

export async function listClassesForTeacher() {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();
  return ClassModel.find(withTenantScope({}, session)).sort({ name: 1 }).lean();
}

export async function getMyClassForStudent() {
  const session = await requireSession();
  requireRole(session, ["student"]);

  await connectToDatabase();

  const student = await UserModel.findById(session.userId).select("studentMeta.classId").lean();
  const classId = student?.studentMeta?.classId;
  if (!classId) return null;

  return ClassModel.findOne(withTenantScope({ _id: classId }, session))
    .populate("classTeacherId", "name")
    .lean();
}
