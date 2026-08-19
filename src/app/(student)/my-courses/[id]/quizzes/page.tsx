import Link from "next/link";
import { notFound } from "next/navigation";
import { listQuizzesForStudent } from "@/lib/data/quiz.data";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StudentWorkspaceHeader } from "@/components/student/student-workspace-header";

const ATTEMPT_LABEL: Record<string, string> = {
  in_progress: "In progress",
  submitted: "Submitted",
  graded: "Graded",
};

export default async function StudentQuizzesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await listQuizzesForStudent(id);

  if (!result) {
    notFound();
  }

  const { course, quizzes } = result;
  const completedQuizzes = quizzes.filter((quiz) => quiz.attempt?.status === "submitted" || quiz.attempt?.status === "graded").length;
  const inProgressQuizzes = quizzes.filter((quiz) => quiz.attempt?.status === "in_progress").length;

  return (
    <div className="flex flex-col gap-6">
      <StudentWorkspaceHeader eyebrow={course.title} title="Quizzes" description="See every knowledge check, continue an open attempt, and revisit your submitted results." actions={<Link href={`/my-courses/${id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Back to course</Link>} metrics={[{ label: "Quizzes", value: quizzes.length, detail: "Available in this course", tone: "primary" }, { label: "Completed", value: completedQuizzes, detail: "Submitted or graded", tone: "success" }, { label: "In progress", value: inProgressQuizzes, detail: "Ready to continue", tone: inProgressQuizzes > 0 ? "warning" : "info" }]} />

      {quizzes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No quizzes available yet.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {quizzes.map((quiz) => (
            <li key={String(quiz._id)}>
              <Link
                href={`/my-courses/${id}/quizzes/${String(quiz._id)}`}
                className="surface-subtle flex h-full flex-col justify-between gap-4 rounded-2xl border border-border/70 px-4 py-4 text-sm transition-colors hover:-translate-y-0.5 hover:bg-muted"
              >
                <span className="flex flex-col gap-1">
                  <span className="font-medium">{quiz.title}</span>
                  <span className="text-xs text-muted-foreground">{quiz.timeLimitMinutes} min</span>
                  {quiz.attempt?.status === "graded" || quiz.attempt?.status === "submitted" ? (
                    <span className="text-xs text-success">
                      Score: {quiz.attempt.totalScore} / {quiz.attempt.maxScore}
                    </span>
                  ) : null}
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  {quiz.attempt ? (
                    <Badge variant={quiz.attempt.status === "graded" ? "success" : "secondary"}>
                      {ATTEMPT_LABEL[quiz.attempt.status] ?? quiz.attempt.status}
                    </Badge>
                  ) : (
                    <Badge variant="warning">Not attempted</Badge>
                  )}
                  <span className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                    Open
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
