import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import GradeModel, { type GradeSource } from "@/models/Grade";
import SubmissionModel from "@/models/Submission";
import AssignmentModel from "@/models/Assignment";
import QuizAttemptModel from "@/models/QuizAttempt";
import MarksModel from "@/models/Marks";
import ExamModel from "@/models/Exam";
import { assertSameInstitute, type SessionPayload } from "@/lib/tenant/scope";

/**
 * Upserts the Grade rollup row for one Submission or QuizAttempt. Only ever
 * writes a row once the source is fully graded — a quiz attempt with a
 * pending short answer, or an ungraded submission, is silently skipped so it
 * never surfaces in a grade summary until grading is complete.
 */
export async function recomputeGradeForSource(
  source: GradeSource,
  sourceId: string,
  session: SessionPayload
): Promise<void> {
  await connectToDatabase();

  if (source === "assignment") {
    const submission = await SubmissionModel.findById(sourceId).lean();
    if (!submission || submission.status !== "graded" || submission.grade?.score === undefined) {
      return;
    }
    assertSameInstitute(submission, session);

    const assignment = await AssignmentModel.findById(submission.assignmentId)
      .select("maxScore")
      .lean();
    if (!assignment) return;

    await GradeModel.findOneAndUpdate(
      { source: "assignment", sourceId: submission._id },
      {
        instituteId: submission.instituteId,
        studentId: submission.studentId,
        courseId: submission.courseId,
        source: "assignment",
        sourceId: submission._id,
        score: submission.grade.score,
        maxScore: assignment.maxScore,
        computedAt: new Date(),
      },
      { upsert: true }
    );
    return;
  }

  if (source === "quiz") {
    const attempt = await QuizAttemptModel.findById(sourceId).lean();
    if (!attempt || attempt.status !== "graded") return;
    assertSameInstitute(attempt, session);

    await GradeModel.findOneAndUpdate(
      { source: "quiz", sourceId: attempt._id },
      {
        instituteId: attempt.instituteId,
        studentId: attempt.studentId,
        courseId: attempt.courseId,
        source: "quiz",
        sourceId: attempt._id,
        score: attempt.totalScore,
        maxScore: attempt.maxScore,
        computedAt: new Date(),
      },
      { upsert: true }
    );
    return;
  }

  // source === "exam" — sourceId is a Marks._id.
  const marks = await MarksModel.findById(sourceId).lean();
  if (!marks) return;
  assertSameInstitute(marks, session);

  const exam = await ExamModel.findById(marks.examId).select("subjectId maxMarks").lean();
  if (!exam) return;

  await GradeModel.findOneAndUpdate(
    { source: "exam", sourceId: marks._id },
    {
      instituteId: marks.instituteId,
      studentId: marks.studentId,
      courseId: null,
      subjectId: exam.subjectId,
      examId: marks.examId,
      source: "exam",
      sourceId: marks._id,
      score: marks.marksObtained,
      maxScore: exam.maxMarks,
      computedAt: new Date(),
    },
    { upsert: true }
  );
}
