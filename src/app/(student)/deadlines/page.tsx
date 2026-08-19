import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { getStudentDeadlinesData } from "@/lib/data/remaining-plan.data";
import { Panel } from "@/components/dashboard-shell/panel";
import { Badge } from "@/components/ui/badge";
import { StudentWorkspaceHeader } from "@/components/student/student-workspace-header";

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function DeadlinesPage() {
  const data = await getStudentDeadlinesData();
  const attentionReminders = data.reminders.filter((reminder) => reminder.tone === "warning").length;
  const upcomingItems = data.assignments.length + data.exams.length + data.events.length;

  return (
    <div className="flex flex-col gap-6">
      <StudentWorkspaceHeader
        eyebrow="Learning planner"
        title="Deadlines"
        description="Keep assignments, exams, and class events in one calm, date-ordered view so you always know what comes next."
        metrics={[
          { label: "Open reminders", value: data.reminders.length, detail: "Automatic alerts", tone: "primary" },
          { label: "Needs attention", value: attentionReminders, detail: "Upcoming items needing action", tone: attentionReminders > 0 ? "warning" : "success" },
          { label: "Coming up", value: upcomingItems, detail: "Assignments, exams, and events", tone: "info" },
        ]}
      />

      <Panel title="Automatic reminders" sub="Generated from open assignments and upcoming exams" className="p-5">
        <div className="mt-4 flex flex-col gap-3">
          {data.reminders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reminders are active right now.</p>
          ) : (
            data.reminders.map((reminder) => (
              <div key={reminder.id} className="flex items-start gap-3 rounded-xl border border-border/60 px-3 py-2.5">
                <CalendarClock className="mt-0.5 size-4 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{reminder.title}</p>
                    <Badge variant={reminder.tone}>{formatDateTime(reminder.date)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{reminder.detail}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Assignments" sub="Submission deadlines from enrolled courses" className="p-5">
          <div className="mt-4 flex flex-col gap-3">
            {data.assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assignment deadlines.</p>
            ) : (
              data.assignments.map((assignment) => (
                <Link
                  key={assignment.id}
                  href={`/my-courses/${assignment.courseId}/assignments/${assignment.id}`}
                  className="rounded-xl border border-border/60 px-3 py-2.5 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{assignment.title}</p>
                    <Badge variant="warning">Due</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {assignment.courseTitle} · {formatDateTime(assignment.dueAt)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Exams and academic events" sub="Exam schedule, class changes, and calendar deadlines" className="p-5">
          <div className="mt-4 flex flex-col gap-3">
            {data.exams.map((exam) => (
              <Link
                key={`exam-${exam.id}`}
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
            {data.events.map((event) => (
              <Link
                key={`event-${event.id}`}
                href="/calendar"
                className="rounded-xl border border-border/60 px-3 py-2.5 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{event.title}</p>
                  <Badge variant="outline" className="capitalize">
                    {event.type}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(event.startsAt)}</p>
              </Link>
            ))}
            {data.exams.length === 0 && data.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming exam or calendar deadlines.</p>
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
