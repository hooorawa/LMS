import Link from "next/link";
import { listClasses } from "@/lib/data/class.data";
import { listStudents } from "@/lib/data/user.data";
import { bulkUpdateStudentStatus } from "@/lib/actions/user.actions";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { StudentFormDialog } from "./new/student-form-dialog";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";

const COLUMNS = [
  { key: "name", header: "Name", sortable: true },
  { key: "email", header: "Email" },
  { key: "rollNumber", header: "Roll number" },
  { key: "gender", header: "Gender" },
  { key: "status", header: "Status", sortable: true },
  { key: "created", header: "Created", sortable: true },
  { key: "actions", header: "Actions" },
];

export default async function StudentsPage() {
  const [students, classes] = await Promise.all([listStudents(), listClasses()]);
  const activeStudents = students.filter((student) => student.status === "active").length;
  const missingRollNumbers = students.filter((student) => !student.studentMeta?.rollNumber).length;
  const classOptions = classes.map((klass) => ({
    id: String(klass._id),
    label: `${klass.name}${klass.section ? ` ${klass.section}` : ""}`,
  }));

  const rows: DataTableRow[] = students.map((student) => ({
    key: String(student._id),
    bulkValue: String(student._id),
    searchValue: `${student.name} ${student.email} ${student.studentMeta?.rollNumber ?? ""} ${student.studentMeta?.guardianName ?? ""}`,
    sortValues: [
      student.name,
      null,
      null,
      null,
      student.status,
      student.createdAt ? new Date(student.createdAt).getTime() : null,
      null,
    ],
    filterValues: {
      status: student.status,
      rollNumber: student.studentMeta?.rollNumber ? "assigned" : "missing",
    },
    cells: [
      <span key="name" className="font-medium">{student.name}</span>,
      student.email,
      student.studentMeta?.rollNumber || "-",
      student.studentMeta?.gender ? student.studentMeta.gender[0].toUpperCase() + student.studentMeta.gender.slice(1) : "-",
      <Badge key="status" variant={student.status === "active" ? "success" : "secondary"} className="capitalize">
        {student.status}
      </Badge>,
      student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "-",
      <div key="actions" className="flex items-center gap-2">
        <Link
          href={`/students/${student._id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Manage
        </Link>
        <Link
          href={`/fees/students/${student._id}/payments`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Fees
        </Link>
        <a
          href={`/api/reports/report-card/${student._id}`}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Report card
        </a>
      </div>,
    ],
  }));

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader title="Student records" description="Manage enrollment-ready student profiles, guardians, class assignment, and payment follow-up from one directory." metrics={[{ label: "Students", value: students.length, detail: "All registered learners", tone: "primary" }, { label: "Active students", value: activeStudents, detail: "Currently enabled", tone: "success" }, { label: "Roll numbers missing", value: missingRollNumbers, detail: "Needs academic setup", tone: "warning" }]} actions={<>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/payment-desk" className={cn(buttonVariants({ variant: "outline" }))}>
            Open payment desk
          </Link>
          <a
            href="/api/reports/export/students?format=csv"
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
          >
            Export CSV
          </a>
          <a
            href="/api/reports/export/students?format=xlsx"
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
          >
            Export Excel
          </a>
          <StudentFormDialog classes={classOptions} />
        </div></>} />
      <div>
        <DataTableCard
          columns={COLUMNS}
          rows={rows}
          searchPlaceholder="Search students..."
          emptyTitle="No students yet."
          filters={[
            {
              key: "status",
              label: "Status",
              options: [
                { value: "active", label: "Active" },
                { value: "suspended", label: "Suspended" },
              ],
            },
            {
              key: "rollNumber",
              label: "Roll number",
              options: [
                { value: "assigned", label: "Assigned" },
                { value: "missing", label: "Missing" },
              ],
            },
          ]}
          bulkActions={[
            {
              label: "Activate selected",
              action: bulkUpdateStudentStatus,
              hiddenFields: { status: "active" },
            },
            {
              label: "Suspend selected",
              action: bulkUpdateStudentStatus,
              buttonVariant: "destructive",
              hiddenFields: { status: "suspended" },
            },
          ]}
        />
      </div>
    </div>
  );
}
