import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getQuizForStudent } from "@/lib/data/quiz.data";
import { getActiveAttemptForStudent } from "@/lib/data/quiz-attempt.data";
import { startQuizAttempt } from "@/lib/actions/quiz-attempt.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StudentWorkspaceHeader } from "@/components/student/student-workspace-header";

export default async function StudentQuizPreStartPage({
  params,
}: {
  params: Promise<{ id: string; quizId: string }>;
}) {
  const { id, quizId } = await params;
  const [quiz, attempt] = await Promise.all([
    getQuizForStudent(quizId),
    getActiveAttemptForStudent(quizId),
  ]);

  if (!quiz) {
    notFound();
  }

  if (attempt?.status === "in_progress") {
    redirect(`/my-courses/${id}/quizzes/${quizId}/take`);
  }

  return (
    <div className="flex flex-col gap-6">
      <StudentWorkspaceHeader eyebrow={quiz.courseTitle} title={quiz.title} description="Review the quiz requirements before starting. Your attempt is timed once you begin." actions={<Link href={`/my-courses/${id}/quizzes`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Back to quizzes</Link>} metrics={[{ label: "Time limit", value: `${quiz.timeLimitMinutes}m`, detail: "Complete within this window", tone: "warning" }, { label: "Questions", value: quiz.questionCount, detail: "Knowledge checks included", tone: "primary" }, { label: "Attempt", value: attempt ? "Used" : "Ready", detail: attempt ? "Result available below" : "Start when prepared", tone: attempt ? "success" : "info" }]} />

      <div className="surface-subtle rounded-2xl border border-border/70 p-5">
        {quiz.instructions ? (
          <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed">{quiz.instructions}</p>
        ) : null}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>Time limit: {quiz.timeLimitMinutes} min</span>
          <span>Questions: {quiz.questionCount}</span>
        </div>
      </div>

      {attempt ? (
        <div>
          <p className="mb-3 text-sm text-muted-foreground">
            You&rsquo;ve already attempted this quiz.
          </p>
          <Link
            href={`/my-courses/${id}/quizzes/${quizId}/result`}
            className={cn(buttonVariants())}
          >
            View result
          </Link>
        </div>
      ) : (
        <form action={startQuizAttempt}>
          <input type="hidden" name="quizId" value={quizId} />
          <Button type="submit">Start quiz</Button>
        </form>
      )}
    </div>
  );
}
