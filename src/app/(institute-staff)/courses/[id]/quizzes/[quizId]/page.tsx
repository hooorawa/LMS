import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuizForTeacher } from "@/lib/data/quiz.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QuizStatus } from "@/models/Quiz";
import { QuizStatusForm } from "./quiz-status-form";
import { QuestionList } from "./question-list";
import { AddQuestionForm } from "./add-question-form";
import { QuizEditDialog } from "./edit/quiz-edit-dialog";

export default async function QuizDetailPage({
  params,
}: {
  params: Promise<{ id: string; quizId: string }>;
}) {
  const { id, quizId } = await params;
  const quiz = await getQuizForTeacher(quizId);

  if (!quiz) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{quiz.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{quiz.courseTitle}</p>
          {quiz.instructions ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{quiz.instructions}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5 capitalize">{quiz.status}</span>
            <span>Time limit: {quiz.timeLimitMinutes} min</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/courses/${id}/quizzes/${quizId}/attempts`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            View attempts
          </Link>
          <QuizEditDialog
            quizId={quizId}
            title={quiz.title}
            instructions={quiz.instructions ?? ""}
            timeLimitMinutes={quiz.timeLimitMinutes}
            status={quiz.status as "draft" | "published"}
          />
          <QuizStatusForm quizId={quizId} status={quiz.status as QuizStatus} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <QuestionList questions={quiz.questions} />
          <AddQuestionForm quizId={quizId} />
        </CardContent>
      </Card>
    </div>
  );
}
