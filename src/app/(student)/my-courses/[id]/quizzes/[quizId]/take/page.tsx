import { notFound, redirect } from "next/navigation";
import { getActiveAttemptForStudent, getQuizQuestionsForAttempt } from "@/lib/data/quiz-attempt.data";
import { TakeQuizForm } from "./take-quiz-form";

export default async function TakeQuizPage({
  params,
}: {
  params: Promise<{ id: string; quizId: string }>;
}) {
  const { id, quizId } = await params;

  const attempt = await getActiveAttemptForStudent(quizId);
  if (!attempt) {
    redirect(`/my-courses/${id}/quizzes/${quizId}`);
  }
  if (attempt.status !== "in_progress") {
    redirect(`/my-courses/${id}/quizzes/${quizId}/result`);
  }

  const data = await getQuizQuestionsForAttempt(attempt._id.toString());
  if (!data) {
    notFound();
  }

  return (
    <TakeQuizForm
      attemptId={attempt._id.toString()}
      quizTitle={data.quiz.title}
      expiresAt={new Date(attempt.expiresAt).toISOString()}
      questions={data.questions.map((question) => ({
        _id: String(question._id),
        type: question.type as "mcq" | "truefalse" | "short",
        prompt: question.prompt,
        points: question.points,
        options: question.options,
      }))}
    />
  );
}
