import Link from "next/link";
import { redirect } from "next/navigation";
import {
  GraduationCap,
  Users,
  BookOpen,
  ClipboardCheck,
  Building2,
  Activity,
  Wallet,
  FileText,
  Megaphone,
  TrendingDown,
  PiggyBank,
  CreditCard,
  CircleAlert,
} from "lucide-react";
import { getSession } from "@/lib/auth/session";
import {
  getInstituteDashboardCounts,
  getInstituteRecentActivity,
  getTeacherRecentActivity,
  getInstituteClassesOverview,
  getInstituteFinanceSummary,
} from "@/lib/data/dashboard.data";
import { countInstitutes, getPlatformTrends } from "@/lib/data/institute.data";
import { getMrrArr, getOverdueInvoiceTotal, getRevenueTrend } from "@/lib/data/subscription.data";
import { getPlatformAlerts, type PlatformAlertSeverity } from "@/lib/data/platform-alerts.data";
import { getTeacherDashboardData } from "@/lib/data/teacher-dashboard.data";
import { getStudentDashboardData } from "@/lib/data/student-dashboard.data";
import {
  getInstituteAttendanceSummary,
  getAttendanceSummaryForTeacherClasses,
} from "@/lib/data/attendance.data";
import {
  getRecentFeeCollectionSummary,
  listRecentPaymentsForInstitute,
} from "@/lib/data/payment.data";
import {
  getAdminFeatureSnapshot,
  getStudentFeatureSnapshot,
  getTeacherFeatureSnapshot,
} from "@/lib/data/feature-plan.data";
import { StatCard } from "@/components/dashboard-shell/stat-card";
import { Panel } from "@/components/dashboard-shell/panel";
import { AttendanceChart } from "@/components/dashboard-shell/attendance-chart";
import { TrendChart } from "@/components/dashboard-shell/trend-chart";
import { ActivityFeed, type ActivityItem } from "@/components/dashboard-shell/activity-feed";
import { AttentionList } from "@/components/dashboard-shell/attention-list";
import { Badge } from "@/components/ui/badge";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { StudentHome } from "@/components/student/student-home";
import { requireStaffModuleAccess } from "@/lib/auth/staff-permissions";

function formatRelativeTime(date: Date) {
  const seconds = Math.round((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

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

function formatWeekday(day: string) {
  return day ? `${day.slice(0, 1).toUpperCase()}${day.slice(1)}` : "Day";
}

const ACTIVITY_ICON = {
  teacher: GraduationCap,
  student: Users,
  subject: ClipboardCheck,
  class: BookOpen,
  institute: Building2,
  attendance: ClipboardCheck,
  exam: FileText,
  marks: FileText,
  fee: Wallet,
  payment: Wallet,
  announcement: Megaphone,
} as const;

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "institute-admin") {
    const [
      counts,
      activity,
      classesOverview,
      attendanceSummary,
      feeSummary,
      recentPayments,
      financeSummary,
      featureSnapshot,
    ] = await Promise.all([
      getInstituteDashboardCounts(),
      getInstituteRecentActivity(),
      getInstituteClassesOverview(),
      getInstituteAttendanceSummary(),
      getRecentFeeCollectionSummary(),
      listRecentPaymentsForInstitute(5),
      getInstituteFinanceSummary(),
      getAdminFeatureSnapshot(),
    ]);

    const activityItems: ActivityItem[] = activity.map((entry) => {
      const entity = entry.action.split(".")[0] as keyof typeof ACTIVITY_ICON;
      return {
        icon: ACTIVITY_ICON[entity] ?? Activity,
        title: entry.actorName,
        detail: entry.summary,
        meta: formatRelativeTime(entry.createdAt),
      };
    });

    const classRows: DataTableRow[] = classesOverview.map((cls) => ({
      key: cls.id,
      cells: [
        cls.section ? `${cls.name} ${cls.section}` : cls.name,
        cls.classTeacherName,
        cls.academicYear,
        `${cls.studentCount} students`,
        <Link
          key="action"
          href={`/classes/${cls.id}/edit`}
          className="text-xs font-semibold text-success"
        >
          Edit
        </Link>,
      ],
    }));

    const paymentRows: DataTableRow[] = recentPayments.map((payment) => ({
      key: String(payment._id),
      cells: [
        (payment.studentId as unknown as { name?: string } | null)?.name ?? "Unknown",
        payment.amount.toFixed(2),
        new Date(payment.paymentDate).toLocaleDateString(),
      ],
    }));

    const coverageRows: DataTableRow[] = featureSnapshot.timetableCoverage.map((row) => ({
      key: row.id,
      cells: [row.className, row.classTeacher, row.academicYear, row.slotCount],
    }));
    const adminAttentionItems = [
      featureSnapshot.financeSignals.overdueFees > 0
        ? {
            id: "overdue-fees",
            title: "Overdue fee collection needs action",
            detail: `${featureSnapshot.financeSignals.overdueFees} fee item${
              featureSnapshot.financeSignals.overdueFees === 1 ? "" : "s"
            } remain overdue across the institute.`,
            badge: featureSnapshot.financeSignals.overdueAmount.toFixed(2),
            href: "/fees",
          }
        : null,
      featureSnapshot.financeSignals.unassignedSubjects > 0
        ? {
            id: "unassigned-subjects",
            title: "Subjects are missing teacher owners",
            detail: `${featureSnapshot.financeSignals.unassignedSubjects} subject${
              featureSnapshot.financeSignals.unassignedSubjects === 1 ? "" : "s"
            } still need a teacher assignment.`,
            badge: String(featureSnapshot.financeSignals.unassignedSubjects),
            href: "/subjects",
          }
        : null,
      featureSnapshot.financeSignals.unassignedClasses > 0
        ? {
            id: "unassigned-classes",
            title: "Classes are missing class teachers",
            detail: `${featureSnapshot.financeSignals.unassignedClasses} class${
              featureSnapshot.financeSignals.unassignedClasses === 1 ? "" : "es"
            } need a class teacher.`,
            badge: String(featureSnapshot.financeSignals.unassignedClasses),
            href: "/classes",
          }
        : null,
      featureSnapshot.upcomingExams.length > 0
        ? {
            id: "upcoming-exams",
            title: "Upcoming exams should be reviewed",
            detail: `${featureSnapshot.upcomingExams.length} exam${
              featureSnapshot.upcomingExams.length === 1 ? "" : "s"
            } are on the near-term calendar.`,
            badge: formatDate(featureSnapshot.upcomingExams[0].examDate),
            badgeVariant: "secondary" as const,
            href: "/exams",
          }
        : null,
    ].filter((value): value is NonNullable<typeof value> => Boolean(value));

    return (
      <>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Teachers" icon={GraduationCap} value={counts.teachers} tone="primary" />
          <StatCard label="Students" icon={Users} value={counts.students} tone="info" />
          <StatCard label="Classes" icon={BookOpen} value={counts.classes} tone="success" />
          <StatCard label="Subjects" icon={ClipboardCheck} value={counts.subjects} tone="warning" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Fees collected (30d)"
            icon={Wallet}
            value={feeSummary.totalCollected.toFixed(2)}
            sub={`${feeSummary.paymentCount} payment${feeSummary.paymentCount === 1 ? "" : "s"}`}
            tone="success"
          />
          <StatCard
            label="Total revenue"
            icon={Wallet}
            value={financeSummary.totalRevenue.toFixed(2)}
            tone="info"
          />
          <StatCard
            label="Expenses + salary"
            icon={TrendingDown}
            value={(financeSummary.totalExpenses + financeSummary.totalSalary).toFixed(2)}
            tone="warning"
          />
          <StatCard
            label="Net income"
            icon={PiggyBank}
            value={financeSummary.netIncome.toFixed(2)}
            tone="primary"
          />
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <AttendanceChart
            title="Attendance overview"
            sub="Percent present per class"
            rows={attendanceSummary.map((row) => ({
              id: row.id,
              name: row.section ? `${row.name} ${row.section}` : row.name,
              percentPresent: row.percentPresent,
            }))}
          />
          <ActivityFeed
            title="Recent activity"
            sub="Latest changes across your institute"
            items={activityItems}
          />
        </div>

        <DataTableCard
          title="Classes"
          sub="Overview of your most recently created classes"
          compact
          columns={[
            { key: "name", header: "Class" },
            { key: "teacher", header: "Class Teacher" },
            { key: "year", header: "Academic Year" },
            { key: "students", header: "Students" },
            { key: "action", header: "Action" },
          ]}
          rows={classRows}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <AttentionList
            title="Needs attention"
            sub="Operational and academic issues to resolve next"
            items={adminAttentionItems}
            emptyLabel="No urgent admin issues are active right now."
          />

          <Panel
            title="Academic control center"
            sub="Upcoming term activity, holidays, exams, and deadlines"
            className="p-5"
            action={
              <Link href="/calendar" className="text-xs font-semibold text-success">
                Open calendar &rarr;
              </Link>
            }
          >
            <div className="mt-4 flex flex-col gap-3">
              {featureSnapshot.academicEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming academic events scheduled.</p>
              ) : (
                featureSnapshot.academicEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(event.startsAt)}</p>
                    </div>
                    <Badge
                      variant={
                        event.type === "exam"
                          ? "warning"
                          : event.type === "holiday"
                            ? "secondary"
                            : "default"
                      }
                      className="capitalize"
                    >
                      {event.type}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel title="Operations signals" sub="Coverage and finance items that need attention" className="p-5">
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">Overdue fees</p>
                <p className="mt-1 text-xl font-semibold">{featureSnapshot.financeSignals.overdueFees}</p>
                <p className="text-xs text-muted-foreground">
                  {featureSnapshot.financeSignals.overdueAmount.toFixed(2)} outstanding
                </p>
              </div>
              <div className="rounded-xl border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">Subjects without teacher</p>
                <p className="mt-1 text-xl font-semibold">{featureSnapshot.financeSignals.unassignedSubjects}</p>
              </div>
              <div className="rounded-xl border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">Classes without teacher</p>
                <p className="mt-1 text-xl font-semibold">{featureSnapshot.financeSignals.unassignedClasses}</p>
              </div>
              <div className="rounded-xl border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">Upcoming exams</p>
                <p className="mt-1 text-xl font-semibold">{featureSnapshot.upcomingExams.length}</p>
              </div>
            </div>
          </Panel>
        </div>

        <DataTableCard
          title="Timetable coverage"
          sub="Classes, assigned teachers, and configured schedule slots"
          compact
          columns={[
            { key: "class", header: "Class" },
            { key: "teacher", header: "Teacher" },
            { key: "year", header: "Academic Year" },
            { key: "slots", header: "Slots" },
          ]}
          rows={coverageRows}
          emptyTitle="No classes configured yet."
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Panel title="Upcoming exams" sub="Scheduled institute assessments" className="p-5">
            <div className="mt-4 flex flex-col gap-3">
              {featureSnapshot.upcomingExams.length === 0 ? (
                <p className="text-sm text-muted-foreground">No exams scheduled.</p>
              ) : (
                featureSnapshot.upcomingExams.map((exam) => (
                  <div key={exam.id} className="rounded-xl border border-border/60 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{exam.title}</p>
                      <span className="text-xs text-muted-foreground">{formatDate(exam.examDate)}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {exam.subjectName} Â· {exam.className}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel title="Recent announcements" sub="Latest published institute communication" className="p-5">
            <div className="mt-4 flex flex-col gap-3">
              {featureSnapshot.recentAnnouncements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No announcements published yet.</p>
              ) : (
                featureSnapshot.recentAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="rounded-xl border border-border/60 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{announcement.title}</p>
                      <Badge variant="outline" className="capitalize">
                        {announcement.audience}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Published {formatDateTime(announcement.publishedAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>

        <DataTableCard
          title="Recent payments"
          sub="Latest fee payments recorded across your institute"
          compact
          columns={[
            { key: "student", header: "Student" },
            { key: "amount", header: "Amount" },
            { key: "date", header: "Date" },
          ]}
          rows={paymentRows}
          emptyTitle="No payments recorded yet."
        />
      </>
    );
  }

  if (session.role === "institute-staff") {
    await requireStaffModuleAccess("dashboard");

    const [data, activity, attendanceSummary, featureSnapshot] = await Promise.all([
      getTeacherDashboardData(),
      getTeacherRecentActivity(),
      getAttendanceSummaryForTeacherClasses(),
      getTeacherFeatureSnapshot(),
    ]);

    const rows: DataTableRow[] = data.rows.map((row) => ({
      key: row.id,
      cells: [
        <span key="class" className="flex items-center gap-2">
          {row.className}
          {row.isClassTeacher ? <Badge variant="success">Class teacher</Badge> : null}
        </span>,
        row.subjectName,
        row.academicYear,
      ],
    }));

    const activityItems: ActivityItem[] = activity.map((entry) => {
      const entity = entry.action.split(".")[0] as keyof typeof ACTIVITY_ICON;
      return {
        icon: ACTIVITY_ICON[entity] ?? Activity,
        title: entry.actorName,
        detail: entry.summary,
        meta: formatRelativeTime(entry.createdAt),
      };
    });

    const gradingRows: DataTableRow[] = featureSnapshot.gradingQueue.map((row) => ({
      key: row.id,
      cells: [
        row.assignmentTitle,
        row.studentName,
        formatDateTime(row.submittedAt),
        <Link
          key="action"
          href={`/courses/${row.courseId}/assignments/${row.assignmentId}/submissions`}
          className="text-xs font-semibold text-success"
        >
          Review
        </Link>,
      ],
    }));
    const teacherAttentionItems = [
      featureSnapshot.gradingQueue.length > 0
        ? {
            id: "grading-queue",
            title: "Submissions are waiting for feedback",
            detail: `${featureSnapshot.gradingQueue.length} submission${
              featureSnapshot.gradingQueue.length === 1 ? "" : "s"
            } are still ungraded.`,
            badge: String(featureSnapshot.gradingQueue.length),
            href: "/grading",
          }
        : null,
      featureSnapshot.atRiskStudents.length > 0
        ? {
            id: "at-risk-students",
            title: "Attendance follow-up is needed",
            detail: `${featureSnapshot.atRiskStudents.length} student${
              featureSnapshot.atRiskStudents.length === 1 ? "" : "s"
            } are below the attendance target.`,
            badge: `${featureSnapshot.atRiskStudents[0].attendancePercent}%`,
            href: "/student-followups",
          }
        : null,
      featureSnapshot.upcomingAssessments.length > 0
        ? {
            id: "upcoming-assessments",
            title: "Assessments are approaching",
            detail: `${featureSnapshot.upcomingAssessments.length} assessment${
              featureSnapshot.upcomingAssessments.length === 1 ? "" : "s"
            } are coming up soon.`,
            badge: formatDate(featureSnapshot.upcomingAssessments[0].date),
            badgeVariant: "secondary" as const,
            href: "/courses",
          }
        : null,
      featureSnapshot.teachingPlanner.length === 0
        ? {
            id: "no-planner",
            title: "No timetable slots are assigned yet",
            detail: "Review class and subject assignments so your weekly teaching planner is populated.",
            href: "/my-classes",
          }
        : null,
    ].filter((value): value is NonNullable<typeof value> => Boolean(value));

    return (
      <>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="My Classes" icon={BookOpen} value={data.classCount} tone="primary" />
          <StatCard label="My Subjects" icon={ClipboardCheck} value={data.subjectCount} tone="info" />
          <StatCard label="Total Students" icon={Users} value={data.studentCount} tone="success" />
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <AttendanceChart
            title="Attendance overview"
            sub="Percent present across your classes"
            rows={attendanceSummary}
          />
          <ActivityFeed
            title="Recent activity"
            sub="Your recent actions"
            items={activityItems}
            emptyLabel="No recent activity yet."
          />
        </div>

        <AttentionList
          title="Needs attention"
          sub="Teaching work that is ready for your next action"
          items={teacherAttentionItems}
          emptyLabel="Your queue is under control right now."
        />

        <DataTableCard
          title="My classes & subjects"
          sub="Everywhere you teach or act as class teacher"
          compact
          columns={[
            { key: "class", header: "Class" },
            { key: "subject", header: "Subject" },
            { key: "year", header: "Academic Year" },
          ]}
          rows={rows}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Panel
            title="Weekly teaching planner"
            sub="Your assigned timetable across classes and subjects"
            className="p-5"
            action={
              <Link href="/my-classes" className="text-xs font-semibold text-success">
                Open classes &rarr;
              </Link>
            }
          >
            <div className="mt-4 flex flex-col gap-3">
              {featureSnapshot.teachingPlanner.length === 0 ? (
                <p className="text-sm text-muted-foreground">No timetable slots assigned yet.</p>
              ) : (
                featureSnapshot.teachingPlanner.slice(0, 8).map((slot, index) => (
                  <div
                    key={`${slot.className}-${slot.subjectName}-${slot.day}-${index}`}
                    className="rounded-xl border border-border/60 px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{slot.className}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatWeekday(slot.day)} Â· {slot.startTime}-{slot.endTime}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {slot.subjectName ?? "Lesson"}{slot.room ? ` Â· Room ${slot.room}` : ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel title="Students needing follow-up" sub="Low attendance signals across your classes" className="p-5">
            <div className="mt-4 flex flex-col gap-3">
              {featureSnapshot.atRiskStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No students are currently below the attendance target.</p>
              ) : (
                featureSnapshot.atRiskStudents.map((student) => (
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
        </div>

        <DataTableCard
          title="Central grading queue"
          sub="Ungraded submissions waiting for your review"
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

        <Panel title="Upcoming assessments" sub="Exams and assignment deadlines coming up next" className="p-5">
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {featureSnapshot.upcomingAssessments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming assessments.</p>
            ) : (
              featureSnapshot.upcomingAssessments.map((item) => (
                <div key={`${item.kind}-${item.id}`} className="rounded-xl border border-border/60 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{item.title}</p>
                    <Badge variant={item.kind === "exam" ? "warning" : "default"} className="capitalize">
                      {item.kind}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.subjectName} Â· {item.className}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(item.date)}</p>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Recent announcements" sub="Communication you published recently" className="p-5">
          <div className="mt-4 flex flex-col gap-3">
            {featureSnapshot.recentAnnouncements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No announcements created yet.</p>
            ) : (
              featureSnapshot.recentAnnouncements.map((announcement) => (
                <div key={announcement.id} className="rounded-xl border border-border/60 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{announcement.title}</p>
                    <Badge variant="outline" className="capitalize">
                      {announcement.audience}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Published {formatDateTime(announcement.publishedAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </Panel>
      </>
    );
  }

  if (session.role === "super-admin") {
    const [instituteCount, trends, metrics, overdueTotal, revenueTrend, alerts] = await Promise.all([
      countInstitutes(),
      getPlatformTrends(),
      getMrrArr(),
      getOverdueInvoiceTotal(),
      getRevenueTrend(),
      getPlatformAlerts(),
    ]);
    const ALERT_BADGE_VARIANT: Record<PlatformAlertSeverity, "destructive" | "warning" | "secondary"> = {
      critical: "destructive",
      warning: "warning",
      info: "secondary",
    };
    const criticalAlertCount = alerts.filter((alert) => alert.severity === "critical").length;
    const warningAlertCount = alerts.filter((alert) => alert.severity === "warning").length;
    const revenueSparkline = revenueTrend.map((point) => point.totalPaid);
    const platformAttentionItems = alerts.slice(0, 5).map((alert) => ({
      id: alert.id,
      title: alert.title,
      detail: alert.description,
      badge: alert.severity,
      badgeVariant: ALERT_BADGE_VARIANT[alert.severity],
      href: alert.href,
    }));

    return (
      <>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard label="Institutes" icon={Building2} value={instituteCount} tone="primary" />
          <StatCard
            label="MRR"
            icon={CreditCard}
            value={`$${metrics.mrr.toFixed(2)}`}
            tone="success"
            trend={revenueSparkline}
          />
          <StatCard
            label="ARR"
            icon={CreditCard}
            value={`$${metrics.arr.toFixed(2)}`}
            tone="info"
            trend={revenueSparkline}
          />
          <StatCard
            label="Overdue total"
            icon={CircleAlert}
            value={`$${overdueTotal.totalAmount.toFixed(2)}`}
            sub={`${overdueTotal.count} invoice${overdueTotal.count === 1 ? "" : "s"}`}
            tone="warning"
          />
          <StatCard
            label="Critical alerts"
            icon={CircleAlert}
            value={criticalAlertCount}
            sub={`${warningAlertCount} warning${warningAlertCount === 1 ? "" : "s"}`}
            tone={criticalAlertCount > 0 ? "warning" : "success"}
          />
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <TrendChart
            title="New institutes"
            sub="Signups over the last 6 months"
            data={trends.map((point) => ({ label: point.month, value: point.institutesCreated }))}
            color="var(--color-chart-2)"
            emptyLabel="No institute signups yet."
          />

          <Panel title="Welcome" sub="Manage every institute on the platform" className="flex-1 p-6">
            <Link href="/institutes" className="mt-3 inline-block text-sm font-semibold text-success">
              Manage institutes &rarr;
            </Link>
          </Panel>
        </div>

        <TrendChart
          title="Revenue trend"
          sub="Paid invoices over the last 6 months"
          data={revenueTrend.map((point) => ({ label: point.month, value: point.totalPaid }))}
          format="currency"
          emptyLabel="No paid invoices yet."
          action={
            <Link href="/billing" className="text-xs font-semibold text-success">
              View billing &rarr;
            </Link>
          }
        />

        <AttentionList
          title="Needs attention"
          sub="The platform issues most likely to need intervention next"
          items={platformAttentionItems}
          emptyLabel="No platform alerts are active."
        />

        <Panel title="Alerts" sub="Operational signals across the platform" className="p-5">
          {alerts.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No active alerts.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {alerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={alert.href}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{alert.description}</p>
                  </div>
                  <Badge variant={ALERT_BADGE_VARIANT[alert.severity]} className="capitalize shrink-0">
                    {alert.severity}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </>
    );
  }

  const [studentData, featureSnapshot] = await Promise.all([
    getStudentDashboardData(),
    getStudentFeatureSnapshot(),
  ]);

  return <StudentHome dashboard={studentData} snapshot={featureSnapshot} />;
}
