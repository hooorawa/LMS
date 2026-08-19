import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listCoursesForTeacher } from "@/lib/data/course.data";
import { getMyGradesForStudent } from "@/lib/data/grade.data";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";

const TEACHER_COLUMNS = [
  { key: "course", header: "Course" },
  { key: "status", header: "Status" },
  { key: "actions", header: "Actions" },
];

export default async function GradesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.role === "student") {
    const groups = await getMyGradesForStudent();

    return (
      <>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Grades</h2>
            <p className="mt-1 text-sm text-muted-foreground">Your grades across all courses.</p>
          </div>
          <a
            href={`/api/reports/report-card/${session.userId}`}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Download report card
          </a>
        </div>

        {groups.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">No grades yet.</p>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {groups.map((group) => (
              <div key={group.courseId} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{group.courseTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    {group.percent !== null ? `${group.percent.toFixed(1)}%` : "-"}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {group.itemCount} graded item{group.itemCount === 1 ? "" : "s"} &middot;{" "}
                  {group.totalScore} / {group.totalMaxScore}
                </p>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  if (session.role === "institute-staff") {
    const courses = await listCoursesForTeacher();
    const publishedCount = courses.filter((course) => course.status === "published").length;

    const rows: DataTableRow[] = courses.map((course) => ({
      key: String(course._id),
      searchValue: course.title,
      cells: [
        <span key="title" className="font-medium">{course.title}</span>,
        <span key="status" className="capitalize">{course.status}</span>,
        <Link
          key="grades"
          href={`/courses/${course._id}/grades`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          View grades
        </Link>,
      ],
    }));

    return (
      <div className="flex flex-col gap-6">
        <WorkspaceHeader
          eyebrow="Academic assessment"
          title="Grades"
          description="Pick a course to view or update its grade table."
          metrics={[
            { label: "Courses", value: courses.length, detail: "Assigned to you", tone: "primary" },
            { label: "Published", value: publishedCount, detail: "Visible to students", tone: "success" },
          ]}
        />
        <DataTableCard columns={TEACHER_COLUMNS} rows={rows} emptyTitle="No courses yet." />
      </div>
    );
  }

  redirect("/dashboard");
}
