"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import CourseModel, { COURSE_STATUSES, type CourseStatus } from "@/models/Course";
import ModuleModel from "@/models/Module";
import LessonModel from "@/models/Lesson";
import SubjectModel from "@/models/Subject";
import ClassModel from "@/models/Class";
import UserModel from "@/models/User";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import { createCourseSchema, updateCourseSchema } from "@/lib/validation/course.schema";
import { deleteObject } from "@/lib/storage/s3";
import { assertOwnsCourse } from "@/lib/actions/course-ownership";

export type CreateCourseState = {
  error?: string;
  success?: { courseId: string; title: string };
};

export async function createCourse(
  _prevState: CreateCourseState,
  formData: FormData
): Promise<CreateCourseState> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const parsed = createCourseSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    subjectId: formData.get("subjectId"),
    classIds: formData.getAll("classIds"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { title, description, subjectId, classIds } = parsed.data;

  await connectToDatabase();

  if (subjectId) {
    const subject = await SubjectModel.findOne({
      _id: subjectId,
      instituteId: session.instituteId,
    });
    if (!subject) {
      return { error: "Selected subject was not found in your institute." };
    }
  }

  if (classIds.length > 0) {
    const matchingClasses = await ClassModel.countDocuments({
      _id: { $in: classIds },
      instituteId: session.instituteId,
    });
    if (matchingClasses !== classIds.length) {
      return { error: "One or more selected classes were not found in your institute." };
    }
  }

  const course = await CourseModel.create({
    instituteId: session.instituteId,
    title,
    description: description || undefined,
    subjectId: subjectId || undefined,
    teacherId: session.userId,
    classIds,
    createdBy: session.userId,
  });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "course.create",
    targetType: "Course",
    targetId: course._id.toString(),
    targetName: course.title,
    summary: `Created course "${course.title}"`,
    after: { title: course.title, status: course.status },
  });

  revalidatePath("/courses");

  return { success: { courseId: course._id.toString(), title: course.title } };
}

export type UpdateCourseState = {
  error?: string;
  success?: { courseId: string; title: string };
};

export async function updateCourse(
  _prevState: UpdateCourseState,
  formData: FormData
): Promise<UpdateCourseState> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Missing course id." };
  }

  const parsed = updateCourseSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    subjectId: formData.get("subjectId"),
    classIds: formData.getAll("classIds"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { title, description, subjectId, classIds, status } = parsed.data;

  await connectToDatabase();

  const course = await assertOwnsCourse(id, session);
  if (!course) {
    return { error: "Course not found." };
  }

  if (subjectId) {
    const subject = await SubjectModel.findOne({
      _id: subjectId,
      instituteId: session.instituteId,
    });
    if (!subject) {
      return { error: "Selected subject was not found in your institute." };
    }
  }

  if (classIds.length > 0) {
    const matchingClasses = await ClassModel.countDocuments({
      _id: { $in: classIds },
      instituteId: session.instituteId,
    });
    if (matchingClasses !== classIds.length) {
      return { error: "One or more selected classes were not found in your institute." };
    }
  }

  const before = {
    title: course.title,
    description: course.description,
    subjectId: course.subjectId?.toString(),
    classIds: course.classIds.map((classId: { toString(): string }) => classId.toString()),
    status: course.status,
  };

  course.title = title;
  course.description = description || undefined;
  course.subjectId = subjectId || undefined;
  course.classIds = classIds;
  course.status = status;
  await course.save();

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "course.update",
    targetType: "Course",
    targetId: course._id.toString(),
    targetName: course.title,
    summary: `Updated course "${course.title}"`,
    before,
    after: { title: course.title, status: course.status },
  });

  revalidatePath("/courses");
  revalidatePath(`/courses/${course._id.toString()}`);

  return { success: { courseId: course._id.toString(), title: course.title } };
}

export async function setCourseStatus(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const id = formData.get("id");
  const status = formData.get("status");
  if (typeof id !== "string" || !id || typeof status !== "string") return;
  if (!COURSE_STATUSES.includes(status as CourseStatus)) return;

  await connectToDatabase();

  const course = await assertOwnsCourse(id, session);
  if (!course) return;

  const before = course.status;
  course.status = status as CourseStatus;
  await course.save();

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "course.status_change",
    targetType: "Course",
    targetId: course._id.toString(),
    targetName: course.title,
    summary: `Changed course "${course.title}" status from ${before} to ${course.status}`,
    before: { status: before },
    after: { status: course.status },
  });

  revalidatePath("/courses");
  revalidatePath(`/courses/${course._id.toString()}`);
}

export async function deleteCourse(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await connectToDatabase();

  const course = await assertOwnsCourse(id, session);
  if (!course) return;

  const lessons = await LessonModel.find({ courseId: course._id }).lean();
  for (const lesson of lessons) {
    if ((lesson.type === "video" || lesson.type === "pdf") && lesson.contentUrl) {
      await deleteObject(lesson.contentUrl).catch(() => undefined);
    }
  }

  await LessonModel.deleteMany({ courseId: course._id });
  await ModuleModel.deleteMany({ courseId: course._id });
  await CourseModel.deleteOne({ _id: course._id });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "course.delete",
    targetType: "Course",
    targetId: course._id.toString(),
    targetName: course.title,
    summary: `Deleted course "${course.title}"`,
    before: { title: course.title },
  });

  revalidatePath("/courses");
}
