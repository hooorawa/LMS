import {
  createAcademicTerm,
  deleteAcademicTerm,
  updateAcademicTermStatus,
} from "@/lib/actions/academic-term.actions";
import { listAcademicTermsForInstitute } from "@/lib/data/deep-operations.data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";

export default async function TermsPage() {
  const terms = await listAcademicTermsForInstitute();
  const now = new Date();
  const activeCount = terms.filter((term) => term.status === "active").length;
  const plannedCount = terms.filter((term) => term.status === "planned").length;
  const currentTerm =
    terms.find((term) => new Date(term.startsAt) <= now && new Date(term.endsAt) >= now) ?? null;

  const rows: DataTableRow[] = terms.map((term) => ({
    key: String(term._id),
    cells: [
      <span key="name" className="font-medium">{term.name}</span>,
      term.academicYear,
      new Date(term.startsAt).toLocaleDateString(),
      new Date(term.endsAt).toLocaleDateString(),
      <Badge key="status" variant={term.status === "active" ? "success" : "secondary"} className="capitalize">
        {term.status}
      </Badge>,
      <div key="actions" className="flex flex-wrap gap-2">
        {term.status !== "active" ? (
          <form action={updateAcademicTermStatus}>
            <input type="hidden" name="id" value={String(term._id)} />
            <input type="hidden" name="status" value="active" />
            <Button type="submit" size="xs" variant="outline">Set active</Button>
          </form>
        ) : null}
        {term.status !== "completed" ? (
          <form action={updateAcademicTermStatus}>
            <input type="hidden" name="id" value={String(term._id)} />
            <input type="hidden" name="status" value="completed" />
            <Button type="submit" size="xs" variant="ghost">Complete</Button>
          </form>
        ) : null}
        <form action={deleteAcademicTerm}>
          <input type="hidden" name="id" value={String(term._id)} />
          <Button type="submit" size="xs" variant="ghost">Delete</Button>
        </form>
      </div>,
    ],
  }));

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader eyebrow="Academic administration" title="Academic terms" description="Define the time windows that anchor calendars, fees, exams, reports, and institute planning." metrics={[{ label: "Current term", value: currentTerm?.name ?? "Not set", detail: currentTerm?.academicYear ?? "Activate a term to guide planning", tone: "primary" }, { label: "Active terms", value: activeCount, detail: "Only one should lead the calendar", tone: "success" }, { label: "Planned terms", value: plannedCount, detail: "Ready for future setup", tone: "info" }]} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Current term</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{currentTerm?.name ?? "No active window"}</p>
            <p className="text-sm text-muted-foreground">{currentTerm?.academicYear ?? "Assign a term to guide calendar planning."}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Active terms</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{activeCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Planned terms</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{plannedCount}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create term</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createAcademicTerm} className="grid gap-3 md:grid-cols-5">
            <Input name="name" placeholder="Term name" required />
            <Input name="academicYear" placeholder="Academic year" required />
            <Input name="startsAt" type="date" required />
            <Input name="endsAt" type="date" required />
            <select name="status" className="h-10 rounded-xl border border-input bg-card px-3 text-sm">
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
            <Button type="submit" className="md:col-span-5 md:justify-self-start">Create term</Button>
          </form>
        </CardContent>
      </Card>

      <DataTableCard
        title="Academic terms"
        compact
        columns={[
          { key: "name", header: "Term" },
          { key: "year", header: "Academic Year" },
          { key: "start", header: "Start" },
          { key: "end", header: "End" },
          { key: "status", header: "Status" },
          { key: "actions", header: "Actions" },
        ]}
        rows={rows}
        emptyTitle="No terms created yet."
      />
    </div>
  );
}
