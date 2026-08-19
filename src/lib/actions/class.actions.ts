"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import ClassModel from "@/models/Class";
import UserModel from "@/models/User";
import { requireSession, requireRole, withTenantScope } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import { createClassSchema, updateClassSchema } from "@/lib/validation/class.schema";

export type CreateClassState = {
  error?: string;
  success?: {
    classId: string;
    name: string;
  };
};

export async function createClass(
  _prevState: CreateClassState,
  formData: FormData
): Promise<CreateClassState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const parsed = createClassSchema.safeParse({
    name: formData.get("name"),
    section: formData.get("section"),
    academicYear: formData.get("academicYear"),
    classTeacherId: formData.get("classTeacherId"),
    timetableDay: formData.get("timetableDay"),
    timetableStart: formData.get("timetableStart"),
    timetableEnd: formData.get("timetableEnd"),
    timetableRoom: formData.get("timetableRoom"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { name, section, academicYear, classTeacherId, timetableDay, timetableStart, timetableEnd, timetableRoom } = parsed.data;

  await connectToDatabase();

  if (classTeacherId) {
    const teacher = await UserModel.findOne({
      _id: classTeacherId,
      instituteId: session.instituteId,
      role: "institute-staff",
    });
    if (!teacher) {
      return { error: "Selected class teacher was not found in your institute." };
    }
  }

  const klass = await ClassModel.create({
    instituteId: session.instituteId,
    name,
    section: section || undefined,
    academicYear,
    classTeacherId: classTeacherId || undefined,
    timetable: timetableDay && timetableStart && timetableEnd ? [{ day: timetableDay, startTime: timetableStart, endTime: timetableEnd, room: timetableRoom || undefined }] : [],
    createdBy: session.userId,
  });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "class.create",
    targetType: "Class",
    targetId: klass._id.toString(),
    targetName: klass.name,
    summary: `Created class "${klass.name}" (${academicYear})`,
    after: { name: klass.name, section: klass.section, academicYear: klass.academicYear },
  });

  return { success: { classId: klass._id.toString(), name: klass.name } };
}

export type UpdateClassState = {
  error?: string;
  success?: {
    classId: string;
    name: string;
  };
};

export async function updateClass(
  _prevState: UpdateClassState,
  formData: FormData
): Promise<UpdateClassState> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Missing class id." };
  }

  const parsed = updateClassSchema.safeParse({
    name: formData.get("name"),
    section: formData.get("section"),
    academicYear: formData.get("academicYear"),
    classTeacherId: formData.get("classTeacherId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { name, section, academicYear, classTeacherId, status } = parsed.data;

  await connectToDatabase();

  const klass = await ClassModel.findOne(withTenantScope({ _id: id }, session));
  if (!klass) {
    return { error: "Class not found." };
  }

  if (classTeacherId) {
    const teacher = await UserModel.findOne({
      _id: classTeacherId,
      instituteId: session.instituteId,
      role: "institute-staff",
    });
    if (!teacher) {
      return { error: "Selected class teacher was not found in your institute." };
    }
  }

  const before = {
    name: klass.name,
    section: klass.section,
    academicYear: klass.academicYear,
    classTeacherId: klass.classTeacherId?.toString(),
    status: klass.status,
  };

  klass.name = name;
  klass.section = section || undefined;
  klass.academicYear = academicYear;
  klass.classTeacherId = classTeacherId || undefined;
  klass.status = status;
  await klass.save();

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "class.update",
    targetType: "Class",
    targetId: klass._id.toString(),
    targetName: klass.name,
    summary: `Updated class "${klass.name}"`,
    before,
    after: {
      name: klass.name,
      section: klass.section,
      academicYear: klass.academicYear,
      classTeacherId: klass.classTeacherId?.toString(),
      status: klass.status,
    },
  });

  revalidatePath("/classes");

  return { success: { classId: klass._id.toString(), name: klass.name } };
}

export async function deleteClass(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await connectToDatabase();

  const klass = await ClassModel.findOne(withTenantScope({ _id: id }, session));
  if (!klass) return;

  await ClassModel.deleteOne({ _id: klass._id });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "class.delete",
    targetType: "Class",
    targetId: klass._id.toString(),
    targetName: klass.name,
    summary: `Deleted class "${klass.name}"`,
    before: { name: klass.name, section: klass.section, academicYear: klass.academicYear },
  });

  revalidatePath("/classes");
}

export async function bulkDeleteClasses(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-admin"]);

  const ids = formData
    .getAll("ids")
    .map((value) => String(value).trim())
    .filter((value) => mongoose.isValidObjectId(value));

  if (ids.length === 0) return;

  await connectToDatabase();

  const classes = await ClassModel.find(
    withTenantScope({ _id: { $in: ids } }, session)
  ).select("name section academicYear");
  if (classes.length === 0) return;

  await ClassModel.deleteMany({ _id: { $in: classes.map((klass) => klass._id) } });

  const actor = await UserModel.findById(session.userId).select("name");
  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "class.bulk-delete",
    targetType: "Class",
    summary: `Deleted ${classes.length} classes`,
    before: classes.map((klass) => ({
      id: String(klass._id),
      name: klass.name,
      section: klass.section,
      academicYear: klass.academicYear,
    })),
  });

  revalidatePath("/classes");
}
