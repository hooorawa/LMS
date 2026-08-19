import "server-only";
import { connectToDatabase } from "@/lib/db/connect";
import QuizModel from "@/models/Quiz";
import QuizQuestionModel from "@/models/QuizQuestion";
import QuizAttemptModel from "@/models/QuizAttempt";
import { requireSession, requireRole, assertSameInstitute } from "@/lib/tenant/scope";
import { toStudentSafeQuestion } from "@/lib/data/quiz.data";
import { assertOwnsQuiz } from "@/lib/actions/quiz-ownership";

/**
 * If a student never clicks submit, the deadline is still enforced here: any
 * in_progress attempt past expiresAt is force-graded with whatever answers
 * were actually saved (none, since answers are only written on submit), so
 * silence can't be used to dodge grading.
 */
async function forceSubmitIfExpired(attempt: InstanceType<typeof QuizAttemptModel>) {
  if (attempt.status !== "in_progress" || new Date() <= attempt.expiresAt) {
    return attempt;
  }

  const questions = await QuizQuestionModel.find({ quizId: attempt.quizId })
    .sort({ order: 1 })
    .lean();

  let hasPendingShort = false;

  attempt.answers = questions.map((question) => {
    if (question.type === "mcq" || question.type === "truefalse") {
      return {
        questionId: question._id,
        type: question.type,
        isCorrect: false,
        pointsAwarded: 0,
        needsManualGrade: false,
      };
    }

    hasPendingShort = true;
    return {
      questionId: question._id,
      type: "short",
      isCorrect: null,
      pointsAwarded: 0,
      needsManualGrade: true,
    };
  });

  attempt.autoGradedScore = 0;
  attempt.manualGradedScore = 0;
  attempt.totalScore = 0;
  attempt.submittedAt = new Date();
  attempt.status = hasPendingShort ? "submitted" : "graded";
  await attempt.save();

  return attempt;
}

export async function getActiveAttemptForStudent(quizId: string) {
  const session = await requireSession();
  requireRole(session, ["student"]);

  await connectToDatabase();

  const attempt = await QuizAttemptModel.findOne({ quizId, studentId: session.userId });
  if (!attempt) return null;
  assertSameInstitute(attempt, session);

  await forceSubmitIfExpired(attempt);

  return attempt.toObject();
}

export async function getQuizQuestionsForAttempt(attemptId: string) {
  const session = await requireSession();
  requireRole(session, ["student"]);

  await connectToDatabase();

  const attempt = await QuizAttemptModel.findById(attemptId);
  if (!attempt) return null;
  assertSameInstitute(attempt, session);
  if (attempt.studentId.toString() !== session.userId) return null;

  await forceSubmitIfExpired(attempt);

  const quiz = await QuizModel.findById(attempt.quizId).lean();
  if (!quiz) return null;

  const questions = await QuizQuestionModel.find({ quizId: attempt.quizId })
    .sort({ order: 1 })
    .lean();

  return {
    attempt: attempt.toObject(),
    quiz,
    questions: questions.map(toStudentSafeQuestion),
  };
}

export async function getAttemptResultForStudent(quizId: string) {
  const session = await requireSession();
  requireRole(session, ["student"]);

  await connectToDatabase();

  const attempt = await QuizAttemptModel.findOne({ quizId, studentId: session.userId });
  if (!attempt) return null;
  assertSameInstitute(attempt, session);

  await forceSubmitIfExpired(attempt);

  const quiz = await QuizModel.findById(quizId).select("title").lean();

  return { attempt: attempt.toObject(), quizTitle: quiz?.title ?? "" };
}

export async function listAttemptsForQuizTeacher(quizId: string) {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();

  const owned = await assertOwnsQuiz(quizId, session);
  if (!owned) return null;
  const { quiz, course } = owned;

  const attempts = await QuizAttemptModel.find({ quizId })
    .populate("studentId", "name email")
    .sort({ submittedAt: -1 })
    .lean();

  return { quiz, course, attempts };
}

export async function getAttemptForTeacherGrading(attemptId: string) {
  const session = await requireSession();
  requireRole(session, ["institute-staff"]);

  await connectToDatabase();

  const attempt = await QuizAttemptModel.findById(attemptId)
    .populate("studentId", "name email")
    .lean();
  if (!attempt) return null;
  assertSameInstitute(attempt, session);

  const owned = await assertOwnsQuiz(attempt.quizId.toString(), session);
  if (!owned) return null;
  const { quiz, course } = owned;

  const questions = await QuizQuestionModel.find({ quizId: attempt.quizId })
    .sort({ order: 1 })
    .lean();

  return { attempt, quiz, course, questions };
}
