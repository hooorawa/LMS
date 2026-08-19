import Link from "next/link";
import { requireStaffModuleAccess } from "@/lib/auth/staff-permissions";
import { listUngradedSubmissionsForTeacher } from "@/lib/data/submission.data";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";

export default async function GradingQueuePage() {
  await requireStaffModuleAccess("subjects");
  const submissions = await listUngradedSubmissionsForTeacher();

  const rows: DataTableRow[] = submissions.flatMap((submission) => {
    const assignment = submission.assignmentId as unknown as {
      _id: { toString(): string };
      title: string;
      courseId: { toString(): string };
    } | null;
    const student = submission.studentId as unknown as {
      name?: string;
      email?: string;
    } | null;

    if (!assignment) return [];

    return [
      {
        key: String(submission._id),
        searchValue: `${assignment.title} ${student?.name ?? ""} ${student?.email ?? ""}`,
        cells: [
          <span key="assignment" className="font-medium">{assignment.title}</span>,
          student?.name ?? "Student",
          submission.submittedAt.toLocaleDateString(),
          <Badge key="status" variant="warning">Awaiting grade</Badge>,
          <Link
            key="review"
            href={`/courses/${String(assignment.courseId)}/assignments/${String(assignment._id)}/submissions`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Review
          </Link>,
        ],
      },
    ];
  });

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader
        eyebrow="Teaching"
        title="Grading queue"
        description="Review submitted work that still needs feedback."
        metrics={[
          { label: "Awaiting grade", value: submissions.length, detail: "Submissions to review", tone: "warning" },
        ]}
      />

      <DataTableCard
        columns={[
          { key: "assignment", header: "Assignment" },
          { key: "student", header: "Student" },
          { key: "submitted", header: "Submitted" },
          { key: "status", header: "Status" },
          { key: "action", header: "Action" },
        ]}
        rows={rows}
        searchPlaceholder="Search grading queue..."
        emptyTitle="Your grading queue is clear."
      />
    </div>
  );
}
