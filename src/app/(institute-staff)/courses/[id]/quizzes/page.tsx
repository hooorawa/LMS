import Link from "next/link";
import { notFound } from "next/navigation";
import { listQuizzesForCourse } from "@/lib/data/quiz.data";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { QuizFormDialog } from "./new/quiz-form-dialog";

const COLUMNS = [
  { key: "title", header: "Title" },
  { key: "timeLimit", header: "Time limit" },
  { key: "status", header: "Status" },
  { key: "actions", header: "Actions" },
];

export default async function CourseQuizzesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await listQuizzesForCourse(id);

  if (!result) {
    notFound();
  }

  const { course, quizzes } = result;

  const rows: DataTableRow[] = quizzes.map((quiz) => ({
    key: String(quiz._id),
    searchValue: quiz.title,
    cells: [
      <span key="title" className="font-medium">{quiz.title}</span>,
      `${quiz.timeLimitMinutes} min`,
      <Badge key="status" variant={quiz.status === "published" ? "success" : "secondary"} className="capitalize">
        {quiz.status}
      </Badge>,
      <Link
        key="manage"
        href={`/courses/${id}/quizzes/${String(quiz._id)}`}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        Manage
      </Link>,
    ],
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Quizzes</h1>
          <p className="mt-1 text-sm text-muted-foreground">{course.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/courses/${id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Back to course
          </Link>
          <QuizFormDialog courseId={id} />
        </div>
      </div>

      <DataTableCard columns={COLUMNS} rows={rows} emptyTitle="No quizzes yet." />
    </div>
  );
}
