"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/connect";
import AssignmentModel from "@/models/Assignment";
import SubmissionModel from "@/models/Submission";
import UserModel from "@/models/User";
import { requireSession, requireRole, assertSameInstitute } from "@/lib/tenant/scope";
import { assertEnrolledInCourse } from "@/lib/actions/enrollment-ownership";
import { assertOwnsAssignment } from "@/lib/actions/assignment-ownership";
import { recordAuditEntry } from "@/lib/audit/log";
import { recomputeGradeForSource } from "@/lib/data/grade-rollup";
import { submitAssignmentSchema, gradeSubmissionSchema } from "@/lib/validation/submission.schema";

export type SubmitAssignmentState = {
  error?: string;
  success?: { submissionId: string };
};

export async function submitAssignment(
  _prevState: SubmitAssignmentState,
  formData: FormData
): Promise<SubmitAssignmentState> {
  const session = await requireSession();
  requireRole(session, ["student"]);

  const assignmentId = formData.get("assignmentId");
  if (typeof assignmentId !== "string" || !assignmentId) {
    return { error: "Missing assignment id." };
  }

  const parsed = submitAssignmentSchema.safeParse({
    textResponse: formData.get("textResponse"),
    attachmentKey: formData.get("attachmentKey"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const assignment = await AssignmentModel.findById(assignmentId).lean();
  if (!assignment) {
    return { error: "Assignment not found." };
  }
  assertSameInstitute(assignment, session);

  if (assignment.status !== "published") {
    return { error: "This assignment is not open for submissions." };
  }

  const enrollment = await assertEnrolledInCourse(assignment.courseId.toString(), session);
  if (!enrollment) {
    return { error: "You are not enrolled in this course." };
  }

  const existing = await SubmissionModel.findOne({
    assignmentId: assignment._id,
    studentId: session.userId,
  });

  if (existing?.status === "graded") {
    return { error: "This submission has already been graded and can no longer be changed." };
  }

  const { textResponse, attachmentKey } = parsed.data;

  const submission = await SubmissionModel.findOneAndUpdate(
    { assignmentId: assignment._id, studentId: session.userId },
    {
      instituteId: session.instituteId,
      assignmentId: assignment._id,
      courseId: assignment.courseId,
      studentId: session.userId,
      textResponse: textResponse || undefined,
      attachmentKey: attachmentKey || undefined,
      submittedAt: new Date(),
      status: "submitted",
    },
    { upsert: true, new: true }
  );

  const actor = await UserModel.findById(session.userId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: existing ? "submission.update" : "submission.create",
    targetType: "Submission",
    targetId: submission._id.toString(),
    targetName: assignment.title,
    summary: `${existing ? "Updated" : "Submitted"} work for assignment "${assignment.title}"`,
  });

  const courseId = assignment.courseId.toString();
  revalidatePath(`/my-courses/${courseId}/assignments/${assignmentId}`);
  revalidatePath(`/courses/${courseId}/assignments/${assignmentId}`);

  return { success: { submissionId: submission._id.toString() } };
}

export type GradeSubmissionState = {
  error?: string;
  success?: boolean;
};

export async function gradeSubmission(
  _prevState: GradeSubmissionState,
  formData: FormData
): Promise<GradeSubmissionState> {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  const submissionId = formData.get("submissionId");
  if (typeof submissionId !== "string" || !submissionId) {
    return { error: "Missing submission id." };
  }

  const parsed = gradeSubmissionSchema.safeParse({
    score: formData.get("score"),
    feedback: formData.get("feedback"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await connectToDatabase();

  const submission = await SubmissionModel.findById(submissionId);
  if (!submission) {
    return { error: "Submission not found." };
  }
  assertSameInstitute(submission, session);

  const owned = await assertOwnsAssignment(submission.assignmentId.toString(), session);
  if (!owned) {
    return { error: "Assignment not found." };
  }
  const { assignment } = owned;

  const { score, feedback } = parsed.data;
  if (score > assignment.maxScore) {
    return { error: `Score cannot exceed the max score of ${assignment.maxScore}.` };
  }

  submission.status = "graded";
  submission.grade = {
    score,
    feedback: feedback || undefined,
    gradedBy: session.userId,
    gradedAt: new Date(),
  };
  await submission.save();

  const actor = await UserModel.findById(session.userId).select("name");
  const student = await UserModel.findById(submission.studentId).select("name");

  await recordAuditEntry({
    session,
    actorName: actor?.name ?? "Unknown",
    action: "submission.grade",
    targetType: "Submission",
    targetId: submission._id.toString(),
    targetName: assignment.title,
    summary: `Graded ${student?.name ?? "student"}'s submission for "${assignment.title}" (${score}/${assignment.maxScore})`,
  });

  await recomputeGradeForSource("assignment", submission._id.toString(), session);

  const courseId = assignment.courseId.toString();
  const assignmentId = assignment._id.toString();
  revalidatePath(`/courses/${courseId}/assignments/${assignmentId}/submissions`);
  revalidatePath(`/my-courses/${courseId}/assignments/${assignmentId}`);

  return { success: true };
}
