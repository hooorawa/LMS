import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import AssignmentModel from "@/models/Assignment";
import SubmissionModel from "@/models/Submission";
import CourseModel from "@/models/Course";
import { requireSession, requireRole, assertSameInstitute } from "@/lib/tenant/scope";
import { assertEnrolledInCourse } from "@/lib/actions/enrollment-ownership";
import { createReadUrl } from "@/lib/storage/s3";

export async function listAssignmentsForCourse(courseId: string) {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();

  const course = await CourseModel.findById(courseId).lean();
  if (!course) return null;
  assertSameInstitute(course, session);
  if (course.teacherId.toString() !== session.userId) return null;

  const assignments = await AssignmentModel.find({ courseId }).sort({ dueAt: 1 }).lean();

  return { course, assignments };
}

export async function getAssignmentForTeacher(assignmentId: string) {
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

  const attachmentUrl = assignment.attachmentKey
    ? await createReadUrl(assignment.attachmentKey)
    : null;

  return { ...assignment, courseTitle: course.title, attachmentUrl };
}

export async function listAssignmentsForStudent(courseId: string) {
  const session = await requireSession();
  requireRole(session, ["student"]);

  await connectToDatabase();

  const enrollment = await assertEnrolledInCourse(courseId, session);
  if (!enrollment) return null;

  const course = await CourseModel.findById(courseId).lean();
  if (!course) return null;
  assertSameInstitute(course, session);

  const assignments = await AssignmentModel.find({ courseId, status: "published" })
    .sort({ dueAt: 1 })
    .lean();

  const submissions = await SubmissionModel.find({
    courseId,
    studentId: session.userId,
  })
    .select("assignmentId status grade.score")
    .lean();

  const submissionByAssignmentId = new Map(
    submissions.map((submission) => [submission.assignmentId.toString(), submission])
  );

  return {
    course,
    assignments: assignments.map((assignment) => ({
      ...assignment,
      submission: submissionByAssignmentId.get(assignment._id.toString()) ?? null,
    })),
  };
}

export async function getAssignmentForStudent(assignmentId: string) {
  const session = await requireSession();
  requireRole(session, ["student"]);

  await connectToDatabase();

  const assignment = await AssignmentModel.findOne({
    _id: assignmentId,
    status: "published",
  }).lean();
  if (!assignment) return null;
  assertSameInstitute(assignment, session);

  const enrollment = await assertEnrolledInCourse(assignment.courseId.toString(), session);
  if (!enrollment) return null;

  const course = await CourseModel.findById(assignment.courseId).select("title").lean();

  const attachmentUrl = assignment.attachmentKey
    ? await createReadUrl(assignment.attachmentKey)
    : null;

  return { ...assignment, courseTitle: course?.title ?? "", attachmentUrl };
}
