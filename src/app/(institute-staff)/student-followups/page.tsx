import { requireStaffModuleAccess } from "@/lib/auth/staff-permissions";
import { createStudentFollowUp } from "@/lib/actions/student-follow-up.actions";
import { listTeacherFollowUpData } from "@/lib/data/deep-operations.data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";

export default async function StudentFollowUpsPage() {
  await requireStaffModuleAccess("students");
  const { students, followUps } = await listTeacherFollowUpData();
  const openCount = followUps.filter((followUp) => followUp.status === "open").length;

  const rows: DataTableRow[] = followUps.map((followUp) => {
    const student = followUp.studentId as unknown as { name?: string } | null;
    return {
      key: String(followUp._id),
      cells: [
        <span key="student" className="font-medium">{student?.name ?? "Student"}</span>,
        <Badge key="type" variant="secondary" className="capitalize">{followUp.type}</Badge>,
        <Badge key="status" variant={followUp.status === "open" ? "warning" : "success"} className="capitalize">
          {followUp.status}
        </Badge>,
        followUp.note,
        followUp.nextActionAt ? new Date(followUp.nextActionAt).toLocaleDateString() : "-",
        new Date(followUp.createdAt).toLocaleDateString(),
      ],
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader
        eyebrow="Teaching"
        title="Student follow-ups"
        description="Record attendance, coursework, academic, behavior, and general support notes."
        metrics={[
          { label: "Follow-ups", value: followUps.length, detail: "All recorded notes", tone: "primary" },
          { label: "Open", value: openCount, detail: "Needs a next action", tone: "warning" },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Add follow-up</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createStudentFollowUp} className="grid gap-3 md:grid-cols-2">
            <select name="studentId" className="h-10 rounded-xl border border-input bg-card px-3 text-sm" required>
              <option value="">Select student</option>
              {students.map((student) => {
                const klass = student.studentMeta?.classId as unknown as { name?: string; section?: string } | null;
                return (
                  <option key={String(student._id)} value={String(student._id)}>
                    {student.name}{klass ? ` - ${klass.name}${klass.section ? ` ${klass.section}` : ""}` : ""}
                  </option>
                );
              })}
            </select>
            <select name="type" className="h-10 rounded-xl border border-input bg-card px-3 text-sm">
              <option value="attendance">Attendance</option>
              <option value="coursework">Coursework</option>
              <option value="academic">Academic</option>
              <option value="behavior">Behavior</option>
              <option value="general">General</option>
            </select>
            <Textarea name="note" placeholder="Follow-up note" className="md:col-span-2" required />
            <input
              name="nextActionAt"
              type="date"
              className="h-10 rounded-xl border border-input bg-card px-3 text-sm"
            />
            <Button type="submit" className="md:justify-self-start">Add follow-up</Button>
          </form>
        </CardContent>
      </Card>

      <DataTableCard
        title="Follow-up history"
        compact
        columns={[
          { key: "student", header: "Student" },
          { key: "type", header: "Type" },
          { key: "status", header: "Status" },
          { key: "note", header: "Note" },
          { key: "next", header: "Next action" },
          { key: "created", header: "Created" },
        ]}
        rows={rows}
        emptyTitle="No follow-ups recorded yet."
      />
    </div>
  );
}
