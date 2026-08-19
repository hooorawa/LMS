import Link from "next/link";
import { notFound } from "next/navigation";
import { listAssignmentsForCourse } from "@/lib/data/assignment.data";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { AssignmentFormDialog } from "./new/assignment-form-dialog";

const COLUMNS = [
  { key: "title", header: "Title" },
  { key: "due", header: "Due" },
  { key: "maxScore", header: "Max score" },
  { key: "status", header: "Status" },
  { key: "actions", header: "Actions" },
];

export default async function CourseAssignmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await listAssignmentsForCourse(id);

  if (!result) {
    notFound();
  }

  const { course, assignments } = result;

  const rows: DataTableRow[] = assignments.map((assignment) => ({
    key: String(assignment._id),
    searchValue: assignment.title,
    cells: [
      <span key="title" className="font-medium">{assignment.title}</span>,
      assignment.dueAt ? new Date(assignment.dueAt).toLocaleString() : "-",
      assignment.maxScore,
      <Badge key="status" variant={assignment.status === "published" ? "success" : "secondary"} className="capitalize">
        {assignment.status}
      </Badge>,
      <Link
        key="manage"
        href={`/courses/${id}/assignments/${String(assignment._id)}`}
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
          <h1 className="text-2xl font-semibold">Assignments</h1>
          <p className="mt-1 text-sm text-muted-foreground">{course.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/courses/${id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Back to course
          </Link>
          <AssignmentFormDialog courseId={id} />
        </div>
      </div>

      <DataTableCard columns={COLUMNS} rows={rows} emptyTitle="No assignments yet." />
    </div>
  );
}
