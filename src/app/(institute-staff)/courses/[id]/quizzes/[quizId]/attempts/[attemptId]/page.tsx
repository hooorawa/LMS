import Link from "next/link";
import { notFound } from "next/navigation";
import { getAttemptForTeacherGrading } from "@/lib/data/quiz-attempt.data";
import type { QuizAttemptAnswer } from "@/models/QuizAttempt";
import { GradeShortAnswerForm } from "./grade-short-answer-form";

const TYPE_LABEL: Record<string, string> = {
  mcq: "Multiple choice",
  truefalse: "True/False",
  short: "Short answer",
};

export default async function AttemptGradingPage({
  params,
}: {
  params: Promise<{ id: string; quizId: string; attemptId: string }>;
}) {
  const { id, quizId, attemptId } = await params;
  const data = await getAttemptForTeacherGrading(attemptId);

  if (!data) {
    notFound();
  }

  const { attempt, quiz, questions } = data;
  const student = attempt.studentId as unknown as { name?: string; email?: string };
  const answerByQuestionId = new Map<string, QuizAttemptAnswer>(
    attempt.answers.map((answer: QuizAttemptAnswer) => [answer.questionId.toString(), answer])
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/courses/${id}/quizzes/${quizId}/attempts`}
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; {quiz.title} attempts
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{student?.name ?? "Unknown student"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{student?.email}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-0.5 capitalize">{attempt.status}</span>
          <span>
            Score: {attempt.totalScore} / {attempt.maxScore}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {questions.map((question, index) => {
          const questionId = question._id.toString();
          const answer = answerByQuestionId.get(questionId);

          return (
            <div key={questionId} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>Q{index + 1}</span>
                <span className="rounded-full bg-muted px-2 py-0.5">
                  {TYPE_LABEL[question.type] ?? question.type}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5">
                  {question.points} pt{question.points === 1 ? "" : "s"}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium">{question.prompt}</p>

              {question.type === "mcq" ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Selected:{" "}
                  {answer?.selectedOptionIndex !== undefined
                    ? question.options?.[answer.selectedOptionIndex] ?? "—"
                    : "No answer"}{" "}
                  {answer?.isCorrect ? "(correct)" : "(incorrect)"}
                </p>
              ) : null}

              {question.type === "truefalse" ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Selected: {answer?.selectedBoolean !== undefined ? String(answer.selectedBoolean) : "No answer"}{" "}
                  {answer?.isCorrect ? "(correct)" : "(incorrect)"}
                </p>
              ) : null}

              {question.type === "short" ? (
                <>
                  <p className="mt-2 whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm">
                    {answer?.textAnswer || "No answer submitted."}
                  </p>
                  {question.sampleAnswer ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Reference answer: {question.sampleAnswer}
                    </p>
                  ) : null}
                  <div className="mt-3">
                    <GradeShortAnswerForm
                      attemptId={attempt._id.toString()}
                      questionId={questionId}
                      maxPoints={question.points}
                      pointsAwarded={answer?.pointsAwarded ?? 0}
                      graded={!answer?.needsManualGrade}
                    />
                  </div>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
