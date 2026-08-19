import Link from "next/link";
import { notFound } from "next/navigation";
import { getAssignmentForTeacher } from "@/lib/data/assignment.data";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AssignmentStatus } from "@/models/Assignment";
import { AssignmentStatusForm } from "./assignment-status-form";
import { AssignmentEditDialog } from "./edit/assignment-edit-dialog";

function toDatetimeLocal(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}) {
  const { id, assignmentId } = await params;
  const assignment = await getAssignmentForTeacher(assignmentId);

  if (!assignment) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{assignment.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{assignment.courseTitle}</p>
          {assignment.instructions ? (
            <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm text-muted-foreground">
              {assignment.instructions}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5 capitalize">
              {assignment.status}
            </span>
            <span>Due: {new Date(assignment.dueAt).toLocaleString()}</span>
            <span>Max score: {assignment.maxScore}</span>
            {assignment.attachmentUrl ? (
              <a
                href={assignment.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Reference attachment
              </a>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/courses/${id}/assignments/${assignmentId}/submissions`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            View submissions
          </Link>
          <AssignmentEditDialog
            assignmentId={assignmentId}
            courseId={id}
            title={assignment.title}
            instructions={assignment.instructions ?? ""}
            dueAt={toDatetimeLocal(new Date(assignment.dueAt))}
            maxScore={assignment.maxScore}
            attachmentKey={assignment.attachmentKey ?? ""}
            status={assignment.status as AssignmentStatus}
          />
          <AssignmentStatusForm
            assignmentId={assignmentId}
            status={assignment.status as AssignmentStatus}
          />
        </div>
      </div>

      <Link
        href={`/courses/${id}/assignments`}
        className="inline-block text-sm text-muted-foreground hover:underline"
      >
        &larr; Back to assignments
      </Link>
    </div>
  );
}
