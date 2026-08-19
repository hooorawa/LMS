import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Wallet,
} from "lucide-react";
import type { StudentFeatureSnapshot } from "@/lib/data/feature-plan.data";
import type { UpcomingAssignmentRow } from "@/lib/data/student-dashboard.data";
import { AttentionList } from "@/components/dashboard-shell/attention-list";
import { Panel } from "@/components/dashboard-shell/panel";
import { StatCard } from "@/components/dashboard-shell/stat-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

type StudentHomeData = {
  courseCount: number;
  activeCourseCount: number;
  averageCourseProgress: number;
  upcomingAssignments: UpcomingAssignmentRow[];
  attendancePercent: number;
  feeBalance: number;
  unreadNotificationCount: number;
  gradeGroups: Array<{ courseId: string | null; courseTitle: string; percent: number | null }>;
};

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

export function StudentHome({
  dashboard,
  snapshot,
}: {
  dashboard: StudentHomeData;
  snapshot: StudentFeatureSnapshot;
}) {
  const pendingExamRegistrations = snapshot.upcomingExams.filter(
    (exam) => exam.registrationStatus === "not-registered"
  ).length;

  const focusCards: Array<{
    title: string;
    href: string;
    detail: string;
    badge: string;
    icon: typeof BookOpen;
    variant: BadgeVariant;
  }> = [
    {
      title: "My Courses",
      href: "/my-courses",
      detail:
        dashboard.courseCount > 0
          ? `${dashboard.activeCourseCount} active course${dashboard.activeCourseCount === 1 ? "" : "s"} with ${dashboard.averageCourseProgress}% average progress.`
          : "Your assigned courses, lessons, and progress.",
      badge: dashboard.courseCount > 0 ? `${dashboard.courseCount} enrolled` : "Start here",
      icon: BookOpen,
      variant: "default" as const,
    },
    {
      title: "My Classes",
      href: "/my-classes",
      detail:
        snapshot.timetable.length > 0
          ? `${snapshot.timetable.length} timetable slot${snapshot.timetable.length === 1 ? "" : "s"} ready this week.`
          : "See your class, timetable, and live access.",
      badge: snapshot.timetable.length > 0 ? "Timetable ready" : "No slots yet",
      icon: CalendarDays,
      variant: "secondary" as const,
    },
    {
      title: "Exam Registration",
      href: "/exam-registration",
      detail:
        snapshot.upcomingExams.length > 0
          ? `${pendingExamRegistrations} exam registration${pendingExamRegistrations === 1 ? "" : "s"} still open.`
          : "Register for assessments and review dates.",
      badge: snapshot.upcomingExams.length > 0 ? `${snapshot.upcomingExams.length} upcoming` : "No exams",
      icon: FileText,
      variant: pendingExamRegistrations > 0 ? "warning" : "success",
    },
    {
      title: "Fees Due",
      href: "/fees",
      detail:
        dashboard.feeBalance > 0
          ? `Outstanding balance of ${dashboard.feeBalance.toFixed(2)} with receipts and statements in one place.`
          : "Your fee record, history, and downloadable statements.",
      badge: dashboard.feeBalance > 0 ? "Payment due" : "Up to date",
      icon: Wallet,
      variant: dashboard.feeBalance > 0 ? "warning" : "success",
    },
    {
      title: "Upcoming Deadlines",
      href: "/deadlines",
      detail:
        snapshot.upcomingDeadlines.length > 0
          ? `${snapshot.upcomingDeadlines.length} open deadline${snapshot.upcomingDeadlines.length === 1 ? "" : "s"} and ${snapshot.overdueAssignmentCount} overdue task${snapshot.overdueAssignmentCount === 1 ? "" : "s"}.`
          : "Assignments, exams, and reminders ordered by urgency.",
      badge:
        snapshot.overdueAssignmentCount > 0
          ? `${snapshot.overdueAssignmentCount} overdue`
          : snapshot.upcomingDeadlines.length > 0
            ? `${snapshot.upcomingDeadlines.length} coming up`
            : "Clear",
      icon: ClipboardCheck,
      variant: snapshot.overdueAssignmentCount > 0 ? "warning" : "secondary",
    },
  ];
  const attentionItems = [
    ...snapshot.atRiskFlags.map((flag, index) => ({
      id: `flag-${index}`,
      title: "Attention needed",
      detail: flag,
      href:
        flag.toLowerCase().includes("attendance")
          ? "/attendance"
          : flag.toLowerCase().includes("assignment")
            ? "/deadlines"
            : "/fees",
    })),
    ...(pendingExamRegistrations > 0
      ? [
          {
            id: "exam-registration",
            title: "Exam registration is still open",
            detail: `${pendingExamRegistrations} exam registration${
              pendingExamRegistrations === 1 ? "" : "s"
            } still need your decision.`,
            badge: String(pendingExamRegistrations),
            href: "/exam-registration",
          },
        ]
      : []),
    ...(dashboard.unreadNotificationCount > 0
      ? [
          {
            id: "notifications",
            title: "Unread updates are waiting",
            detail: `${dashboard.unreadNotificationCount} unread notification${
              dashboard.unreadNotificationCount === 1 ? "" : "s"
            } may contain important institute updates.`,
            badge: String(dashboard.unreadNotificationCount),
            badgeVariant: "secondary" as const,
            href: "/notifications",
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <Panel className="overflow-hidden p-0">
        <div className="bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--color-student,oklch(0.6_0.19_35)),white_70%),transparent_52%),linear-gradient(135deg,color-mix(in_oklch,var(--color-student,oklch(0.6_0.19_35)),white_87%),transparent_68%)] px-6 py-6 sm:px-7 sm:py-7">
          <div className="grid gap-6 xl:grid-cols-[1.35fr_.95fr] xl:items-end">
            <div>
              <p className="text-eyebrow text-primary">Student home</p>
              <h1 className="text-heading mt-2 text-3xl sm:text-[2.1rem]">
                Everything important, in one place.
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Jump into your courses, check classes, register for exams, stay ahead of fees, and keep deadlines under control.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/my-courses" className={buttonVariants({ size: "sm" })}>
                  Continue learning
                </Link>
                <Link href="/deadlines" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Review deadlines
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              <StatCard
                label="Courses"
                icon={BookOpen}
                value={dashboard.courseCount}
                sub={`${dashboard.averageCourseProgress}% average progress`}
                tone="primary"
              />
              <StatCard
                label="Attendance"
                icon={ClipboardCheck}
                value={`${dashboard.attendancePercent}%`}
                sub={snapshot.atRiskFlags.length > 0 ? "Needs attention" : "On track"}
                tone={dashboard.attendancePercent >= 75 ? "success" : "warning"}
              />
              <StatCard
                label="Unread"
                icon={Bell}
                value={dashboard.unreadNotificationCount}
                sub="Institute notifications"
                tone="info"
              />
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {focusCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription className="mt-1">{card.detail}</CardDescription>
                  </div>
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-[1.1rem] bg-primary-subtle text-primary">
                    <Icon className="size-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Badge variant={card.variant}>{card.badge}</Badge>
              </CardContent>
              <CardFooter>
                <Link href={card.href} className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Open
                  <ArrowRight className="size-4" />
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <AttentionList
          title="Needs attention"
          sub="The quickest actions to keep you on track"
          items={attentionItems}
          emptyLabel="You're caught up right now."
        />

        <Panel
          title="Continue learning"
          sub="Your quickest way back into active study"
          className="p-5"
          action={
            <Link href="/my-courses" className="text-xs font-semibold text-success">
              Open courses &rarr;
            </Link>
          }
        >
          <div className="mt-4 flex flex-col gap-3">
            {snapshot.continueLearning.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active courses yet.</p>
            ) : (
              snapshot.continueLearning.map((course) => (
                <Link
                  key={course.enrollmentId}
                  href={`/my-courses/${course.courseId}`}
                  className="rounded-xl border border-border/60 px-3 py-2.5 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{course.title}</p>
                    <Badge variant="secondary">{course.percentComplete}%</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground capitalize">{course.status}</p>
                </Link>
              ))
            )}
          </div>
        </Panel>

        <Panel title="My classes and deadlines" sub="Your next study commitments" className="p-5 xl:col-span-2">
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Next class slots
              </p>
              {snapshot.timetable.length === 0 ? (
                <p className="text-sm text-muted-foreground">No timetable configured yet.</p>
              ) : (
                snapshot.timetable.slice(0, 4).map((slot, index) => (
                  <div key={`${slot.day}-${slot.startTime}-${index}`} className="rounded-xl border border-border/60 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{slot.className}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatWeekday(slot.day)} {slot.startTime}-{slot.endTime}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {slot.subjectName ?? "Class session"}{slot.room ? ` · Room ${slot.room}` : ""}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Next deadlines
              </p>
              {dashboard.upcomingAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing due soon.</p>
              ) : (
                dashboard.upcomingAssignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-xl border border-border/60 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{assignment.title}</p>
                      <Badge variant="outline">Assignment</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {assignment.courseTitle} · Due {formatDateTime(assignment.dueAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel
          title="Exam registration"
          sub="Upcoming assessments and registration status"
          className="p-5 xl:col-span-2"
          action={
            <Link href="/exam-registration" className="text-xs font-semibold text-success">
              Manage exams &rarr;
            </Link>
          }
        >
          <div className="mt-4 flex flex-col gap-3">
            {snapshot.upcomingExams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming exams scheduled.</p>
            ) : (
              snapshot.upcomingExams.slice(0, 5).map((exam) => (
                <Link
                  key={exam.id}
                  href="/exam-registration"
                  className="rounded-xl border border-border/60 px-3 py-2.5 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{exam.title}</p>
                    <Badge variant={exam.registrationStatus === "registered" ? "success" : "warning"}>
                      {exam.registrationStatus === "registered" ? "Registered" : "Action needed"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {exam.subject} · {formatDateTime(exam.examDate)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </Panel>

        <Panel
          title="Fee status"
          sub="Balance and next due item"
          className="p-5"
          action={
            <Link href="/fees" className="text-xs font-semibold text-success">
              Open fees &rarr;
            </Link>
          }
        >
          <div className="mt-4 flex flex-col gap-3">
            <div className="rounded-xl border border-border/60 px-3 py-3">
              <p className="text-xs text-muted-foreground">Current balance</p>
              <p className="mt-1 text-2xl font-semibold">{dashboard.feeBalance.toFixed(2)}</p>
            </div>
            {snapshot.nextFeeDue ? (
              <div className="rounded-xl border border-border/60 px-3 py-2.5">
                <p className="text-sm font-medium">{snapshot.nextFeeDue.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Due {formatDate(snapshot.nextFeeDue.dueDate)} · Balance {snapshot.nextFeeDue.balance.toFixed(2)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No pending fee items right now.</p>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel
          title="Academic progress"
          sub="A quick read on your recent graded courses"
          className="p-5"
          action={
            <Link href="/progress" className="text-xs font-semibold text-success">
              Open progress center &rarr;
            </Link>
          }
        >
          <div className="mt-4 flex flex-col gap-3">
            {dashboard.gradeGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No grades published yet.</p>
            ) : (
              dashboard.gradeGroups.slice(0, 5).map((group) => (
                <div key={group.courseId || group.courseTitle} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{group.courseTitle}</p>
                    <p className="text-xs text-muted-foreground">Graded work</p>
                  </div>
                  <Badge variant={group.percent !== null && group.percent >= 75 ? "success" : "secondary"}>
                    {group.percent !== null ? `${group.percent.toFixed(1)}%` : "Pending"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Announcements and alerts" sub="The latest updates addressed to you" className="p-5">
          <div className="mt-4 flex flex-col gap-3">
            {snapshot.recentAnnouncements.map((announcement) => (
              <div key={`announcement-${announcement.id}`} className="rounded-xl border border-border/60 px-3 py-2.5">
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
            ))}
            {snapshot.recentNotifications.map((notification) => (
              <div key={`notification-${notification.id}`} className="rounded-xl border border-border/60 px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <Badge variant={notification.isRead ? "secondary" : "default"}>
                    {notification.isRead ? "Read" : "Unread"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground capitalize">
                  {notification.type} · {formatDateTime(notification.createdAt)}
                </p>
              </div>
            ))}
            {snapshot.recentAnnouncements.length === 0 && snapshot.recentNotifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages waiting for you.</p>
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
