"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import LessonModel, { type LessonType } from "@/models/Lesson";
import UserModel from "@/models/User";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import { createLessonSchema } from "@/lib/validation/lesson.schema";
import { assertOwnsModule } from "@/lib/actions/course-ownership";
import { deleteObject } from "@/lib/storage/s3";

function lessonFieldsFromForm(formData: FormData) {
  const type = formData.get("type") as LessonType;
  const base = {
    type,
    title: formData.get("title"),
    isPreview: formData.get("isPreview") === "on",
  };

  switch (type) {
    case "video":
      return {
        ...base,
        contentUrl: formData.get("contentUrl"),
        durationSeconds: formData.get("durationSeconds") || undefined,
      };
    case "pdf":
      return { ...base, contentUrl: formData.get("contentUrl") };
    case "text":
      return { ...base, textBody: formData.get("textBody") };
    case "link":
      return { ...base, contentUrl: formData.get("contentUrl") };
    default:
      return base;
  }
}

export type CreateLessonState = {
  error?: string;
  success?: { lessonId: string; title: string };
};

export async function createLesson(
  _prevState: CreateLessonState,
  formData: FormData
): Promise<CreateLessonState> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const moduleId = formData.get("moduleId");
  if (typeof moduleId !== "string" || !moduleId) {
    return { error: "Missing module id." };
  }

  const parsed = createLessonSchema.safeParse(lessonFieldsFromForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const owned = await assertOwnsModule(moduleId, session);
  if (!owned) {
    return { error: "Module not found." };
  }
  const { module: courseModule, course } = owned;

  const order = await LessonModel.countDocuments({ moduleId: courseModule._id });

  const lesson = await LessonModel.create({
    instituteId: session.instituteId,
    courseId: course._id,
    moduleId: courseModule._id,
    order,
    createdBy: session.userId,
    ...parsed.data,
  });

  courseModule.lessonOrder.push(lesson._id);
  await courseModule.save();

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "lesson.create",
    targetType: "Lesson",
    targetId: lesson._id.toString(),
    targetName: lesson.title,
    summary: `Added lesson "${lesson.title}" to module "${courseModule.title}"`,
    after: { title: lesson.title, type: lesson.type },
  });

  revalidatePath(`/courses/${course._id.toString()}`);

  return { success: { lessonId: lesson._id.toString(), title: lesson.title } };
}

export type UpdateLessonState = {
  error?: string;
  success?: { lessonId: string; title: string };
};

export async function updateLesson(
  _prevState: UpdateLessonState,
  formData: FormData
): Promise<UpdateLessonState> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Missing lesson id." };
  }

  const parsed = createLessonSchema.safeParse(lessonFieldsFromForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const lesson = await LessonModel.findById(id);
  if (!lesson) {
    return { error: "Lesson not found." };
  }

  const owned = await assertOwnsModule(lesson.moduleId.toString(), session);
  if (!owned) {
    return { error: "Lesson not found." };
  }
  const { course } = owned;

  const before = {
    title: lesson.title,
    type: lesson.type,
    contentUrl: lesson.contentUrl,
    textBody: lesson.textBody,
  };

  const previousContentUrl = lesson.contentUrl;
  const previousType = lesson.type;

  lesson.set({
    contentUrl: undefined,
    textBody: undefined,
    durationSeconds: undefined,
    ...parsed.data,
  });
  await lesson.save();

  if (
    (previousType === "video" || previousType === "pdf") &&
    previousContentUrl &&
    previousContentUrl !== lesson.contentUrl
  ) {
    await deleteObject(previousContentUrl).catch(() => undefined);
  }

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "lesson.update",
    targetType: "Lesson",
    targetId: lesson._id.toString(),
    targetName: lesson.title,
    summary: `Updated lesson "${lesson.title}"`,
    before,
    after: { title: lesson.title, type: lesson.type },
  });

  revalidatePath(`/courses/${course._id.toString()}`);

  return { success: { lessonId: lesson._id.toString(), title: lesson.title } };
}

export async function deleteLesson(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await connectToDatabase();

  const lesson = await LessonModel.findById(id);
  if (!lesson) return;

  const owned = await assertOwnsModule(lesson.moduleId.toString(), session);
  if (!owned) return;
  const { module: courseModule, course } = owned;

  if ((lesson.type === "video" || lesson.type === "pdf") && lesson.contentUrl) {
    await deleteObject(lesson.contentUrl).catch(() => undefined);
  }

  await LessonModel.deleteOne({ _id: lesson._id });

  courseModule.lessonOrder = courseModule.lessonOrder.filter(
    (lessonId: { toString(): string }) => lessonId.toString() !== lesson._id.toString()
  );
  await courseModule.save();

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "lesson.delete",
    targetType: "Lesson",
    targetId: lesson._id.toString(),
    targetName: lesson.title,
    summary: `Deleted lesson "${lesson.title}" from module "${courseModule.title}"`,
    before: { title: lesson.title, type: lesson.type },
  });

  revalidatePath(`/courses/${course._id.toString()}`);
}

export async function moveLesson(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const id = formData.get("id");
  const direction = formData.get("direction");
  if (typeof id !== "string" || !id || (direction !== "up" && direction !== "down")) return;

  await connectToDatabase();

  const lesson = await LessonModel.findById(id);
  if (!lesson) return;

  const owned = await assertOwnsModule(lesson.moduleId.toString(), session);
  if (!owned) return;
  const { module: courseModule, course } = owned;

  const neighbor = await LessonModel.findOne({
    moduleId: courseModule._id,
    order: direction === "up" ? { $lt: lesson.order } : { $gt: lesson.order },
  }).sort({ order: direction === "up" ? -1 : 1 });

  if (!neighbor) return;

  const currentOrder = lesson.order;
  lesson.order = neighbor.order;
  neighbor.order = currentOrder;
  await Promise.all([lesson.save(), neighbor.save()]);

  revalidatePath(`/courses/${course._id.toString()}`);
}
