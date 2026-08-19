import { getSalaryLedger } from "@/lib/data/finance.data";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { Badge } from "@/components/ui/badge";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";

const COLUMNS = [
  { key: "name", header: "Staff", sortable: true },
  { key: "code", header: "Employee code" },
  { key: "salary", header: "Basic salary", sortable: true },
  { key: "commission", header: "Commission total", sortable: true },
  { key: "total", header: "Total compensation", sortable: true },
  { key: "latest", header: "Latest commission" },
  { key: "status", header: "Status", sortable: true },
  { key: "actions", header: "Actions" },
];

export default async function SalaryPage() {
  const ledger = await getSalaryLedger();
  const activeStaff = ledger.filter((entry) => entry.status === "active");
  const salaryTotal = activeStaff.reduce((total, entry) => total + entry.basicSalary, 0);
  const commissionTotal = activeStaff.reduce((total, entry) => total + entry.totalCommission, 0);

  const rows: DataTableRow[] = ledger.map((entry) => ({
    key: entry.id,
    searchValue: `${entry.name} ${entry.email} ${entry.employeeCode}`,
    sortValues: [
      entry.name,
      null,
      entry.basicSalary,
      entry.totalCommission,
      entry.totalCompensation,
      null,
      entry.status,
      null,
    ],
    filterValues: {
      status: entry.status,
      commission: entry.totalCommission > 0 ? "yes" : "no",
    },
    cells: [
      <div key="staff" className="flex flex-col">
        <span className="font-medium">{entry.name}</span>
        <span className="text-xs text-muted-foreground">{entry.email}</span>
      </div>,
      entry.employeeCode || "-",
      entry.basicSalary.toFixed(2),
      entry.totalCommission.toFixed(2),
      entry.totalCompensation.toFixed(2),
      entry.latestCommission
        ? `${entry.latestCommission.month}: ${entry.latestCommission.amount.toFixed(2)}`
        : "No commissions",
      <Badge key="status" variant={entry.status === "active" ? "success" : "secondary"} className="capitalize">
        {entry.status}
      </Badge>,
      <span key="manage" className="text-xs text-muted-foreground">Manage in staff records</span>,
    ],
  }));

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader eyebrow="Finance & payroll" title="Salary planning" description="Review each staff member’s salary basis and commission impact before payroll is prepared." metrics={[{ label: "Active staff", value: activeStaff.length, detail: "Included in payroll review", tone: "success" }, { label: "Salary baseline", value: salaryTotal.toFixed(2), detail: "Basic salary total", tone: "primary" }, { label: "Commission impact", value: commissionTotal.toFixed(2), detail: "Recorded commission total", tone: "info" }]} />

      <DataTableCard
        title="Compensation ledger"
        sub="Filter staff by status or commission activity to prepare the next payroll run."
        columns={COLUMNS}
        rows={rows}
        searchPlaceholder="Search staff..."
        emptyTitle="No salary records yet."
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
            key: "commission",
            label: "Commission",
            options: [
              { value: "yes", label: "With commission" },
              { value: "no", label: "No commission" },
            ],
          },
        ]}
      />
    </div>
  );
}
