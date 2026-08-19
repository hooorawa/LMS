import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import QuizModel from "@/models/Quiz";
import QuizAttemptModel from "@/models/QuizAttempt";
import QuizQuestionModel from "@/models/QuizQuestion";
import CourseModel from "@/models/Course";
import { requireSession, requireRole, assertSameInstitute } from "@/lib/tenant/scope";
import { assertEnrolledInCourse } from "@/lib/actions/enrollment-ownership";

/**
 * Only ever emits fields safe to show a student before they've started an
 * attempt — never spreads the raw question doc, so correctOptionIndex /
 * correctBoolean / sampleAnswer can't leak even if a field is added later.
 */
export function toStudentSafeQuestion(question: {
  _id: unknown;
  type: string;
  prompt: string;
  order: number;
  points: number;
  options?: string[];
}) {
  return {
    _id: question._id,
    type: question.type,
    prompt: question.prompt,
    order: question.order,
    points: question.points,
    options: question.type === "mcq" ? question.options : undefined,
  };
}

export async function listQuizzesForCourse(courseId: string) {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();

  const course = await CourseModel.findById(courseId).lean();
  if (!course) return null;
  assertSameInstitute(course, session);
  if (course.teacherId.toString() !== session.userId) return null;

  const quizzes = await QuizModel.find({ courseId }).sort({ createdAt: -1 }).lean();

  return { course, quizzes };
}

export async function getQuizForTeacher(quizId: string) {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();

  const quiz = await QuizModel.findById(quizId).lean();
  if (!quiz) return null;
  assertSameInstitute(quiz, session);

  const course = await CourseModel.findById(quiz.courseId).lean();
  if (!course || course.teacherId.toString() !== session.userId) {
    throw new Error("Resource not found");
  }

  const questions = await QuizQuestionModel.find({ quizId }).sort({ order: 1 }).lean();

  return { ...quiz, courseTitle: course.title, questions };
}

export async function getQuizQuestionForTeacher(questionId: string) {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();

  const question = await QuizQuestionModel.findById(questionId).lean();
  if (!question) return null;
  assertSameInstitute(question, session);

  const quiz = await QuizModel.findById(question.quizId).lean();
  if (!quiz) return null;
  assertSameInstitute(quiz, session);

  const course = await CourseModel.findById(quiz.courseId).lean();
  if (!course || course.teacherId.toString() !== session.userId) {
    throw new Error("Resource not found");
  }

  return { ...question, quizId: quiz._id.toString() };
}

export async function listQuizzesForStudent(courseId: string) {
  const session = await requireSession();
  requireRole(session, ["student"]);

  await connectToDatabase();

  const enrollment = await assertEnrolledInCourse(courseId, session);
  if (!enrollment) return null;

  const course = await CourseModel.findById(courseId).lean();
  if (!course) return null;
  assertSameInstitute(course, session);

  const quizzes = await QuizModel.find({ courseId, status: "published" })
    .sort({ createdAt: -1 })
    .lean();
  const attempts = await QuizAttemptModel.find({
    courseId,
    studentId: session.userId,
  })
    .select("quizId status totalScore maxScore submittedAt")
    .sort({ createdAt: -1 })
    .lean();
  const attemptByQuizId = new Map(
    attempts.map((attempt) => [attempt.quizId.toString(), attempt])
  );

  return {
    course,
    quizzes: quizzes.map((quiz) => ({
      ...quiz,
      attempt: attemptByQuizId.get(quiz._id.toString()) ?? null,
    })),
  };
}

export async function getQuizForStudent(quizId: string) {
  const session = await requireSession();
  requireRole(session, ["student"]);

  await connectToDatabase();

  const quiz = await QuizModel.findOne({ _id: quizId, status: "published" }).lean();
  if (!quiz) return null;
  assertSameInstitute(quiz, session);

  const enrollment = await assertEnrolledInCourse(quiz.courseId.toString(), session);
  if (!enrollment) return null;

  const course = await CourseModel.findById(quiz.courseId).select("title").lean();
  const questionCount = await QuizQuestionModel.countDocuments({ quizId: quiz._id });

  return { ...quiz, courseTitle: course?.title ?? "", questionCount };
}
