import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStaffModuleAccess } from "@/lib/auth/staff-permissions";
import { getSession } from "@/lib/auth/session";
import { getMyClassForStudent } from "@/lib/data/class.data";
import { listClassesForAttendanceTeacher } from "@/lib/data/attendance.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StudentWorkspaceHeader } from "@/components/student/student-workspace-header";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";

type TimetableSlot = {
  day?: string;
  startTime?: string;
  endTime?: string;
  room?: string;
};

export default async function MyClassesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.role === "institute-staff") {
    await requireStaffModuleAccess("classes");
    const classes = await listClassesForAttendanceTeacher();
    const classTeacherCount = classes.filter((klass) => klass.isClassTeacher).length;

    return (
      <div className="flex flex-col gap-6">
        <WorkspaceHeader
          eyebrow="Classroom hub"
          title="My Classes"
          description="Classes you teach or manage, with quick links to attendance and live sessions."
          metrics={[
            { label: "Classes", value: classes.length, detail: "Assigned to you", tone: "primary" },
            { label: "Class teacher of", value: classTeacherCount, detail: "Classes you lead", tone: "success" },
          ]}
        />

        {classes.length === 0 ? (
          <p className="text-sm text-muted-foreground">You are not assigned to any classes yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((klass) => (
              <Card key={klass.id}>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>
                    {klass.name}
                    {klass.section ? ` ${klass.section}` : ""}
                  </CardTitle>
                  {klass.isClassTeacher ? <Badge variant="success">Class teacher</Badge> : null}
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">{klass.academicYear}</p>
                  {klass.subjects.length > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Subjects: {klass.subjects.map((subject) => subject.name).join(", ")}
                    </p>
                  ) : null}
                  <div className="flex gap-2">
                    <Link
                      href={`/attendance/${klass.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Attendance
                    </Link>
                    {klass.isClassTeacher ? (
                      <Link
                        href={`/classes/${klass.id}/session`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Live session
                      </Link>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (session.role === "student") {
    const klass = await getMyClassForStudent();
    const timetable = (klass?.timetable ?? []) as TimetableSlot[];

    return (
      <div className="flex flex-col gap-6">
        <StudentWorkspaceHeader
          eyebrow="Classroom hub"
          title="My class"
          description="Find your class details, teaching team, timetable, and live session access in one place."
          metrics={[
            { label: "Class assignment", value: klass ? "1" : "0", detail: klass ? `${klass.name}${klass.section ? ` - ${klass.section}` : ""}` : "Awaiting assignment", tone: klass ? "success" : "warning" },
            { label: "Timetable slots", value: timetable.length, detail: "Scheduled class periods", tone: "primary" },
          ]}
        />

        {!klass ? (
          <p className="text-sm text-muted-foreground">You are not assigned to a class yet.</p>
        ) : (
          <Card className="max-w-2xl overflow-hidden">
            <CardHeader>
              <CardTitle>
                {klass.name}
                {klass.section ? ` ${klass.section}` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">{klass.academicYear}</p>
              <p className="text-sm text-muted-foreground">
                Class teacher:{" "}
                {(klass.classTeacherId as unknown as { name?: string } | null)?.name ?? "Unassigned"}
              </p>
              {timetable.length ? (
                <div className="rounded-xl border border-border/60 bg-muted/35 px-3 py-3 text-sm text-muted-foreground">
                  {timetable
                    .map(
                      (slot) =>
                        `${slot.day?.slice(0, 1).toUpperCase()}${slot.day?.slice(1)} ${slot.startTime}–${slot.endTime}${slot.room ? ` · ${slot.room}` : ""}`
                    )
                    .join(" · ")}
                </div>
              ) : null}
              <Link
                href={`/classes/${klass._id.toString()}/join`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "self-start")}
              >
                Go to live session
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  redirect("/dashboard");
}
