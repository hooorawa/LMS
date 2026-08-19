import Link from "next/link";
import { ClipboardCheck, FileText, GraduationCap, TriangleAlert, Wallet } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getStudentDashboardData } from "@/lib/data/student-dashboard.data";
import { getStudentFeatureSnapshot } from "@/lib/data/feature-plan.data";
import { StatCard } from "@/components/dashboard-shell/stat-card";
import { Panel } from "@/components/dashboard-shell/panel";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { cn } from "@/lib/utils";
import { StudentWorkspaceHeader } from "@/components/student/student-workspace-header";

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function StudentProgressPage() {
  const [session, dashboard, snapshot] = await Promise.all([
    getSession(),
    getStudentDashboardData(),
    getStudentFeatureSnapshot(),
  ]);

  const gradeRows: DataTableRow[] = dashboard.gradeGroups.map((group) => ({
    key: group.courseId || group.courseTitle,
    cells: [
      <span key="course" className="font-medium">
        {group.courseTitle}
      </span>,
      group.itemCount,
      `${group.totalScore.toFixed(1)} / ${group.totalMaxScore.toFixed(1)}`,
      group.percent !== null ? `${group.percent.toFixed(1)}%` : "-",
    ],
  }));

  const attendanceRows: DataTableRow[] = snapshot.attendanceTrend.map((entry, index) => ({
    key: `${entry.date.toISOString()}-${index}`,
    cells: [
      formatDate(entry.date),
      entry.className,
      entry.subjectName ?? "General",
      <Badge
        key="status"
        variant={entry.status === "absent" ? "destructive" : entry.status === "late" ? "warning" : "success"}
        className="capitalize"
      >
        {entry.status}
      </Badge>,
    ],
  }));

  return (
    <div className="flex flex-col gap-6">
      <StudentWorkspaceHeader
        eyebrow="Academic insight"
        title="Progress center"
        description="See your academic momentum, identify what needs attention, and download the documents you need."
        actions={<>
          <a
            href={`/api/reports/report-card/${session?.userId ?? ""}`}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Report card
          </a>
          <a
            href={`/api/reports/enrollment-confirmation/${session?.userId ?? ""}`}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Enrollment confirmation
          </a>
        </>}
        metrics={[
          { label: "Attendance", value: `${dashboard.attendancePercent}%`, detail: "Recorded class attendance", tone: dashboard.attendancePercent >= 75 ? "success" : "warning" },
          { label: "Subjects graded", value: dashboard.gradeGroups.length, detail: "With published results", tone: "primary" },
          { label: "Open deadlines", value: snapshot.upcomingDeadlines.length, detail: `${snapshot.overdueAssignmentCount} overdue`, tone: snapshot.overdueAssignmentCount > 0 ? "warning" : "info" },
        ]}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Attendance"
          icon={ClipboardCheck}
          value={`${dashboard.attendancePercent}%`}
          tone={dashboard.attendancePercent >= 75 ? "success" : "warning"}
        />
        <StatCard
          label="Graded subjects"
          icon={GraduationCap}
          value={dashboard.gradeGroups.length}
          tone="primary"
        />
        <StatCard
          label="Open deadlines"
          icon={FileText}
          value={snapshot.upcomingDeadlines.length}
          sub={`${snapshot.overdueAssignmentCount} overdue`}
          tone={snapshot.overdueAssignmentCount > 0 ? "warning" : "info"}
        />
        <StatCard
          label="Fee balance"
          icon={Wallet}
          value={dashboard.feeBalance.toFixed(2)}
          tone={dashboard.feeBalance > 0 ? "warning" : "success"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="At-risk indicators" sub="Items that may need action soon" className="p-5">
          <div className="mt-4 flex flex-col gap-3">
            {snapshot.atRiskFlags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active risk indicators right now.</p>
            ) : (
              snapshot.atRiskFlags.map((flag) => (
                <div
                  key={flag}
                  className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-subtle/40 px-3 py-2.5"
                >
                  <TriangleAlert className="mt-0.5 size-4 text-warning" />
                  <p className="text-sm text-warning">{flag}</p>
                </div>
              ))
            )}
            {snapshot.nextFeeDue ? (
              <Link
                href="/fees"
                className="rounded-xl border border-border/60 px-3 py-2.5 transition-colors hover:bg-muted/40"
              >
                <p className="text-sm font-medium">{snapshot.nextFeeDue.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Due {formatDate(snapshot.nextFeeDue.dueDate)} · Balance{" "}
                  {snapshot.nextFeeDue.balance.toFixed(2)}
                </p>
              </Link>
            ) : null}
          </div>
        </Panel>

        <Panel title="Upcoming exams and deadlines" sub="Your next academic commitments" className="p-5">
          <div className="mt-4 flex flex-col gap-3">
            {snapshot.upcomingExams.map((exam) => (
              <Link
                key={exam.id}
                href="/exam-registration"
                className="rounded-xl border border-border/60 px-3 py-2.5 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{exam.title}</p>
                  <Badge variant={exam.registrationStatus === "registered" ? "success" : "warning"}>
                    {exam.registrationStatus === "registered" ? "Registered" : "Pending"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {exam.subject} · {formatDateTime(exam.examDate)}
                </p>
              </Link>
            ))}
            {snapshot.upcomingDeadlines.map((deadline) => (
              <Link
                key={deadline.id}
                href={`/my-courses/${deadline.courseId}/assignments/${deadline.id}`}
                className="rounded-xl border border-border/60 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{deadline.title}</p>
                  <Badge variant="outline">Assignment</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {deadline.courseTitle} · Due {formatDateTime(deadline.dueAt)}
                </p>
              </Link>
            ))}
            {snapshot.upcomingExams.length === 0 && snapshot.upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming exams or deadlines.</p>
            ) : null}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DataTableCard
          title="Subject performance"
          sub="Grade history grouped by course or exam subject"
          compact
          columns={[
            { key: "course", header: "Course / Subject" },
            { key: "items", header: "Items" },
            { key: "score", header: "Score" },
            { key: "percent", header: "Percent" },
          ]}
          rows={gradeRows}
          emptyTitle="No grades published yet."
        />

        <DataTableCard
          title="Attendance trend"
          sub="Most recent attendance records"
          compact
          columns={[
            { key: "date", header: "Date" },
            { key: "class", header: "Class" },
            { key: "subject", header: "Subject" },
            { key: "status", header: "Status" },
          ]}
          rows={attendanceRows}
          emptyTitle="No attendance recorded yet."
        />
      </div>

      <Panel title="Teacher feedback" sub="Recent comments from graded assignment submissions" className="p-5">
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {snapshot.recentFeedback.length === 0 ? (
            <p className="text-sm text-muted-foreground">No feedback has been published yet.</p>
          ) : (
            snapshot.recentFeedback.map((feedback) => (
              <div key={feedback.id} className="rounded-xl border border-border/60 px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{feedback.assignmentTitle}</p>
                  {feedback.score !== null ? <Badge variant="success">{feedback.score}</Badge> : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{feedback.courseTitle}</p>
                <p className="mt-2 text-sm text-muted-foreground">{feedback.feedback}</p>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}
