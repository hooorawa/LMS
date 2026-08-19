"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import ModuleModel from "@/models/Module";
import LessonModel from "@/models/Lesson";
import UserModel from "@/models/User";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import { createModuleSchema, updateModuleSchema } from "@/lib/validation/module.schema";
import { assertOwnsCourse, assertOwnsModule } from "@/lib/actions/course-ownership";
import { deleteObject } from "@/lib/storage/s3";

export type CreateModuleState = {
  error?: string;
  success?: { moduleId: string; title: string };
};

export async function createModule(
  _prevState: CreateModuleState,
  formData: FormData
): Promise<CreateModuleState> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const courseId = formData.get("courseId");
  if (typeof courseId !== "string" || !courseId) {
    return { error: "Missing course id." };
  }

  const parsed = createModuleSchema.safeParse({ title: formData.get("title") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const course = await assertOwnsCourse(courseId, session);
  if (!course) {
    return { error: "Course not found." };
  }

  const order = await ModuleModel.countDocuments({ courseId: course._id });

  const courseModule = await ModuleModel.create({
    instituteId: session.instituteId,
    courseId: course._id,
    title: parsed.data.title,
    order,
    createdBy: session.userId,
  });

  course.moduleOrder.push(courseModule._id);
  await course.save();

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "module.create",
    targetType: "Module",
    targetId: courseModule._id.toString(),
    targetName: courseModule.title,
    summary: `Added module "${courseModule.title}" to course "${course.title}"`,
    after: { title: courseModule.title },
  });

  revalidatePath(`/courses/${course._id.toString()}`);

  return { success: { moduleId: courseModule._id.toString(), title: courseModule.title } };
}

export async function renameModule(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const parsed = updateModuleSchema.safeParse({ title: formData.get("title") });
  if (!parsed.success) return;

  await connectToDatabase();

  const owned = await assertOwnsModule(id, session);
  if (!owned) return;
  const { module: courseModule, course } = owned;

  const before = courseModule.title;
  courseModule.title = parsed.data.title;
  await courseModule.save();

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "module.update",
    targetType: "Module",
    targetId: courseModule._id.toString(),
    targetName: courseModule.title,
    summary: `Renamed module "${before}" to "${courseModule.title}"`,
    before: { title: before },
    after: { title: courseModule.title },
  });

  revalidatePath(`/courses/${course._id.toString()}`);
}

export async function deleteModule(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await connectToDatabase();

  const owned = await assertOwnsModule(id, session);
  if (!owned) return;
  const { module: courseModule, course } = owned;

  const lessons = await LessonModel.find({ moduleId: courseModule._id }).lean();
  for (const lesson of lessons) {
    if ((lesson.type === "video" || lesson.type === "pdf") && lesson.contentUrl) {
      await deleteObject(lesson.contentUrl).catch(() => undefined);
    }
  }
  await LessonModel.deleteMany({ moduleId: courseModule._id });

  await ModuleModel.deleteOne({ _id: courseModule._id });

  course.moduleOrder = course.moduleOrder.filter(
    (moduleId: { toString(): string }) => moduleId.toString() !== courseModule._id.toString()
  );
  await course.save();

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "module.delete",
    targetType: "Module",
    targetId: courseModule._id.toString(),
    targetName: courseModule.title,
    summary: `Deleted module "${courseModule.title}" from course "${course.title}"`,
    before: { title: courseModule.title },
  });

  revalidatePath(`/courses/${course._id.toString()}`);
}

export async function moveModule(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const id = formData.get("id");
  const direction = formData.get("direction");
  if (typeof id !== "string" || !id || (direction !== "up" && direction !== "down")) return;

  await connectToDatabase();

  const owned = await assertOwnsModule(id, session);
  if (!owned) return;
  const { module: courseModule, course } = owned;

  const neighbor = await ModuleModel.findOne({
    courseId: course._id,
    order: direction === "up" ? { $lt: courseModule.order } : { $gt: courseModule.order },
  }).sort({ order: direction === "up" ? -1 : 1 });

  if (!neighbor) return;

  const currentOrder = courseModule.order;
  courseModule.order = neighbor.order;
  neighbor.order = currentOrder;
  await Promise.all([courseModule.save(), neighbor.save()]);

  revalidatePath(`/courses/${course._id.toString()}`);
}
