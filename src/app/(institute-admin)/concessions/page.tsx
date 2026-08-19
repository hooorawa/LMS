import { createFeeConcession } from "@/lib/actions/fee-concession.actions";
import { listConcessionManagementData } from "@/lib/data/deep-operations.data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";

export default async function ConcessionsPage() {
  const { students, fees, concessions } = await listConcessionManagementData();
  const percentageConcessions = concessions.filter((concession) => concession.type === "percent").length;
  const feeSpecific = concessions.filter((concession) => concession.feeId).length;

  const rows: DataTableRow[] = concessions.map((concession) => {
    const student = concession.studentId as unknown as { name?: string; studentMeta?: { rollNumber?: string } } | null;
    const fee = concession.feeId as unknown as { title?: string } | null;
    return {
      key: String(concession._id),
      cells: [
        <span key="title" className="font-medium">{concession.title}</span>,
        student?.name ?? "Student",
        fee?.title ?? "All fees",
        <Badge key="type" variant="secondary" className="capitalize">{concession.type}</Badge>,
        concession.type === "percent" ? `${concession.value}%` : concession.value.toFixed(2),
        concession.reason ?? "-",
      ],
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader eyebrow="Finance operations" title="Fee concessions" description="Apply clear, student-level reductions to a specific fee or every applicable fee, with the reason recorded for review." metrics={[{ label: "Active concessions", value: concessions.length, detail: "Student financial adjustments", tone: "primary" }, { label: "Fee-specific", value: feeSpecific, detail: "Applied to one fee definition", tone: "info" }, { label: "Percentage based", value: percentageConcessions, detail: "Variable discount rules", tone: "success" }]} />

      <Card>
        <CardHeader>
          <CardTitle>Create concession</CardTitle>
          <p className="text-sm text-muted-foreground">Select the learner, discount method, and whether it applies to one fee or the full statement.</p>
        </CardHeader>
        <CardContent>
          <form action={createFeeConcession} className="grid gap-3 md:grid-cols-2">
            <select name="studentId" className="h-10 rounded-xl border border-input bg-card px-3 text-sm" required>
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={String(student._id)} value={String(student._id)}>
                  {student.name}{student.studentMeta?.rollNumber ? ` (${student.studentMeta.rollNumber})` : ""}
                </option>
              ))}
            </select>
            <select name="feeId" className="h-10 rounded-xl border border-input bg-card px-3 text-sm">
              <option value="">All applicable fees</option>
              {fees.map((fee) => (
                <option key={String(fee._id)} value={String(fee._id)}>
                  {fee.title} ({fee.amount.toFixed(2)})
                </option>
              ))}
            </select>
            <Input name="title" placeholder="Concession title" required />
            <div className="grid grid-cols-[1fr_1fr] gap-3">
              <select name="type" className="h-10 rounded-xl border border-input bg-card px-3 text-sm">
                <option value="fixed">Fixed amount</option>
                <option value="percent">Percent</option>
              </select>
              <Input name="value" type="number" min="0" step="0.01" placeholder="Value" required />
            </div>
            <Textarea name="reason" placeholder="Reason" className="md:col-span-2" />
            <Button type="submit" className="md:col-span-2 md:justify-self-start">Create concession</Button>
          </form>
        </CardContent>
      </Card>

      <DataTableCard
        title="Active concessions"
        sub="Review every discount rule by learner, fee scope, and supporting reason."
        compact
        columns={[
          { key: "title", header: "Title" },
          { key: "student", header: "Student" },
          { key: "fee", header: "Fee" },
          { key: "type", header: "Type" },
          { key: "value", header: "Value" },
          { key: "reason", header: "Reason" },
        ]}
        rows={rows}
        emptyTitle="No concessions created yet."
      />
    </div>
  );
}
