import { getCommissionLedger } from "@/lib/data/finance.data";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { Badge } from "@/components/ui/badge";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";

const COLUMNS = [
  { key: "staff", header: "Staff", sortable: true },
  { key: "code", header: "Employee code" },
  { key: "month", header: "Month", sortable: true },
  { key: "amount", header: "Amount", sortable: true },
  { key: "recorded", header: "Recorded", sortable: true },
  { key: "status", header: "Status", sortable: true },
  { key: "actions", header: "Actions" },
];

export default async function CommissionsPage() {
  const { entries, monthlyTotals } = await getCommissionLedger();
  const currentMonth = monthlyTotals.at(-1);
  const activeEntries = entries.filter((entry) => entry.status === "active").length;

  const rows: DataTableRow[] = entries.map((entry) => ({
    key: entry.key,
    searchValue: `${entry.staffName} ${entry.employeeCode} ${entry.month}`,
    sortValues: [
      entry.staffName,
      null,
      entry.month,
      entry.amount,
      entry.recordedAt ? new Date(entry.recordedAt).getTime() : 0,
      entry.status,
      null,
    ],
    filterValues: {
      status: entry.status,
      month: entry.month,
    },
    cells: [
      <span key="staff" className="font-medium">{entry.staffName}</span>,
      entry.employeeCode || "-",
      entry.month || "-",
      entry.amount.toFixed(2),
      entry.recordedAt ? new Date(entry.recordedAt).toLocaleDateString() : "-",
      <Badge key="status" variant={entry.status === "active" ? "success" : "secondary"} className="capitalize">
        {entry.status}
      </Badge>,
      <span key="manage" className="text-xs text-muted-foreground">Manage from staff records</span>,
    ],
  }));

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader eyebrow="Finance & payroll" title="Commission ledger" description="Review earned commissions by staff member and month before payroll is finalized." metrics={[{ label: "Commission entries", value: entries.length, detail: "Recorded staff earnings", tone: "primary" }, { label: "Active staff entries", value: activeEntries, detail: "From enabled staff", tone: "success" }, { label: "Latest period", value: currentMonth?.total.toFixed(2) ?? "0.00", detail: currentMonth?.month ?? "No months recorded", tone: "info" }]} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {monthlyTotals.slice(-3).map((month) => (
          <div key={month.month} className="rounded-2xl border border-border bg-card px-4 py-3">
            <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {month.month}
            </div>
            <div className="mt-1 text-2xl font-semibold">{month.total.toFixed(2)}</div>
          </div>
        ))}
      </div>

      <DataTableCard
        title="Commission entries"
        sub="Use the staff directory to update commission schedules and employment status."
        columns={COLUMNS}
        rows={rows}
        searchPlaceholder="Search commissions..."
        emptyTitle="No commissions recorded yet."
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "active", label: "Active staff" },
              { value: "suspended", label: "Suspended staff" },
            ],
          },
          {
            key: "month",
            label: "Month",
            options: monthlyTotals.map((entry) => ({ value: entry.month, label: entry.month })),
          },
        ]}
      />
    </div>
  );
}
