import Link from "next/link";
import { BookOpen, ClipboardCheck, GraduationCap, Users } from "lucide-react";
import { requireStaffModuleAccess } from "@/lib/auth/staff-permissions";
import { cancelClassSession } from "@/lib/actions/class-session.actions";
import { getTeacherWorkspaceData } from "@/lib/data/remaining-plan.data";
import { StatCard } from "@/components/dashboard-shell/stat-card";
import { Panel } from "@/components/dashboard-shell/panel";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { cn } from "@/lib/utils";

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatWeekday(day: string) {
  return day ? `${day.slice(0, 1).toUpperCase()}${day.slice(1)}` : "Day";
}

export default async function TeacherWorkspacePage() {
  await requireStaffModuleAccess("classes");
  const data = await getTeacherWorkspaceData();

  const gradingRows: DataTableRow[] = data.gradingQueue.map((row) => ({
    key: row.id,
    cells: [
      <span key="assignment" className="font-medium">{row.assignmentTitle}</span>,
      row.studentName,
      formatDateTime(row.submittedAt),
      <Link
        key="review"
        href={`/courses/${row.courseId}/assignments/${row.assignmentId}/submissions`}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        Review
      </Link>,
    ],
  }));

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader
        eyebrow="Teaching"
        title="Teacher workspace"
        description="Planner, grading queue, managed classes, student follow-up, and course publishing in one place."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Planner slots" icon={BookOpen} value={data.teachingPlanner.length} tone="primary" />
        <StatCard label="To grade" icon={ClipboardCheck} value={data.gradingQueue.length} tone="warning" />
        <StatCard label="Managed classes" icon={Users} value={data.managedClasses.length} tone="info" />
        <StatCard label="Courses" icon={GraduationCap} value={data.courses.length} tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Weekly planner" sub="Assigned class timetable" className="p-5">
          <div className="mt-4 flex flex-col gap-3">
            {data.teachingPlanner.length === 0 ? (
              <p className="text-sm text-muted-foreground">No planner slots assigned yet.</p>
            ) : (
              data.teachingPlanner.map((slot, index) => (
                <div key={`${slot.className}-${slot.day}-${index}`} className="rounded-xl border border-border/60 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{slot.className}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatWeekday(slot.day)} · {slot.startTime}-{slot.endTime}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {slot.subjectName ?? "Class"}{slot.room ? ` · Room ${slot.room}` : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Managed classes" sub="Class sessions and attendance shortcuts" className="p-5">
          <div className="mt-4 flex flex-col gap-3">
            {data.managedClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground">You are not the class teacher for any class yet.</p>
            ) : (
              data.managedClasses.map((klass) => (
                <div key={klass.id} className="rounded-xl border border-border/60 px-3 py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{klass.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground capitalize">
                        {(klass.sessionStatus ?? "scheduled").replace("-", " ")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/classes/${klass.id}/session`} className={cn(buttonVariants({ size: "sm" }))}>
                        Session
                      </Link>
                      <Link href={`/attendance/${klass.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                        Attendance
                      </Link>
                      <form action={cancelClassSession}>
                        <input type="hidden" name="classId" value={klass.id} />
                        <Button type="submit" variant="outline" size="sm">Cancel</Button>
                      </form>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      <DataTableCard
        title="Central grading queue"
        sub="Assignments waiting for marks and feedback"
        compact
        columns={[
          { key: "assignment", header: "Assignment" },
          { key: "student", header: "Student" },
          { key: "submitted", header: "Submitted" },
          { key: "action", header: "Action" },
        ]}
        rows={gradingRows}
        emptyTitle="No submissions waiting for grading."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Student follow-up" sub="Attendance risks from your classes" className="p-5">
          <div className="mt-4 flex flex-col gap-3">
            {data.atRiskStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attendance follow-ups needed right now.</p>
            ) : (
              data.atRiskStudents.map((student) => (
                <div key={student.studentId} className="rounded-xl border border-border/60 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{student.name}</p>
                    <Badge variant="warning">{student.attendancePercent}% attendance</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{student.className}</p>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Course publishing" sub="Course material and status shortcuts" className="p-5">
          <div className="mt-4 flex flex-col gap-3">
            {data.courses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No courses assigned yet.</p>
            ) : (
              data.courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="rounded-xl border border-border/60 px-3 py-2.5 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{course.title}</p>
                    <Badge variant={course.status === "published" ? "success" : "secondary"} className="capitalize">
                      {course.status}
                    </Badge>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
