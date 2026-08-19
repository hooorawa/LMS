"use server";

import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db/connect";
import { setSessionCookie } from "@/lib/auth/session";
import { requireRole, requireSession } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import UserModel from "@/models/User";
import InstituteModel from "@/models/Institute";

const IMPERSONATION_TTL_SECONDS = 60 * 60 * 2;

export async function startImpersonation(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);
  const targetUserId = formData.get("instituteAdminUserId");
  if (typeof targetUserId !== "string" || !/^[0-9a-fA-F]{24}$/.test(targetUserId)) return;
  await connectToDatabase();
  const target = await UserModel.findOne({ _id: targetUserId, role: "institute-admin", status: "active" });
  if (!target?.instituteId) return;
  const institute = await InstituteModel.findById(target.instituteId).select("name status");
  if (!institute || institute.status === "cancelled") return;
  const actor = await UserModel.findById(session.userId).select("name email").lean();
  await recordAuditEntry({
    session,
    instituteId: String(institute._id),
    actorName: actor?.name ?? "Unknown",
    action: "impersonation.start",
    targetType: "User",
    targetId: String(target._id),
    targetName: target.name,
    summary: `Started support impersonation as ${target.name} for ${institute.name}.`,
    metadata: { impersonatedUserId: String(target._id), impersonatedBy: session.userId },
  });
  await setSessionCookie({ userId: String(target._id), role: "institute-admin", instituteId: String(target.instituteId), mustChangePassword: target.mustChangePassword, impersonatedBy: session.userId, impersonatedByEmail: actor?.email }, IMPERSONATION_TTL_SECONDS);
  redirect("/dashboard");
}

export async function exitImpersonation(): Promise<void> {
  const session = await requireSession();
  if (!session.impersonatedBy) redirect("/dashboard");
  await connectToDatabase();
  const superAdmin = await UserModel.findOne({ _id: session.impersonatedBy, role: "super-admin", status: "active" }).select("name email mustChangePassword");
  if (!superAdmin) redirect("/login");
  const target = await UserModel.findById(session.userId).select("name instituteId");
  await recordAuditEntry({
    session: { userId: String(superAdmin._id), role: "super-admin", instituteId: null, mustChangePassword: superAdmin.mustChangePassword },
    instituteId: target?.instituteId ? String(target.instituteId) : null,
    actorName: superAdmin.name,
    action: "impersonation.stop",
    targetType: "User",
    targetId: session.userId,
    targetName: target?.name,
    summary: `Ended support impersonation${target?.name ? ` as ${target.name}` : ""}.`,
    metadata: { impersonatedBy: String(superAdmin._id) },
  });
  await setSessionCookie({ userId: String(superAdmin._id), role: "super-admin", instituteId: null, mustChangePassword: superAdmin.mustChangePassword });
  redirect("/dashboard");
}
