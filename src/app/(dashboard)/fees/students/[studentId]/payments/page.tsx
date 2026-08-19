import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getStudentFeeOverview } from "@/lib/data/fee.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DataTableCard } from "@/components/data-table/data-table-card";
import { PaymentForm } from "./payment-form";

const FEE_COLUMNS = [
  { key: "fee", header: "Fee" },
  { key: "amount", header: "Amount" },
  { key: "paid", header: "Paid" },
  { key: "balance", header: "Balance" },
  { key: "due", header: "Due date" },
];

const PAYMENT_COLUMNS = [
  { key: "date", header: "Date" },
  { key: "fee", header: "Fee" },
  { key: "amount", header: "Amount" },
  { key: "method", header: "Method" },
  { key: "receipt", header: "Receipt" },
];

export default async function StudentPaymentsPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "institute-admin") {
    redirect("/fees");
  }

  const { studentId } = await params;
  const overview = await getStudentFeeOverview(studentId);

  if (!overview) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{overview.student.name}</h1>
            {overview.student.rollNumber ? (
              <p className="text-sm text-muted-foreground">
                Roll no. {overview.student.rollNumber}
              </p>
            ) : null}
          </div>
          <Link href="/students" className={cn(buttonVariants({ variant: "outline" }))}>
            Back to students
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Total due</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {overview.totalDue.toFixed(2)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Total paid</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {overview.totalPaid.toFixed(2)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Balance</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {overview.balance.toFixed(2)}
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-medium">Applicable fees</h2>
          <DataTableCard
            columns={FEE_COLUMNS}
            rows={overview.fees.map((fee) => ({
              key: fee.id,
              cells: [
                <span key="title" className="font-medium">{fee.title}</span>,
                fee.amount.toFixed(2),
                fee.paid.toFixed(2),
                fee.balance.toFixed(2),
                new Date(fee.dueDate).toLocaleDateString(),
              ],
            }))}
            emptyTitle="No fees apply to this student."
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Record a payment</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentForm
              studentId={overview.student.id}
              fees={overview.fees.filter((fee) => fee.balance > 0)}
            />
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-3 text-lg font-medium">Payment history</h2>
          <DataTableCard
            columns={PAYMENT_COLUMNS}
            rows={overview.payments.map((payment) => ({
              key: payment.id,
              cells: [
                new Date(payment.paymentDate).toLocaleDateString(),
                payment.feeTitle ?? "Ad-hoc",
                payment.amount.toFixed(2),
                <span key="method" className="capitalize">{payment.paymentMethod.replace("-", " ")}</span>,
                <a
                  key="receipt"
                  href={`/api/reports/receipt/${payment.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {payment.receiptNumber}
                </a>,
              ],
            }))}
            emptyTitle="No payments recorded yet."
          />
        </div>
      </div>
  );
}
