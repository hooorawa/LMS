import { Fragment } from "react";
import { listClasses } from "@/lib/data/class.data";
import { listPublishedCoursesForInstitute } from "@/lib/data/course.data";
import { listEnrollmentsForInstitute } from "@/lib/data/enrollment.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { BulkEnrollForm } from "./bulk-enroll-form";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";

const COLUMNS = [
  { key: "student", header: "Student" },
  { key: "course", header: "Course" },
  { key: "status", header: "Status" },
  { key: "progress", header: "Progress" },
  { key: "enrolled", header: "Enrolled" },
];

export default async function EnrollmentsPage() {
  const [classes, courses, enrollments] = await Promise.all([
    listClasses(),
    listPublishedCoursesForInstitute(),
    listEnrollmentsForInstitute(),
  ]);

  const classOptions = classes.map((klass) => ({
    id: String(klass._id),
    label: klass.section ? `${klass.name} ${klass.section}` : klass.name,
  }));

  const courseOptions = courses.map((course) => {
    const teacher = course.teacherId as unknown as { name?: string } | null;
    return {
      id: String(course._id),
      label: teacher?.name ? `${course.title} (${teacher.name})` : course.title,
    };
  });
  const activeEnrollments = enrollments.filter((enrollment) => enrollment.status === "active").length;
  const averageProgress = enrollments.length ? Math.round(enrollments.reduce((total, enrollment) => total + (enrollment.progress?.percentComplete ?? 0), 0) / enrollments.length) : 0;

  const rows: DataTableRow[] = enrollments.map((enrollment) => {
    const student = enrollment.studentId as unknown as { name?: string; email?: string } | null;
    const course = enrollment.courseId as unknown as { title?: string } | null;
    return {
      key: String(enrollment._id),
      searchValue: `${student?.name ?? ""} ${student?.email ?? ""} ${course?.title ?? ""}`,
      cells: [
        <Fragment key="student">
          <span className="font-medium">{student?.name ?? "Unknown"}</span>
          {student?.email ? (
            <span className="ml-1 text-xs text-muted-foreground">({student.email})</span>
          ) : null}
        </Fragment>,
        course?.title ?? "Unknown",
        <Badge key="status" variant="secondary" className="capitalize">
          {enrollment.status}
        </Badge>,
        `${enrollment.progress?.percentComplete ?? 0}%`,
        enrollment.createdAt ? new Date(enrollment.createdAt).toLocaleDateString() : "-",
      ],
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader title="Course enrollments" description="Place whole classes into published courses and keep an eye on learning participation and progress." metrics={[{ label: "Enrollments", value: enrollments.length, detail: "Across published courses", tone: "primary" }, { label: "Active learners", value: activeEnrollments, detail: "Currently enrolled", tone: "success" }, { label: "Average progress", value: `${averageProgress}%`, detail: "Across all enrollments", tone: "info" }]} />

      <Card>
        <CardHeader>
          <CardTitle>Bulk enroll a class</CardTitle>
          <p className="text-sm text-muted-foreground">Choose a class and course to add every eligible learner at once.</p>
        </CardHeader>
        <CardContent>
          <BulkEnrollForm classes={classOptions} courses={courseOptions} />
        </CardContent>
      </Card>

      <div>
        <DataTableCard
          title="Enrollment activity"
          sub="Search learners or courses to review the latest learning access records."
          columns={COLUMNS}
          rows={rows}
          searchPlaceholder="Search enrollments..."
          emptyTitle="No enrollments yet."
        />
      </div>
    </div>
  );
}
