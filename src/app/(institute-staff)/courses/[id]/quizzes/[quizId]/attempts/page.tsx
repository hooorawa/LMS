import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { listAttemptsForQuizTeacher } from "@/lib/data/quiz-attempt.data";

export default async function QuizAttemptsPage({
  params,
}: {
  params: Promise<{ id: string; quizId: string }>;
}) {
  const { id, quizId } = await params;
  const data = await listAttemptsForQuizTeacher(quizId);

  if (!data) {
    notFound();
  }

  const { quiz, attempts } = data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/courses/${id}/quizzes/${quizId}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; {quiz.title}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Attempts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {attempts.length} attempt{attempts.length === 1 ? "" : "s"}
        </p>
      </div>

      {attempts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No attempts yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {attempts.map((attempt) => {
            const student = attempt.studentId as unknown as { name?: string; email?: string };

            return (
              <Link
                key={attempt._id.toString()}
                href={`/courses/${id}/quizzes/${quizId}/attempts/${attempt._id.toString()}`}
                className="flex items-center justify-between rounded-xl border border-border p-4 hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium">{student?.name ?? "Unknown student"}</p>
                  <p className="text-xs text-muted-foreground">{student?.email}</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>
                    {attempt.totalScore} / {attempt.maxScore}
                  </span>
                  <Badge variant="secondary" className="capitalize">
                    {attempt.status === "submitted" ? "Needs grading" : attempt.status}
                  </Badge>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
