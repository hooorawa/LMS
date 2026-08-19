import { listExpenses } from "@/lib/data/finance.data";
import { deleteExpense } from "@/lib/actions/finance.actions";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { ExpenseFormDialog } from "./new/expense-form-dialog";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";

const COLUMNS = [
  { key: "type", header: "Type" },
  { key: "period", header: "Period" },
  { key: "price", header: "Price" },
  { key: "actions", header: "Actions" },
];

export default async function ExpensesPage() {
  const expenses = await listExpenses();
  const totalExpenses = expenses.reduce((total, expense) => total + expense.price, 0);
  const latestPeriod = expenses[0] ? `${expenses[0].month} ${expenses[0].year}` : "No expenses yet";
  const uniqueTypes = new Set(expenses.map((expense) => expense.type)).size;

  const rows: DataTableRow[] = expenses.map((expense) => ({
    key: String(expense._id),
    searchValue: `${expense.type} ${expense.month} ${expense.year}`,
    cells: [
      <span key="type" className="font-medium">{expense.type}</span>,
      `${expense.month} ${expense.year}`,
      expense.price.toFixed(2),
      <ConfirmDeleteButton
        key="delete"
        action={deleteExpense}
        hiddenFields={{ id: String(expense._id) }}
        itemLabel={expense.type}
      />,
    ],
  }));

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader eyebrow="Finance operations" title="Expense register" description="Record operating costs by period so financial reporting stays current and decisions have a reliable baseline." actions={<ExpenseFormDialog />} metrics={[{ label: "Expense entries", value: expenses.length, detail: "Recorded operating costs", tone: "primary" }, { label: "Total expenses", value: totalExpenses.toFixed(2), detail: "Across all recorded periods", tone: "warning" }, { label: "Expense types", value: uniqueTypes, detail: latestPeriod, tone: "info" }]} />
      <div>
        <DataTableCard
          title="Expense activity"
          sub="Search cost types or periods to review and correct the institute’s operating register."
          columns={COLUMNS}
          rows={rows}
          searchPlaceholder="Search expenses..."
          emptyTitle="No expenses recorded yet."
        />
      </div>
    </div>
  );
}
