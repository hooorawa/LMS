"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import ClassModel from "@/models/Class";
import UserModel from "@/models/User";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";
import { generateTempPassword, hashPassword } from "@/lib/auth/password";
import { recordAuditEntry } from "@/lib/audit/log";
import {
  createStaffSchema,
  createStudentSchema,
  updateStaffPermissionsSchema,
  updateStaffSalarySchema,
  addMonthlyCommissionSchema,
  updateStudentRecordSchema,
} from "@/lib/validation/user.schema";

export type CreateUserState = {
  error?: string;
  success?: {
    userId: string;
    name: string;
    email: string;
    tempPassword: string;
  };
};

export async function createStaff(
  _prevState: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const parsed = createStaffSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    employeeCode: formData.get("employeeCode"),
    basicSalary: formData.get("basicSalary") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { name, email, phone, employeeCode, basicSalary } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  await connectToDatabase();

  const existing = await UserModel.findOne({ email: normalizedEmail });
  if (existing) {
    return { error: `A user with email "${normalizedEmail}" already exists.` };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const staff = await UserModel.create({
    name,
    email: normalizedEmail,
    passwordHash,
    role: "institute-staff",
    instituteId: session.instituteId,
    status: "active",
    mustChangePassword: true,
    phone: phone || undefined,
    staffMeta: { employeeCode: employeeCode || undefined, basicSalary: basicSalary ?? 0 },
    createdBy: session.userId,
  });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "staff.create",
    targetType: "User",
    targetId: staff._id.toString(),
    targetName: staff.name,
    summary: `Created staff member "${staff.name}" (${staff.email})`,
    after: { name: staff.name, email: staff.email },
  });

  return {
    success: {
      userId: staff._id.toString(),
      name: staff.name,
      email: staff.email,
      tempPassword,
    },
  };
}

export type UpdateStaffState = { error?: string; success?: boolean };

export async function updateStaffPermissions(
  _prevState: UpdateStaffState,
  formData: FormData
): Promise<UpdateStaffState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const staffId = String(formData.get("staffId") ?? "");
  const parsed = updateStaffPermissionsSchema.safeParse({
    dashboard: true,
    staff: formData.get("staff") === "on",
    students: formData.get("students") === "on",
    subjects: formData.get("subjects") === "on",
    classes: formData.get("classes") === "on",
    expenses: formData.get("expenses") === "on",
    salary: formData.get("salary") === "on",
    income: formData.get("income") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const staff = await UserModel.findOne(withTenantScope({ _id: staffId, role: "institute-staff" }, session));
  if (!staff) {
    return { error: "Staff member not found." };
  }

  const before = staff.staffMeta?.permissions?.toObject?.() ?? staff.staffMeta?.permissions;
  staff.staffMeta = { ...staff.staffMeta, permissions: parsed.data };
  await staff.save();

  const actor = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "staff.permissions-update",
    targetType: "User",
    targetId: staff._id.toString(),
    targetName: staff.name,
    summary: `Updated permissions for "${staff.name}"`,
    before,
    after: parsed.data,
  });

  return { success: true };
}

export async function updateStaffSalary(
  _prevState: UpdateStaffState,
  formData: FormData
): Promise<UpdateStaffState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const staffId = String(formData.get("staffId") ?? "");
  const parsed = updateStaffSalarySchema.safeParse({
    basicSalary: formData.get("basicSalary"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const staff = await UserModel.findOne(withTenantScope({ _id: staffId, role: "institute-staff" }, session));
  if (!staff) {
    return { error: "Staff member not found." };
  }

  staff.staffMeta = { ...staff.staffMeta, basicSalary: parsed.data.basicSalary };
  await staff.save();

  const actor = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "staff.salary-update",
    targetType: "User",
    targetId: staff._id.toString(),
    targetName: staff.name,
    summary: `Updated basic salary for "${staff.name}" to ${parsed.data.basicSalary}`,
    after: { basicSalary: parsed.data.basicSalary },
  });

  return { success: true };
}

export async function addMonthlyCommission(
  _prevState: UpdateStaffState,
  formData: FormData
): Promise<UpdateStaffState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const staffId = String(formData.get("staffId") ?? "");
  const parsed = addMonthlyCommissionSchema.safeParse({
    month: formData.get("month"),
    amount: formData.get("amount"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const staff = await UserModel.findOne(withTenantScope({ _id: staffId, role: "institute-staff" }, session));
  if (!staff) {
    return { error: "Staff member not found." };
  }

  staff.staffMeta = staff.staffMeta ?? {};
  staff.staffMeta.monthlyCommissions = [
    ...(staff.staffMeta.monthlyCommissions ?? []),
    { month: parsed.data.month, amount: parsed.data.amount, recordedAt: new Date() },
  ];
  await staff.save();

  const actor = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "staff.commission-add",
    targetType: "User",
    targetId: staff._id.toString(),
    targetName: staff.name,
    summary: `Added ${parsed.data.month} commission of ${parsed.data.amount} for "${staff.name}"`,
    after: parsed.data,
  });

  return { success: true };
}

export async function createStudent(
  _prevState: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const parsed = createStudentSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    rollNumber: formData.get("rollNumber"),
    classId: formData.get("classId"),
    birthday: formData.get("birthday"),
    gender: formData.get("gender"),
    guardianName: formData.get("guardianName"),
    guardianPhone: formData.get("guardianPhone"),
    guardianEmail: formData.get("guardianEmail"),
    guardianRelation: formData.get("guardianRelation"),
    hasSpecialNeeds: formData.get("hasSpecialNeeds") === "on",
    specialNeedsDetails: formData.get("specialNeedsDetails"),
    registrationDate: formData.get("registrationDate"),
    paymentType: formData.get("paymentType"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const {
    name,
    email,
    phone,
    rollNumber,
    classId,
    birthday,
    gender,
    guardianName,
    guardianPhone,
    guardianEmail,
    guardianRelation,
    hasSpecialNeeds,
    specialNeedsDetails,
    registrationDate,
    paymentType,
    notes,
  } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  await connectToDatabase();

  const existing = await UserModel.findOne({ email: normalizedEmail });
  if (existing) {
    return { error: `A user with email "${normalizedEmail}" already exists.` };
  }

  if (classId) {
    const klass = await ClassModel.findOne(withTenantScope({ _id: classId }, session)).select("_id");
    if (!klass) {
      return { error: "Selected class was not found in your institute." };
    }
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const student = await UserModel.create({
    name,
    email: normalizedEmail,
    passwordHash,
    role: "student",
    instituteId: session.instituteId,
    status: "active",
    mustChangePassword: true,
    phone: phone || undefined,
    studentMeta: {
      rollNumber: rollNumber || undefined,
      classId: classId || undefined,
      birthday: birthday ? new Date(birthday) : undefined,
      gender: gender || undefined,
      guardianName: guardianName || undefined,
      guardianPhone: guardianPhone || undefined,
      guardianEmail: guardianEmail || undefined,
      guardianRelation: guardianRelation || undefined,
      hasSpecialNeeds: Boolean(hasSpecialNeeds),
      specialNeedsDetails: specialNeedsDetails || undefined,
      registrationDate: registrationDate ? new Date(registrationDate) : undefined,
      paymentType: paymentType || undefined,
      notes: notes || undefined,
    },
    createdBy: session.userId,
  });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "student.create",
    targetType: "User",
    targetId: student._id.toString(),
    targetName: student.name,
    summary: `Created student "${student.name}" (${student.email})`,
    after: { name: student.name, email: student.email },
  });

  return {
    success: {
      userId: student._id.toString(),
      name: student.name,
      email: student.email,
      tempPassword,
    },
  };
}

export async function updateStudentRecord(
  _prevState: UpdateStaffState,
  formData: FormData
): Promise<UpdateStaffState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const studentId = String(formData.get("studentId") ?? "");
  const parsed = updateStudentRecordSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    rollNumber: formData.get("rollNumber"),
    classId: formData.get("classId"),
    birthday: formData.get("birthday"),
    gender: formData.get("gender"),
    guardianName: formData.get("guardianName"),
    guardianPhone: formData.get("guardianPhone"),
    guardianEmail: formData.get("guardianEmail"),
    guardianRelation: formData.get("guardianRelation"),
    hasSpecialNeeds: formData.get("hasSpecialNeeds") === "on",
    specialNeedsDetails: formData.get("specialNeedsDetails"),
    registrationDate: formData.get("registrationDate"),
    paymentType: formData.get("paymentType"),
    notes: formData.get("notes"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const {
    name,
    email,
    phone,
    rollNumber,
    classId,
    birthday,
    gender,
    guardianName,
    guardianPhone,
    guardianEmail,
    guardianRelation,
    hasSpecialNeeds,
    specialNeedsDetails,
    registrationDate,
    paymentType,
    notes,
    status,
  } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  await connectToDatabase();

  const student = await UserModel.findOne(withTenantScope({ _id: studentId, role: "student" }, session));
  if (!student) {
    return { error: "Student not found." };
  }

  const existing = await UserModel.findOne({ email: normalizedEmail, _id: { $ne: student._id } }).select("_id");
  if (existing) {
    return { error: `A user with email "${normalizedEmail}" already exists.` };
  }

  if (classId) {
    const klass = await ClassModel.findOne(withTenantScope({ _id: classId }, session)).select("_id");
    if (!klass) {
      return { error: "Selected class was not found in your institute." };
    }
  }

  const before = {
    name: student.name,
    email: student.email,
    phone: student.phone,
    status: student.status,
    studentMeta: student.studentMeta?.toObject?.() ?? student.studentMeta,
  };

  student.name = name;
  student.email = normalizedEmail;
  student.phone = phone || undefined;
  student.status = status;
  student.studentMeta = {
    ...student.studentMeta,
    rollNumber: rollNumber || undefined,
    classId: classId || undefined,
    birthday: birthday ? new Date(birthday) : undefined,
    gender: gender || undefined,
    guardianName: guardianName || undefined,
    guardianPhone: guardianPhone || undefined,
    guardianEmail: guardianEmail || undefined,
    guardianRelation: guardianRelation || undefined,
    hasSpecialNeeds: Boolean(hasSpecialNeeds),
    specialNeedsDetails: specialNeedsDetails || undefined,
    registrationDate: registrationDate ? new Date(registrationDate) : undefined,
    paymentType: paymentType || undefined,
    notes: notes || undefined,
  };
  await student.save();

  const actor = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "student.update",
    targetType: "User",
    targetId: student._id.toString(),
    targetName: student.name,
    summary: `Updated student record for "${student.name}"`,
    before,
    after: {
      name: student.name,
      email: student.email,
      phone: student.phone,
      status: student.status,
      studentMeta: student.studentMeta,
    },
  });

  revalidatePath("/students");
  revalidatePath(`/students/${student._id.toString()}`);
  revalidatePath("/payment-desk");

  return { success: true };
}

export async function bulkUpdateStudentStatus(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const ids = formData
    .getAll("ids")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const status = String(formData.get("status") ?? "").trim();

  if (ids.length === 0 || !["active", "suspended"].includes(status)) return;

  await connectToDatabase();

  const result = await UserModel.updateMany(
    withTenantScope({ _id: { $in: ids }, role: "student" }, session),
    { $set: { status } }
  );

  const actor = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "student.bulk-status-update",
    targetType: "User",
    summary: `Updated ${result.modifiedCount} student account${result.modifiedCount === 1 ? "" : "s"} to ${status}`,
    after: { status, ids },
  });

  revalidatePath("/students");
  revalidatePath("/payment-desk");
}
