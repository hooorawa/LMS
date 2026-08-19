import Link from "next/link";
import { BookOpen, ClipboardCheck, GraduationCap, Users, Wallet } from "lucide-react";
import { getAdminOperationsData } from "@/lib/data/remaining-plan.data";
import { StatCard } from "@/components/dashboard-shell/stat-card";
import { Panel } from "@/components/dashboard-shell/panel";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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

export default async function AdminOperationsPage() {
  const data = await getAdminOperationsData();

  const capacityRows: DataTableRow[] = data.capacity.map((row) => ({
    key: row.id,
    cells: [
      <span key="class" className="font-medium">{row.name}</span>,
      row.academicYear,
      row.teacher,
      row.slotCount,
      <Link key="edit" href={`/classes/${row.id}/edit`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
        Manage
      </Link>,
    ],
  }));

  const workloadRows: DataTableRow[] = data.staffWorkload.map((row) => ({
    key: row.id,
    cells: [
      <span key="staff" className="font-medium">{row.name}</span>,
      row.subjects,
      row.classTeacherOf,
      row.salary.toFixed(2),
      <Link key="manage" href={`/staff/${row.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
        Manage
      </Link>,
    ],
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-eyebrow text-primary">Institute admin</p>
        <h1 className="text-heading mt-1 text-2xl">Operations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Academic administration, finance health, class coverage, and staff workload.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Students" icon={Users} value={data.counts.students} tone="info" />
        <StatCard label="Staff" icon={GraduationCap} value={data.counts.staff} tone="primary" />
        <StatCard label="Classes" icon={BookOpen} value={data.counts.classes} tone="success" />
        <StatCard label="Enrollments" icon={ClipboardCheck} value={data.counts.enrollments} tone="info" />
        <StatCard label="Overdue" icon={Wallet} value={data.finance.overdueAmount.toFixed(2)} tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Finance operations" sub="Collected, due, overdue, income, expenses, and salary" className="p-5">
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Collected</p>
              <p className="mt-1 text-xl font-semibold">{data.finance.collected.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Due</p>
              <p className="mt-1 text-xl font-semibold">{data.finance.dueAmount.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Expenses</p>
              <p className="mt-1 text-xl font-semibold">{data.finance.totalExpenses.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Salary</p>
              <p className="mt-1 text-xl font-semibold">{data.finance.totalSalary.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Extra income</p>
              <p className="mt-1 text-xl font-semibold">{data.finance.totalExtraIncome.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Net income</p>
              <p className="mt-1 text-xl font-semibold">{data.finance.netIncome.toFixed(2)}</p>
            </div>
          </div>
        </Panel>

        <Panel title="Controls" sub="Operational setup gaps to resolve" className="p-5">
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5">
              <span className="text-sm">Classes without class teacher</span>
              <Badge variant={data.controls.unassignedClasses > 0 ? "warning" : "success"}>
                {data.controls.unassignedClasses}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5">
              <span className="text-sm">Subjects without teacher</span>
              <Badge variant={data.controls.unassignedSubjects > 0 ? "warning" : "success"}>
                {data.controls.unassignedSubjects}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5">
              <span className="text-sm">Classes without timetable</span>
              <Badge variant={data.controls.classesWithoutTimetable > 0 ? "warning" : "success"}>
                {data.controls.classesWithoutTimetable}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link href="/classes" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Classes
              </Link>
              <Link href="/subjects" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Subjects
              </Link>
              <Link href="/enrollments" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Enrollments
              </Link>
            </div>
          </div>
        </Panel>
      </div>

      <DataTableCard
        title="Class capacity and timetable coverage"
        sub="Academic year, teacher assignment, and schedule completeness"
        compact
        columns={[
          { key: "class", header: "Class" },
          { key: "year", header: "Academic Year" },
          { key: "teacher", header: "Teacher" },
          { key: "slots", header: "Slots" },
          { key: "action", header: "Action" },
        ]}
        rows={capacityRows}
        emptyTitle="No classes configured yet."
      />

      <DataTableCard
        title="Staff workload"
        sub="Subject ownership, class teacher assignments, and salary basis"
        compact
        columns={[
          { key: "staff", header: "Staff" },
          { key: "subjects", header: "Subjects" },
          { key: "classes", header: "Class Teacher" },
          { key: "salary", header: "Salary" },
          { key: "action", header: "Action" },
        ]}
        rows={workloadRows}
        emptyTitle="No staff configured yet."
      />

      <Panel title="Audit history" sub="Recent institute activity" className="p-5">
        <div className="mt-4 flex flex-col gap-3">
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit activity yet.</p>
          ) : (
            data.recentActivity.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-border/60 px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{entry.summary}</p>
                  <span className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{entry.actorName}</p>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}
