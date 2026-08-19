import Link from "next/link";
import { notFound } from "next/navigation";
import { listAssignmentsForStudent } from "@/lib/data/assignment.data";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StudentWorkspaceHeader } from "@/components/student/student-workspace-header";

const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  graded: "Graded",
};

export default async function StudentAssignmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await listAssignmentsForStudent(id);

  if (!result) {
    notFound();
  }

  const { course, assignments } = result;
  const currentTime = new Date().getTime();
  const submittedAssignments = assignments.filter((assignment) => Boolean(assignment.submission)).length;
  const overdueAssignments = assignments.filter((assignment) => !assignment.submission && new Date(assignment.dueAt).getTime() < currentTime).length;

  return (
    <div className="flex flex-col gap-6">
      <StudentWorkspaceHeader eyebrow={course.title} title="Assignments" description="Keep submissions organised, review feedback, and make sure nothing important slips past its due date." actions={<Link href={`/my-courses/${id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Back to course</Link>} metrics={[{ label: "Assignments", value: assignments.length, detail: "Available in this course", tone: "primary" }, { label: "Submitted", value: submittedAssignments, detail: "Sent for review", tone: "success" }, { label: "Overdue", value: overdueAssignments, detail: "Still awaiting submission", tone: overdueAssignments > 0 ? "warning" : "info" }]} />

      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No assignments available yet.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {assignments.map((assignment) => (
            <li key={String(assignment._id)}>
              <Link
                href={`/my-courses/${id}/assignments/${String(assignment._id)}`}
                className="surface-subtle flex h-full flex-col justify-between gap-4 rounded-2xl border border-border/70 px-4 py-4 text-sm transition-colors hover:-translate-y-0.5 hover:bg-muted"
              >
                <span className="flex flex-col gap-1">
                  <span className="font-medium">{assignment.title}</span>
                  <span className="text-xs text-muted-foreground">
                    Due {new Date(assignment.dueAt).toLocaleString()}
                  </span>
                  {assignment.submission?.grade?.score !== undefined ? (
                    <span className="text-xs text-success">
                      Score: {assignment.submission.grade.score} / {assignment.maxScore}
                    </span>
                  ) : null}
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  {assignment.submission ? (
                    <Badge variant={assignment.submission.status === "graded" ? "success" : "secondary"}>
                      {STATUS_LABEL[assignment.submission.status] ?? assignment.submission.status}
                    </Badge>
                  ) : new Date(assignment.dueAt).getTime() < currentTime ? (
                    <Badge variant="destructive">Overdue</Badge>
                  ) : (
                    <Badge variant="warning">Not submitted</Badge>
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
