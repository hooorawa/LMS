import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listFeesForInstitute, getStudentFeeOverview } from "@/lib/data/fee.data";
import { listClasses } from "@/lib/data/class.data";
import { listStudents } from "@/lib/data/user.data";
import { deleteFee } from "@/lib/actions/fee.actions";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { FeeFormDialog } from "./new/fee-form-dialog";
import { FeeEditDialog } from "./[id]/edit/fee-edit-dialog";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";
import { StudentWorkspaceHeader } from "@/components/student/student-workspace-header";

const FEE_COLUMNS = [
  { key: "title", header: "Title" },
  { key: "scope", header: "Scope" },
  { key: "amount", header: "Amount" },
  { key: "due", header: "Due date" },
  { key: "frequency", header: "Frequency" },
  { key: "actions", header: "Actions" },
];

export default async function FeesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.role === "institute-admin") {
    const [fees, classesList, studentsList] = await Promise.all([
      listFeesForInstitute(),
      listClasses(),
      listStudents(),
    ]);
    const classes = classesList.map((klass) => ({
      id: String(klass._id),
      name: klass.name,
      section: klass.section,
    }));
    const students = studentsList.map((student) => ({ id: String(student._id), name: student.name }));
    const today = new Date();
    const overdueFees = fees.filter((fee) => new Date(fee.dueDate) < today).length;
    const upcomingFees = fees.filter((fee) => new Date(fee.dueDate) >= today).length;
    const configuredValue = fees.reduce((total, fee) => total + fee.amount, 0);

    const rows: DataTableRow[] = fees.map((fee) => {
      const klass = fee.classId as unknown as { name?: string; section?: string } | null;
      const student = fee.studentId as unknown as { name?: string } | null;
      const scope = student
        ? `Student: ${student.name}`
        : klass
          ? `Class: ${klass.name}${klass.section ? ` - ${klass.section}` : ""}`
          : "Institute-wide";

      return {
        key: String(fee._id),
        searchValue: `${fee.title} ${scope}`,
        cells: [
          <span key="title" className="font-medium">{fee.title}</span>,
          scope,
          fee.amount.toFixed(2),
          new Date(fee.dueDate).toLocaleDateString(),
          <span key="frequency" className="capitalize">{fee.frequency}</span>,
          <div key="actions" className="flex items-center gap-2">
            <FeeEditDialog
              feeId={String(fee._id)}
              title={fee.title}
              amount={fee.amount}
              dueDate={new Date(fee.dueDate).toISOString().slice(0, 10)}
              academicYear={fee.academicYear}
              frequency={fee.frequency ?? "one-time"}
              classId={fee.classId ? String(fee.classId) : ""}
              studentId={fee.studentId ? String(fee.studentId) : ""}
              classes={classes}
              students={students}
            />
            <ConfirmDeleteButton
              action={deleteFee}
              hiddenFields={{ id: String(fee._id) }}
              itemLabel={fee.title}
            />
          </div>,
        ],
      };
    });

    return (
      <div className="flex flex-col gap-6">
          <WorkspaceHeader eyebrow="Finance operations" title="Fee schedule" description="Define what learners owe, when it is due, and where collection follow-up should begin." metrics={[{ label: "Fee definitions", value: fees.length, detail: "Across institute and class scopes", tone: "primary" }, { label: "Configured value", value: configuredValue.toFixed(2), detail: "Sum of listed fee amounts", tone: "info" }, { label: "Past due schedules", value: overdueFees, detail: `${upcomingFees} future due dates`, tone: "warning" }]} actions={<div className="flex flex-wrap items-center gap-4">
            <a
              href="/api/reports/export/fees?format=csv"
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
            >
              Export CSV
            </a>
            <a
              href="/api/reports/export/fees?format=xlsx"
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
            >
              Export Excel
            </a>
            <Link href="/students" className={cn(buttonVariants({ variant: "outline" }))}>
              Record a payment
            </Link>
            <FeeFormDialog classes={classes} students={students} />
          </div>} />
          <DataTableCard
            title="Fee definitions"
            sub="Create fee rules, target an institute, class, or learner, and keep due dates visible."
            columns={FEE_COLUMNS}
            rows={rows}
            searchPlaceholder="Search fees..."
            emptyTitle="No fees defined yet."
          />
      </div>
    );
  }

  if (session.role === "student") {
    const overview = await getStudentFeeOverview(session.userId);
    const currentTime = new Date().getTime();
    const overdueFees = overview?.fees.filter((fee) => fee.balance > 0 && new Date(fee.dueDate).getTime() < currentTime).length ?? 0;

    return (
      <>
        <div className="flex flex-col gap-6">
          <StudentWorkspaceHeader
            eyebrow="Student finance"
            title="Fees and payments"
            description="Understand what is due, follow every payment, and keep your academic documents within reach."
            metrics={[
              { label: "Total due", value: overview?.totalDue.toFixed(2) ?? "0.00", detail: "Applicable fee schedules", tone: "primary" },
              { label: "Outstanding balance", value: overview?.balance.toFixed(2) ?? "0.00", detail: overdueFees > 0 ? `${overdueFees} overdue item${overdueFees === 1 ? "" : "s"}` : "No overdue payments", tone: overdueFees > 0 ? "warning" : "success" },
              { label: "Payments made", value: overview?.payments.length ?? 0, detail: "Recorded payment receipts", tone: "info" },
            ]}
          />

          {!overview ? (
            <p className="text-sm text-muted-foreground">No fee information available.</p>
          ) : (
            <>
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

              <Card className="surface-subtle">
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <a
                    href={`/api/reports/report-card/${session.userId}`}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Download report card
                  </a>
                  <a
                    href={`/api/reports/enrollment-confirmation/${session.userId}`}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Download enrollment confirmation
                  </a>
                  <a
                    href={`/api/reports/fee-statement/${session.userId}`}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Download fee statement
                  </a>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Applicable fees and due dates</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fee</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Due date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overview.fees.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No fees apply to you.
                          </TableCell>
                        </TableRow>
                      ) : (
                        overview.fees.map((fee) => (
                          <TableRow key={fee.id}>
                            <TableCell className="font-medium">{fee.title}</TableCell>
                            <TableCell>{fee.amount.toFixed(2)}</TableCell>
                            <TableCell>{fee.discount.toFixed(2)}</TableCell>
                            <TableCell>{fee.paid.toFixed(2)}</TableCell>
                            <TableCell>
                              <span className={fee.balance > 0 ? "font-medium text-warning" : "text-success"}>
                                {fee.balance.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{new Date(fee.dueDate).toLocaleDateString()}</span>
                                {fee.balance > 0 && new Date(fee.dueDate).getTime() < currentTime ? (
                                  <span className="text-xs font-medium text-destructive">Overdue</span>
                                ) : fee.balance > 0 ? (
                                  <span className="text-xs text-muted-foreground">Payment due</span>
                                ) : (
                                  <span className="text-xs text-success">Paid</span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Payment history</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Fee</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Receipt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overview.payments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No payments recorded yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        overview.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              {new Date(payment.paymentDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{payment.feeTitle ?? "Ad-hoc"}</TableCell>
                            <TableCell>{payment.amount.toFixed(2)}</TableCell>
                            <TableCell className="capitalize">
                              {payment.paymentMethod.replace("-", " ")}
                            </TableCell>
                            <TableCell>
                              <a
                                href={`/api/reports/receipt/${payment.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="underline"
                              >
                                {payment.receiptNumber}
                              </a>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </>
    );
  }

  redirect("/dashboard");
}
