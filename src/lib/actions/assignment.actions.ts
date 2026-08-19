"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import AssignmentModel, { ASSIGNMENT_STATUSES, type AssignmentStatus } from "@/models/Assignment";
import SubmissionModel from "@/models/Submission";
import UserModel from "@/models/User";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { recordAuditEntry } from "@/lib/audit/log";
import { createAssignmentSchema, updateAssignmentSchema } from "@/lib/validation/assignment.schema";
import { assertOwnsCourse } from "@/lib/actions/course-ownership";
import { assertOwnsAssignment } from "@/lib/actions/assignment-ownership";

export type CreateAssignmentState = {
  error?: string;
  success?: { assignmentId: string; title: string };
};

export async function createAssignment(
  _prevState: CreateAssignmentState,
  formData: FormData
): Promise<CreateAssignmentState> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const courseId = formData.get("courseId");
  if (typeof courseId !== "string" || !courseId) {
    return { error: "Missing course id." };
  }

  const parsed = createAssignmentSchema.safeParse({
    title: formData.get("title"),
    instructions: formData.get("instructions"),
    dueAt: formData.get("dueAt"),
    maxScore: formData.get("maxScore"),
    attachmentKey: formData.get("attachmentKey"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const course = await assertOwnsCourse(courseId, session);
  if (!course) {
    return { error: "Course not found." };
  }

  const { title, instructions, dueAt, maxScore, attachmentKey } = parsed.data;

  const assignment = await AssignmentModel.create({
    instituteId: session.instituteId,
    courseId: course._id,
    teacherId: session.userId,
    title,
    instructions: instructions || undefined,
    dueAt,
    maxScore,
    attachmentKey: attachmentKey || undefined,
    createdBy: session.userId,
  });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "assignment.create",
    targetType: "Assignment",
    targetId: assignment._id.toString(),
    targetName: assignment.title,
    summary: `Created assignment "${assignment.title}" in course "${course.title}"`,
    after: { title: assignment.title, dueAt: assignment.dueAt, maxScore: assignment.maxScore },
  });

  revalidatePath(`/courses/${course._id.toString()}/assignments`);

  return { success: { assignmentId: assignment._id.toString(), title: assignment.title } };
}

export type UpdateAssignmentState = {
  error?: string;
  success?: { assignmentId: string; title: string };
};

export async function updateAssignment(
  _prevState: UpdateAssignmentState,
  formData: FormData
): Promise<UpdateAssignmentState> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Missing assignment id." };
  }

  const parsed = updateAssignmentSchema.safeParse({
    title: formData.get("title"),
    instructions: formData.get("instructions"),
    dueAt: formData.get("dueAt"),
    maxScore: formData.get("maxScore"),
    attachmentKey: formData.get("attachmentKey"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const owned = await assertOwnsAssignment(id, session);
  if (!owned) {
    return { error: "Assignment not found." };
  }
  const { assignment, course } = owned;

  const { title, instructions, dueAt, maxScore, attachmentKey, status } = parsed.data;

  const before = {
    title: assignment.title,
    instructions: assignment.instructions,
    dueAt: assignment.dueAt,
    maxScore: assignment.maxScore,
    status: assignment.status,
  };

  assignment.title = title;
  assignment.instructions = instructions || undefined;
  assignment.dueAt = dueAt;
  assignment.maxScore = maxScore;
  assignment.attachmentKey = attachmentKey || undefined;
  assignment.status = status;
  await assignment.save();

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "assignment.update",
    targetType: "Assignment",
    targetId: assignment._id.toString(),
    targetName: assignment.title,
    summary: `Updated assignment "${assignment.title}"`,
    before,
    after: { title: assignment.title, dueAt: assignment.dueAt, status: assignment.status },
  });

  revalidatePath(`/courses/${course._id.toString()}/assignments`);
  revalidatePath(`/courses/${course._id.toString()}/assignments/${assignment._id.toString()}`);

  return { success: { assignmentId: assignment._id.toString(), title: assignment.title } };
}

export async function setAssignmentStatus(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const id = formData.get("id");
  const status = formData.get("status");
  if (typeof id !== "string" || !id || typeof status !== "string") return;
  if (!ASSIGNMENT_STATUSES.includes(status as AssignmentStatus)) return;

  await connectToDatabase();

  const owned = await assertOwnsAssignment(id, session);
  if (!owned) return;
  const { assignment, course } = owned;

  const before = assignment.status;
  assignment.status = status as AssignmentStatus;
  await assignment.save();

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "assignment.status_change",
    targetType: "Assignment",
    targetId: assignment._id.toString(),
    targetName: assignment.title,
    summary: `Changed assignment "${assignment.title}" status from ${before} to ${assignment.status}`,
    before: { status: before },
    after: { status: assignment.status },
  });

  revalidatePath(`/courses/${course._id.toString()}/assignments`);
  revalidatePath(`/courses/${course._id.toString()}/assignments/${assignment._id.toString()}`);
}

export async function deleteAssignment(formData: FormData): Promise<void> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await connectToDatabase();

  const owned = await assertOwnsAssignment(id, session);
  if (!owned) return;
  const { assignment, course } = owned;

  await SubmissionModel.deleteMany({ assignmentId: assignment._id });
  await AssignmentModel.deleteOne({ _id: assignment._id });

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "assignment.delete",
    targetType: "Assignment",
    targetId: assignment._id.toString(),
    targetName: assignment.title,
    summary: `Deleted assignment "${assignment.title}"`,
    before: { title: assignment.title },
  });

  revalidatePath(`/courses/${course._id.toString()}/assignments`);
}
