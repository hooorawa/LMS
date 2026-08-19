import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import AssignmentModel from "@/models/Assignment";
import SubmissionModel from "@/models/Submission";
import CourseModel from "@/models/Course";
import { requireSession, requireRole, assertSameInstitute } from "@/lib/tenant/scope";
import { createReadUrl } from "@/lib/storage/s3";

export async function listSubmissionsForAssignment(assignmentId: string) {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();

  const assignment = await AssignmentModel.findById(assignmentId).lean();
  if (!assignment) return null;
  assertSameInstitute(assignment, session);

  const course = await CourseModel.findById(assignment.courseId).lean();
  if (!course || course.teacherId.toString() !== session.userId) {
    throw new Error("Resource not found");
  }

  const submissions = await SubmissionModel.find({ assignmentId })
    .populate("studentId", "name email")
    .sort({ submittedAt: -1 })
    .lean();

  const submissionsWithUrls = await Promise.all(
    submissions.map(async (submission) => ({
      ...submission,
      attachmentUrl: submission.attachmentKey
        ? await createReadUrl(submission.attachmentKey)
        : null,
    }))
  );

  return { assignment, course, submissions: submissionsWithUrls };
}

export async function listUngradedSubmissionsForTeacher(limit = 50) {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);
  await connectToDatabase();
  const submissions = await SubmissionModel.find({ instituteId: session.instituteId, status: "submitted" })
    .populate("assignmentId", "title maxScore teacherId courseId")
    .populate("studentId", "name email")
    .sort({ submittedAt: 1 })
    .limit(limit)
    .lean();
  return submissions.filter((submission) => {
    const assignment = submission.assignmentId as unknown as { teacherId?: { toString(): string } } | null;
    return assignment?.teacherId?.toString() === session.userId;
  });
}

export async function getSubmissionForStudent(assignmentId: string) {
  const session = await requireSession();
  requireRole(session, ["student"]);

  await connectToDatabase();

  const submission = await SubmissionModel.findOne({
    assignmentId,
    studentId: session.userId,
  }).lean();

  if (!submission) return null;
  assertSameInstitute(submission, session);

  const attachmentUrl = submission.attachmentKey
    ? await createReadUrl(submission.attachmentKey)
    : null;

  return { ...submission, attachmentUrl };
}
