"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import SubjectModel from "@/models/Subject";
import UserModel from "@/models/User";
import ClassModel from "@/models/Class";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import { createSubjectSchema, updateSubjectSchema } from "@/lib/validation/subject.schema";

export type CreateSubjectState = {
  error?: string;
  success?: {
    subjectId: string;
    name: string;
  };
};

export async function createSubject(
  _prevState: CreateSubjectState,
  formData: FormData
): Promise<CreateSubjectState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const parsed = createSubjectSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    teacherId: formData.get("teacherId"),
    classIds: formData.getAll("classIds"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { name, code, teacherId, classIds } = parsed.data;
  const normalizedCode = code.toUpperCase();

  await connectToDatabase();

  const existingCode = await SubjectModel.findOne({
    instituteId: session.instituteId,
    code: normalizedCode,
  });
  if (existingCode) {
    return { error: `Subject code "${normalizedCode}" is already in use.` };
  }

  if (teacherId) {
    const teacher = await UserModel.findOne({
      _id: teacherId,
      instituteId: session.instituteId,
      role: "institute-staff",
    });
    if (!teacher) {
      return { error: "Selected teacher was not found in your institute." };
    }
  }

  if (classIds && classIds.length > 0) {
    const matchingClasses = await ClassModel.countDocuments({
      _id: { $in: classIds },
      instituteId: session.instituteId,
    });
    if (matchingClasses !== classIds.length) {
      return { error: "One or more selected classes were not found in your institute." };
    }
  }

  const subject = await SubjectModel.create({
    instituteId: session.instituteId,
    name,
    code: normalizedCode,
    teacherId: teacherId || undefined,
    classIds: classIds ?? [],
    createdBy: session.userId,
  });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "subject.create",
    targetType: "Subject",
    targetId: subject._id.toString(),
    targetName: subject.name,
    summary: `Created subject "${subject.name}" (${subject.code})`,
    after: { name: subject.name, code: subject.code },
  });

  return { success: { subjectId: subject._id.toString(), name: subject.name } };
}

export type UpdateSubjectState = {
  error?: string;
  success?: {
    subjectId: string;
    name: string;
  };
};

export async function updateSubject(
  _prevState: UpdateSubjectState,
  formData: FormData
): Promise<UpdateSubjectState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Missing subject id." };
  }

  const parsed = updateSubjectSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    teacherId: formData.get("teacherId"),
    classIds: formData.getAll("classIds"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { name, code, teacherId, classIds } = parsed.data;
  const normalizedCode = code.toUpperCase();

  await connectToDatabase();

  const subject = await SubjectModel.findOne(withTenantScope({ _id: id }, session));
  if (!subject) {
    return { error: "Subject not found." };
  }

  const existingCode = await SubjectModel.findOne({
    instituteId: session.instituteId,
    code: normalizedCode,
    _id: { $ne: subject._id },
  });
  if (existingCode) {
    return { error: `Subject code "${normalizedCode}" is already in use.` };
  }

  if (teacherId) {
    const teacher = await UserModel.findOne({
      _id: teacherId,
      instituteId: session.instituteId,
      role: "institute-staff",
    });
    if (!teacher) {
      return { error: "Selected teacher was not found in your institute." };
    }
  }

  if (classIds && classIds.length > 0) {
    const matchingClasses = await ClassModel.countDocuments({
      _id: { $in: classIds },
      instituteId: session.instituteId,
    });
    if (matchingClasses !== classIds.length) {
      return { error: "One or more selected classes were not found in your institute." };
    }
  }

  const before = {
    name: subject.name,
    code: subject.code,
    teacherId: subject.teacherId?.toString(),
    classIds: subject.classIds.map((classId: { toString(): string }) => classId.toString()),
  };

  subject.name = name;
  subject.code = normalizedCode;
  subject.teacherId = teacherId || undefined;
  subject.classIds = classIds ?? [];
  await subject.save();

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "subject.update",
    targetType: "Subject",
    targetId: subject._id.toString(),
    targetName: subject.name,
    summary: `Updated subject "${subject.name}" (${subject.code})`,
    before,
    after: {
      name: subject.name,
      code: subject.code,
      teacherId: subject.teacherId?.toString(),
      classIds: subject.classIds.map((classId: { toString(): string }) => classId.toString()),
    },
  });

  revalidatePath("/subjects");

  return { success: { subjectId: subject._id.toString(), name: subject.name } };
}

export async function deleteSubject(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await connectToDatabase();

  const subject = await SubjectModel.findOne(withTenantScope({ _id: id }, session));
  if (!subject) return;

  await SubjectModel.deleteOne({ _id: subject._id });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "subject.delete",
    targetType: "Subject",
    targetId: subject._id.toString(),
    targetName: subject.name,
    summary: `Deleted subject "${subject.name}" (${subject.code})`,
    before: { name: subject.name, code: subject.code },
  });

  revalidatePath("/subjects");
}

export async function bulkDeleteSubjects(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const ids = formData
    .getAll("ids")
    .map((value) => String(value).trim())
    .filter((value) => mongoose.isValidObjectId(value));

  if (ids.length === 0) return;

  await connectToDatabase();

  const subjects = await SubjectModel.find(
    withTenantScope({ _id: { $in: ids } }, session)
  ).select("name code");
  if (subjects.length === 0) return;

  await SubjectModel.deleteMany({ _id: { $in: subjects.map((subject) => subject._id) } });

  const actor = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "subject.bulk-delete",
    targetType: "Subject",
    summary: `Deleted ${subjects.length} subjects`,
    before: subjects.map((subject) => ({
      id: String(subject._id),
      name: subject.name,
      code: subject.code,
    })),
  });

  revalidatePath("/subjects");
}
