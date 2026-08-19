import { listInstituteAuditLogs } from "@/lib/data/deep-operations.data";
import { Badge } from "@/components/ui/badge";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { WorkspaceHeader } from "@/components/dashboard-shell/workspace-header";

export default async function InstituteAuditHistoryPage() {
  const logs = await listInstituteAuditLogs();
  const uniqueActors = new Set(logs.map((log) => log.actorName)).size;
  const systemEvents = logs.filter((log) => log.actorRole === "system").length;
  const latestEvent = logs[0]?.createdAt ? new Date(logs[0].createdAt).toLocaleString() : "No activity yet";

  const rows: DataTableRow[] = logs.map((log) => ({
    key: String(log._id),
    searchValue: `${log.actorName} ${log.actorRole} ${log.action} ${log.summary}`,
    sortValues: [
      log.createdAt ? new Date(log.createdAt).getTime() : null,
      log.actorName,
      log.action,
      null,
    ],
    cells: [
      log.createdAt ? new Date(log.createdAt).toLocaleString() : "-",
      <span key="actor" className="font-medium">{log.actorName}</span>,
      <Badge key="role" variant="secondary">{log.actorRole}</Badge>,
      log.action,
      log.summary,
    ],
  }));

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader eyebrow="Institute governance" title="Audit history" description="Review the institute’s recent operational record, understand who changed what, and trace system activity with confidence." metrics={[{ label: "Recent events", value: logs.length, detail: "Latest 100 audit entries", tone: "primary" }, { label: "Actors", value: uniqueActors, detail: "People or systems represented", tone: "info" }, { label: "System events", value: systemEvents, detail: latestEvent, tone: "success" }]} />

      <DataTableCard
        title="Activity timeline"
        sub="Search by actor, action, or summary to investigate a change quickly."
        columns={[
          { key: "when", header: "When", sortable: true },
          { key: "actor", header: "Actor", sortable: true },
          { key: "role", header: "Role" },
          { key: "action", header: "Action", sortable: true },
          { key: "summary", header: "Summary" },
        ]}
        rows={rows}
        searchPlaceholder="Search audit history..."
        emptyTitle="No audit history yet."
      />
    </div>
  );
}
