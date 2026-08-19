import Link from "next/link";
import { listStaff } from "@/lib/data/user.data";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { StaffFormDialog } from "./new/staff-form-dialog";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";

const COLUMNS = [
  { key: "name", header: "Name", sortable: true },
  { key: "email", header: "Email" },
  { key: "employeeCode", header: "Employee code" },
  { key: "salary", header: "Basic salary", sortable: true },
  { key: "status", header: "Status", sortable: true },
  { key: "created", header: "Created", sortable: true },
  { key: "actions", header: "Actions" },
];

export default async function StaffPage() {
  const staff = await listStaff();
  const activeStaff = staff.filter((member) => member.status === "active").length;
  const monthlyPayroll = staff.reduce((total, member) => total + (member.staffMeta?.basicSalary ?? 0), 0);

  const rows: DataTableRow[] = staff.map((member) => ({
    key: String(member._id),
    searchValue: `${member.name} ${member.email} ${member.staffMeta?.employeeCode ?? ""}`,
    sortValues: [
      member.name,
      null,
      null,
      member.staffMeta?.basicSalary ?? 0,
      member.status,
      member.createdAt ? new Date(member.createdAt).getTime() : null,
      null,
    ],
    cells: [
      <span key="name" className="font-medium">{member.name}</span>,
      member.email,
      member.staffMeta?.employeeCode || "-",
      (member.staffMeta?.basicSalary ?? 0).toFixed(2),
      <Badge key="status" variant={member.status === "active" ? "success" : "secondary"} className="capitalize">
        {member.status}
      </Badge>,
      member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "-",
      <Link
        key="manage"
        href={`/staff/${member._id}`}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        Manage
      </Link>,
    ],
  }));

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader title="Staff directory" description="Keep your teaching team, employment records, and payroll baseline organized in one workspace." actions={<StaffFormDialog />} metrics={[{ label: "Team members", value: staff.length, detail: "All staff records", tone: "primary" }, { label: "Active staff", value: activeStaff, detail: "Available for assignment", tone: "success" }, { label: "Payroll baseline", value: monthlyPayroll.toFixed(2), detail: "Basic salary per month", tone: "info" }]} />
      <div>
        <DataTableCard
          columns={COLUMNS}
          rows={rows}
          searchPlaceholder="Search staff..."
          emptyTitle="No staff yet."
        />
      </div>
    </div>
  );
}
