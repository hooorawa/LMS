import { listExtraIncome, getIncomeStatistics } from "@/lib/data/finance.data";
import { deleteExtraIncome } from "@/lib/actions/finance.actions";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { StatCard } from "@/components/dashboard-shell/stat-card";
import { Wallet, TrendingDown, TrendingUp, PiggyBank } from "lucide-react";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { IncomeFormDialog } from "./new/income-form-dialog";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";

const COLUMNS = [
  { key: "title", header: "Title" },
  { key: "period", header: "Period" },
  { key: "amount", header: "Amount" },
  { key: "actions", header: "Actions" },
];

export default async function IncomePage() {
  const [income, stats] = await Promise.all([listExtraIncome(), getIncomeStatistics()]);

  const rows: DataTableRow[] = income.map((entry) => ({
    key: String(entry._id),
    searchValue: `${entry.title} ${entry.month} ${entry.year}`,
    cells: [
      <span key="title" className="font-medium">{entry.title}</span>,
      `${entry.month} ${entry.year}`,
      entry.amount.toFixed(2),
      <ConfirmDeleteButton
        key="delete"
        action={deleteExtraIncome}
        hiddenFields={{ id: String(entry._id) }}
        itemLabel={entry.title}
      />,
    ],
  }));

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader eyebrow="Finance operations" title="Income overview" description="Capture income beyond student payments and see how revenue, operating costs, and payroll shape institute health." actions={<IncomeFormDialog />} metrics={[{ label: "Revenue collected", value: stats.totalRevenue.toFixed(2), detail: "Student fee payments", tone: "success" }, { label: "Extra income", value: stats.totalExtraIncome.toFixed(2), detail: "Non-fee income recorded", tone: "info" }, { label: "Net position", value: stats.netIncome.toFixed(2), detail: "After expenses and salary", tone: stats.netIncome >= 0 ? "primary" : "warning" }]} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Revenue"
          icon={Wallet}
          value={stats.totalRevenue.toFixed(2)}
          tone="success"
        />
        <StatCard
          label="Extra income"
          icon={TrendingUp}
          value={stats.totalExtraIncome.toFixed(2)}
          tone="info"
        />
        <StatCard
          label="Expenses + salary"
          icon={TrendingDown}
          value={(stats.totalExpenses + stats.totalSalary).toFixed(2)}
          tone="warning"
        />
        <StatCard
          label="Net income"
          icon={PiggyBank}
          value={stats.netIncome.toFixed(2)}
          tone="primary"
        />
      </div>

      <DataTableCard
        title="Additional income"
        sub="Keep one-off and supplementary income visible alongside core fee revenue."
        columns={COLUMNS}
        rows={rows}
        searchPlaceholder="Search income..."
        emptyTitle="No extra income recorded yet."
      />
    </div>
  );
}
