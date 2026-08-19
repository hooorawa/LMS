import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import UserModel from "@/models/User";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";

export async function listStaff() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return UserModel.find(withTenantScope({ role: "institute-staff" }, session))
    .sort({ createdAt: -1 })
    .lean();
}

export async function getStaffById(id: string) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return UserModel.findOne(withTenantScope({ _id: id, role: "institute-staff" }, session)).lean();
}

export async function listStudents() {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return UserModel.find(withTenantScope({ role: "student" }, session))
    .sort({ createdAt: -1 })
    .lean();
}

export async function getStudentById(id: string) {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  await connectToDatabase();
  return UserModel.findOne(withTenantScope({ _id: id, role: "student" }, session))
    .populate("studentMeta.classId", "name section academicYear")
    .lean();
}
