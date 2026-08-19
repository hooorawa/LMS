import "server-only";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db/connect";
import { requireSession, type SessionPayload } from "@/lib/tenant/scope";
import UserModel from "@/models/User";

export type StaffPermissionKey =
  | "dashboard"
  | "staff"
  | "students"
  | "subjects"
  | "classes"
  | "expenses"
  | "salary"
  | "income";

async function loadStaffPermissions(session: SessionPayload) {
  await connectToDatabase();
  const user = await UserModel.findById(session.userId).select("staffMeta.permissions").lean();
  return user?.staffMeta?.permissions ?? {};
}

export async function requireStaffModuleAccess(permission: StaffPermissionKey) {
  const session = await requireSession();
  if (session.role !== "institute-staff") return session;

  const permissions = await loadStaffPermissions(session);
  if (!permissions?.[permission]) {
    redirect("/dashboard");
  }

  return session;
}

export async function getStaffPermissionsForSession() {
  const session = await requireSession();
  if (session.role !== "institute-staff") return undefined;
  return loadStaffPermissions(session);
}
