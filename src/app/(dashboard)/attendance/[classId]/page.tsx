import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import type { AttendanceRecord } from "@/models/Attendance";
import {
  getAttendanceMarkingContext,
  listAttendanceHistoryForClass,
  listClassesForAttendanceTeacher,
} from "@/lib/data/attendance.data";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AttendanceGrid } from "./attendance-grid";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function ClassAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ date?: string; subjectId?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "institute-staff") {
    redirect("/attendance");
  }

  const { classId } = await params;
  const query = await searchParams;
  const date = query.date || todayIso();
  const subjectId = query.subjectId || "";

  const [classes, context, history] = await Promise.all([
    listClassesForAttendanceTeacher(),
    getAttendanceMarkingContext(classId, subjectId || null, date),
    listAttendanceHistoryForClass(classId),
  ]);

  if (!context) {
    notFound();
  }

  const klass = classes.find((c) => c.id === classId);
  const subjects = klass?.subjects ?? [];

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{context.className} attendance</h1>
          <Link href="/attendance" className={cn(buttonVariants({ variant: "outline" }))}>
            Back to classes
          </Link>
        </div>

        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <label htmlFor="date" className="text-sm font-medium">
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              defaultValue={date}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          {subjects.length > 0 ? (
            <div className="grid gap-1.5">
              <label htmlFor="subjectId" className="text-sm font-medium">
                Subject
              </label>
              <select
                id="subjectId"
                name="subjectId"
                defaultValue={subjectId}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">General (whole class)</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <button type="submit" className={cn(buttonVariants({ variant: "outline" }), "h-8")}>
            View
          </button>
        </form>

        <AttendanceGrid
          classId={classId}
          subjectId={subjectId}
          date={date}
          students={context.students}
        />

        <div>
          <h2 className="mb-3 text-lg font-semibold">Recent history</h2>
          <div className="flex flex-col gap-2">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attendance marked yet.</p>
            ) : (
              history.map((entry) => {
                const total = entry.records.length;
                const present = entry.records.filter(
                  (r: AttendanceRecord) => r.status === "present" || r.status === "late"
                ).length;
                return (
                  <div
                    key={String(entry._id)}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span>
                      {new Date(entry.date).toLocaleDateString()}
                      {(entry.subjectId as unknown as { name?: string } | null)?.name
                        ? ` - ${(entry.subjectId as unknown as { name?: string }).name}`
                        : " - General"}
                    </span>
                    <span className="text-muted-foreground">
                      {present}/{total} present
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
  );
}
