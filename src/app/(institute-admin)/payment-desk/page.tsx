import Link from "next/link";
import { getPaymentDeskSnapshot } from "@/lib/data/finance.data";
import { createBillingFollowUps } from "@/lib/actions/student-follow-up.actions";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const COLUMNS = [
  { key: "student", header: "Student", sortable: true },
  { key: "roll", header: "Roll number" },
  { key: "due", header: "Total due", sortable: true },
  { key: "paid", header: "Total paid", sortable: true },
  { key: "balance", header: "Balance", sortable: true },
  { key: "nextDue", header: "Next due" },
  { key: "lastPayment", header: "Last payment" },
  { key: "status", header: "Status", sortable: true },
  { key: "actions", header: "Actions" },
];

export default async function PaymentDeskPage() {
  const snapshot = await getPaymentDeskSnapshot();

  const rows: DataTableRow[] = snapshot.students.map((student) => ({
    key: student.id,
    bulkValue: student.id,
    searchValue: `${student.name} ${student.email} ${student.rollNumber}`,
    sortValues: [
      student.name,
      null,
      student.totalDue,
      student.totalPaid,
      student.balance,
      student.nextDue?.dueDate ? new Date(student.nextDue.dueDate).getTime() : 0,
      student.recentPayment?.paymentDate ? new Date(student.recentPayment.paymentDate).getTime() : 0,
      student.status,
      null,
    ],
    filterValues: {
      balance: student.overdueAmount > 0 ? "overdue" : student.balance > 0 ? "outstanding" : "settled",
      status: student.status,
    },
    cells: [
      <div key="student" className="flex flex-col">
        <span className="font-medium">{student.name}</span>
        <span className="text-xs text-muted-foreground">{student.email}</span>
      </div>,
      student.rollNumber || "-",
      student.totalDue.toFixed(2),
      student.totalPaid.toFixed(2),
      <span key="balance" className={student.balance > 0 ? "font-medium text-warning" : "text-success"}>
        {student.balance.toFixed(2)}
      </span>,
      student.nextDue ? `${student.nextDue.title} (${new Date(student.nextDue.dueDate).toLocaleDateString()})` : "No balance due",
      student.recentPayment
        ? `${student.recentPayment.amount.toFixed(2)} on ${new Date(student.recentPayment.paymentDate).toLocaleDateString()}`
        : "No payments",
      <Badge key="status" variant={student.status === "active" ? "success" : "secondary"} className="capitalize">
        {student.status}
      </Badge>,
      <div key="actions" className="flex items-center gap-2">
        <Link
          href={`/fees/students/${student.id}/payments`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Open ledger
        </Link>
      </div>,
    ],
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Payment Desk</h1>
          <p className="text-sm text-muted-foreground">
            Review balances, open ledgers, and queue follow-ups for overdue students.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Students</div>
          <div className="mt-1 text-2xl font-semibold">{snapshot.summary.studentCount}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Outstanding</div>
          <div className="mt-1 text-2xl font-semibold">{snapshot.summary.outstandingAmount.toFixed(2)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Overdue</div>
          <div className="mt-1 text-2xl font-semibold">{snapshot.summary.overdueAmount.toFixed(2)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Overdue accounts</div>
          <div className="mt-1 text-2xl font-semibold">{snapshot.summary.overdueCount}</div>
        </div>
      </div>

      <DataTableCard
        columns={COLUMNS}
        rows={rows}
        searchPlaceholder="Search students in payment desk..."
        emptyTitle="No students available for payment desk."
        filters={[
          {
            key: "balance",
            label: "Balance state",
            options: [
              { value: "overdue", label: "Overdue" },
              { value: "outstanding", label: "Outstanding" },
              { value: "settled", label: "Settled" },
            ],
          },
          {
            key: "status",
            label: "Status",
            options: [
              { value: "active", label: "Active" },
              { value: "suspended", label: "Suspended" },
            ],
          },
        ]}
        bulkActions={[
          {
            label: "Create billing follow-ups",
            action: createBillingFollowUps,
            buttonVariant: "outline",
            hiddenFields: {
              note: "Outstanding fee balance needs follow-up from the payment desk.",
            },
          },
        ]}
      />
    </div>
  );
}
