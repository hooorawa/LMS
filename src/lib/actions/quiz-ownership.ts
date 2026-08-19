import "server-only";
import QuizModel from "@/models/Quiz";
import QuizQuestionModel from "@/models/QuizQuestion";
import { assertSameInstitute, type SessionPayload } from "@/lib/tenant/scope";
import { assertOwnsCourse } from "@/lib/actions/course-ownership";

export async function assertOwnsQuiz(quizId: string, session: SessionPayload) {
  const quiz = await QuizModel.findById(quizId);
  if (!quiz) return null;
  assertSameInstitute(quiz, session);
  const course = await assertOwnsCourse(quiz.courseId.toString(), session);
  if (!course) return null;
  return { quiz, course };
}

export async function assertOwnsQuizQuestion(questionId: string, session: SessionPayload) {
  const question = await QuizQuestionModel.findById(questionId);
  if (!question) return null;
  assertSameInstitute(question, session);
  const owned = await assertOwnsQuiz(question.quizId.toString(), session);
  if (!owned) return null;
  return { question, quiz: owned.quiz, course: owned.course };
}
