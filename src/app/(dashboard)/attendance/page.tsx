import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStaffModuleAccess } from "@/lib/auth/staff-permissions";
import { getSession } from "@/lib/auth/session";
import {
  getInstituteAttendanceSummary,
  getMyAttendanceHistory,
  listClassesForAttendanceTeacher,
} from "@/lib/data/attendance.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";
import { StudentWorkspaceHeader } from "@/components/student/student-workspace-header";

const ADMIN_COLUMNS = [
  { key: "class", header: "Class" },
  { key: "attendance", header: "Attendance" },
];

const TEACHER_COLUMNS = [
  { key: "class", header: "Class" },
  { key: "year", header: "Academic year" },
  { key: "role", header: "Role" },
  { key: "actions", header: "Actions" },
];

const STUDENT_COLUMNS = [
  { key: "date", header: "Date" },
  { key: "class", header: "Class" },
  { key: "subject", header: "Subject" },
  { key: "status", header: "Status" },
];

export default async function AttendancePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.role === "institute-admin") {
    const summary = await getInstituteAttendanceSummary();
    const recordedClasses = summary.filter((klass) => klass.percentPresent !== null);
    const instituteAverage = recordedClasses.length ? Math.round(recordedClasses.reduce((total, klass) => total + (klass.percentPresent ?? 0), 0) / recordedClasses.length) : 0;

    const rows: DataTableRow[] = summary.map((klass) => ({
      key: klass.id,
      searchValue: `${klass.name} ${klass.section ?? ""}`,
      cells: [
        <span key="name" className="font-medium">
          {klass.name}
          {klass.section ? ` - ${klass.section}` : ""}
        </span>,
        klass.percentPresent === null ? (
          <span key="attendance" className="text-muted-foreground">
            No records yet
          </span>
        ) : (
          `${klass.percentPresent}%`
        ),
      ],
    }));

    return (
      <div className="flex flex-col gap-6"><WorkspaceHeader eyebrow="Academic monitoring" title="Attendance overview" description="Compare attendance across classes and identify groups that need follow-up before trends become problems." metrics={[{ label: "Institute average", value: `${instituteAverage}%`, detail: "Across recorded classes", tone: "primary" }, { label: "Classes tracked", value: recordedClasses.length, detail: "With attendance records", tone: "success" }, { label: "No records yet", value: summary.length - recordedClasses.length, detail: "Classes awaiting their first register", tone: "warning" }]} /><DataTableCard title="Class attendance" sub="Search a class to review its current attendance percentage." columns={ADMIN_COLUMNS} rows={rows} searchPlaceholder="Search classes..." emptyTitle="No classes yet." /></div>
    );
  }

  if (session.role === "institute-staff") {
    await requireStaffModuleAccess("classes");
    const classes = await listClassesForAttendanceTeacher();
    const classTeacherCount = classes.filter((klass) => klass.isClassTeacher).length;

    const rows: DataTableRow[] = classes.map((klass) => ({
      key: klass.id,
      searchValue: `${klass.name} ${klass.section ?? ""}`,
      cells: [
        <span key="name" className="font-medium">
          {klass.name}
          {klass.section ? ` - ${klass.section}` : ""}
        </span>,
        klass.academicYear,
        <span key="role" className="text-sm text-muted-foreground">
          {klass.isClassTeacher ? "Class teacher" : klass.subjects.map((s) => s.name).join(", ")}
        </span>,
        <Link
          key="action"
          href={`/attendance/${klass.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Mark attendance
        </Link>,
      ],
    }));

    return (
      <div className="flex flex-col gap-6">
        <WorkspaceHeader
          eyebrow="Academic monitoring"
          title="Attendance"
          description="Mark attendance for the classes you teach or manage."
          metrics={[
            { label: "Classes", value: classes.length, detail: "Assigned to you", tone: "primary" },
            { label: "Class teacher of", value: classTeacherCount, detail: "Classes you lead", tone: "success" },
          ]}
        />
        <DataTableCard
          title="Your classes"
          sub="Pick a class to mark today's attendance."
          columns={TEACHER_COLUMNS}
          rows={rows}
          emptyTitle="No classes to mark attendance for yet."
        />
      </div>
    );
  }

  // student
  const { history, percentPresent } = await getMyAttendanceHistory();
  const absentDays = history.filter((entry) => entry.status === "absent").length;

  const rows: DataTableRow[] = history.map((entry, index) => ({
    key: String(index),
    cells: [
      new Date(entry.date).toLocaleDateString(),
      entry.className,
      entry.subjectName ?? "General",
      <span key="status" className="capitalize">
        {entry.status}
      </span>,
    ],
  }));

  return (
    <div className="flex flex-col gap-6">
        <StudentWorkspaceHeader
          eyebrow="Academic insight"
          title="My attendance"
          description="Review your attendance record and spot patterns early, before they affect your academic progress."
          metrics={[
            { label: "Overall attendance", value: `${percentPresent}%`, detail: "Across recorded days", tone: percentPresent >= 75 ? "success" : "warning" },
            { label: "Days recorded", value: history.length, detail: "Class attendance entries", tone: "primary" },
            { label: "Absences", value: absentDays, detail: "Recorded as absent", tone: absentDays > 0 ? "warning" : "info" },
          ]}
        />

        <Card size="sm" className="border-primary/15 bg-primary-subtle/25">
          <CardHeader>
            <CardTitle>Overall attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{percentPresent}%</p>
            <p className="text-sm text-muted-foreground">
              Based on {history.length} recorded {history.length === 1 ? "day" : "days"}.
            </p>
          </CardContent>
        </Card>

        <DataTableCard
          title="Attendance history"
          sub="Your recorded attendance by class and subject."
          columns={STUDENT_COLUMNS}
          rows={rows}
          emptyTitle="No attendance recorded yet."
        />
      </div>
  );
}
