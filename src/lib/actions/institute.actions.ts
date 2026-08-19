"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import InstituteModel from "@/models/Institute";
import UserModel from "@/models/User";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { generateTempPassword, hashPassword } from "@/lib/auth/password";
import { recordAuditEntry } from "@/lib/audit/log";
import { createInstituteSchema } from "@/lib/validation/institute.schema";
import { createInstituteAdminSchema } from "@/lib/validation/institute-admin.schema";

export type CreateInstituteState = {
  error?: string;
  success?: {
    instituteId: string;
    instituteName: string;
    adminEmail: string;
    tempPassword: string;
  };
};

export async function createInstitute(
  _prevState: CreateInstituteState,
  formData: FormData
): Promise<CreateInstituteState> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  const parsed = createInstituteSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    contactEmail: formData.get("contactEmail"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    adminName: formData.get("adminName"),
    adminEmail: formData.get("adminEmail"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { name, code, contactEmail, phone, address, adminName, adminEmail } = parsed.data;
  const normalizedCode = code.toUpperCase();
  const normalizedAdminEmail = adminEmail.toLowerCase();

  await connectToDatabase();

  const existingCode = await InstituteModel.findOne({ code: normalizedCode });
  if (existingCode) {
    return { error: `Institute code "${normalizedCode}" is already in use.` };
  }

  const existingAdmin = await UserModel.findOne({ email: normalizedAdminEmail });
  if (existingAdmin) {
    return { error: `A user with email "${normalizedAdminEmail}" already exists.` };
  }

  const institute = await InstituteModel.create({
    name,
    code: normalizedCode,
    contactEmail: contactEmail || undefined,
    phone: phone || undefined,
    address: address || undefined,
    status: "trial",
    createdBy: session.userId,
  });

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const admin = await UserModel.create({
    name: adminName,
    email: normalizedAdminEmail,
    passwordHash,
    role: "institute-admin",
    instituteId: institute._id,
    status: "active",
    mustChangePassword: true,
    createdBy: session.userId,
  });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "institute.create",
    targetType: "Institute",
    targetId: institute._id.toString(),
    targetName: institute.name,
    summary: `Created institute "${institute.name}" (${institute.code}) with initial admin ${admin.email}`,
    after: { name: institute.name, code: institute.code, adminEmail: admin.email },
  });

  return {
    success: {
      instituteId: institute._id.toString(),
      instituteName: institute.name,
      adminEmail: admin.email,
      tempPassword,
    },
  };
}

export type CreateInstituteAdminState = {
  error?: string;
  success?: {
    adminEmail: string;
    tempPassword: string;
  };
};

export async function createInstituteAdmin(
  _prevState: CreateInstituteAdminState,
  formData: FormData
): Promise<CreateInstituteAdminState> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  const parsed = createInstituteAdminSchema.safeParse({
    instituteId: formData.get("instituteId"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { instituteId, name, email, phone } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  await connectToDatabase();

  const institute = await InstituteModel.findById(instituteId);
  if (!institute) {
    return { error: "Institute not found." };
  }

  const existing = await UserModel.findOne({ email: normalizedEmail });
  if (existing) {
    return { error: `A user with email "${normalizedEmail}" already exists.` };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const admin = await UserModel.create({
    name,
    email: normalizedEmail,
    passwordHash,
    role: "institute-admin",
    instituteId: institute._id,
    phone: phone || undefined,
    status: "active",
    mustChangePassword: true,
    createdBy: session.userId,
  });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    instituteId: institute._id.toString(),
    actorName: actor?.name ?? "Unknown",
    action: "institute-admin.create",
    targetType: "User",
    targetId: admin._id.toString(),
    targetName: admin.name,
    summary: `Added institute-admin ${admin.email} to "${institute.name}"`,
    after: { name: admin.name, email: admin.email },
  });

  revalidatePath(`/institutes/${instituteId}/admins`);

  return { success: { adminEmail: admin.email, tempPassword } };
}

export type ResetInstituteAdminPasswordState = {
  error?: string;
  success?: {
    adminEmail: string;
    tempPassword: string;
  };
};

export async function resetInstituteAdminPassword(
  _prevState: ResetInstituteAdminPasswordState,
  formData: FormData
): Promise<ResetInstituteAdminPasswordState> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  const userId = String(formData.get("userId") ?? "");
  if (!userId) {
    return { error: "Missing admin." };
  }

  await connectToDatabase();

  const admin = await UserModel.findOne({ _id: userId, role: "institute-admin" });
  if (!admin) {
    return { error: "Admin not found." };
  }

  const tempPassword = generateTempPassword();
  admin.passwordHash = await hashPassword(tempPassword);
  admin.mustChangePassword = true;
  await admin.save();

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    instituteId: admin.instituteId?.toString() ?? null,
    actorName: actor?.name ?? "Unknown",
    action: "institute-admin.reset-password",
    targetType: "User",
    targetId: admin._id.toString(),
    targetName: admin.name,
    summary: `Reset password for institute-admin ${admin.email}`,
  });

  revalidatePath(`/institutes/${admin.instituteId}/admins`);

  return { success: { adminEmail: admin.email, tempPassword } };
}

export type RemoveInstituteAdminState = {
  error?: string;
  success?: boolean;
};

export async function removeInstituteAdmin(
  _prevState: RemoveInstituteAdminState,
  formData: FormData
): Promise<RemoveInstituteAdminState> {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  const userId = String(formData.get("userId") ?? "");
  if (!userId) {
    return { error: "Missing admin." };
  }

  await connectToDatabase();

  const admin = await UserModel.findOne({ _id: userId, role: "institute-admin" });
  if (!admin) {
    return { error: "Admin not found." };
  }

  const activeAdminCount = await UserModel.countDocuments({
    instituteId: admin.instituteId,
    role: "institute-admin",
    status: "active",
  });

  if (activeAdminCount <= 1) {
    return { error: "Cannot remove the last remaining admin for this institute." };
  }

  const institute = await InstituteModel.findById(admin.instituteId).select("name");
  const actor = await UserModel.findById(session.userId).select("name");

  await UserModel.deleteOne({ _id: admin._id });

  await recordAuditEntry({
    session,
    instituteId: admin.instituteId?.toString() ?? null,
    actorName: actor?.name ?? "Unknown",
    action: "institute-admin.remove",
    targetType: "User",
    targetId: admin._id.toString(),
    targetName: admin.name,
    summary: `Removed institute-admin ${admin.email} from "${institute?.name ?? "institute"}"`,
  });

  revalidatePath(`/institutes/${admin.instituteId}/admins`);

  return { success: true };
}
