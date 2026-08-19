import Link from "next/link";
import { notFound } from "next/navigation";
import { getAssignmentForStudent } from "@/lib/data/assignment.data";
import { getSubmissionForStudent } from "@/lib/data/submission.data";
import { SubmissionForm } from "./submission-form";
import { StudentWorkspaceHeader } from "@/components/student/student-workspace-header";

export default async function StudentAssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}) {
  const { id, assignmentId } = await params;
  const [assignment, submission] = await Promise.all([
    getAssignmentForStudent(assignmentId),
    getSubmissionForStudent(assignmentId),
  ]);

  if (!assignment) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <StudentWorkspaceHeader eyebrow={assignment.courseTitle} title={assignment.title} description="Read the brief, submit your work, and return here for feedback once it has been reviewed." actions={<Link href={`/my-courses/${id}/assignments`} className="text-sm font-medium text-primary hover:underline">Back to assignments</Link>} metrics={[{ label: "Due", value: new Date(assignment.dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }), detail: "Submission deadline", tone: "warning" }, { label: "Max score", value: assignment.maxScore, detail: "Points available", tone: "primary" }, { label: "Status", value: submission?.status === "graded" ? "Graded" : submission ? "Sent" : "Open", detail: submission?.status === "graded" ? "Feedback available" : "Submit when ready", tone: submission?.status === "graded" ? "success" : "info" }]} />

      <div className="surface-subtle rounded-2xl border border-border/70 p-5">
        {assignment.instructions ? (
          <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed">
            {assignment.instructions}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>Due: {new Date(assignment.dueAt).toLocaleString()}</span>
          <span>Max score: {assignment.maxScore}</span>
          {assignment.attachmentUrl ? (
            <a href={assignment.attachmentUrl} target="_blank" rel="noreferrer" className="underline">
              Reference attachment
            </a>
          ) : null}
        </div>
      </div>

      {submission?.status === "graded" ? (
        <div className="rounded-2xl border border-success/25 bg-success-subtle/25 p-5">
          <p className="text-sm text-muted-foreground">Grade</p>
          <p className="text-3xl font-semibold">
            {submission.grade?.score} / {assignment.maxScore}
          </p>
          {submission.grade?.feedback ? (
            <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
              {submission.grade.feedback}
            </p>
          ) : null}
        </div>
      ) : (
        <SubmissionForm
          assignmentId={assignmentId}
          textResponse={submission?.textResponse ?? ""}
          attachmentKey={submission?.attachmentKey ?? ""}
        />
      )}
    </div>
  );
}
