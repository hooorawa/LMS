import { redirect } from "next/navigation";
import { requireStaffModuleAccess } from "@/lib/auth/staff-permissions";
import { getSession } from "@/lib/auth/session";
import { listSubjectsForTeacher, listSubjectsForStudent } from "@/lib/data/subject.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";
import { StudentWorkspaceHeader } from "@/components/student/student-workspace-header";

export default async function MySubjectsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.role !== "institute-staff" && session.role !== "student") {
    redirect("/dashboard");
  }

  if (session.role === "institute-staff") {
    await requireStaffModuleAccess("subjects");
  }

  const subjects =
    session.role === "institute-staff" ? await listSubjectsForTeacher() : await listSubjectsForStudent();

  const headerMetrics = [
    { label: "Subjects", value: subjects.length, detail: "Assigned to you", tone: "primary" as const },
  ];

  return (
    <div className="flex flex-col gap-6">
      {session.role === "institute-staff" ? (
        <WorkspaceHeader
          eyebrow="Teaching"
          title="My Subjects"
          description="Subjects you teach, with their codes and quick reference details."
          metrics={headerMetrics}
        />
      ) : (
        <StudentWorkspaceHeader
          eyebrow="Learning"
          title="My Subjects"
          description="Subjects you're enrolled in, with their teachers and codes."
          metrics={headerMetrics}
        />
      )}

      {subjects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No subjects assigned yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Card key={subject._id.toString()}>
              <CardHeader>
                <CardTitle>{subject.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">Code: {subject.code}</p>
                {session.role === "student" ? (
                  <p className="text-sm text-muted-foreground">
                    Teacher:{" "}
                    {(subject.teacherId as unknown as { name?: string } | null)?.name ?? "Unassigned"}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
