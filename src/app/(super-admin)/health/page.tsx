import Link from "next/link";
import { AlertTriangle, Users, Wallet } from "lucide-react";
import { listInstituteHealth, type InstituteHealthRow } from "@/lib/data/institute-health.data";
import { StatCard } from "@/components/dashboard-shell/stat-card";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SortKey = "balance" | "inactivity" | "months";

const SORTERS: Record<SortKey, (a: InstituteHealthRow, b: InstituteHealthRow) => number> = {
  balance: (a, b) => b.overdueFeeTotal - a.overdueFeeTotal,
  inactivity: (a, b) => (a.lastActivityAt?.getTime() ?? 0) - (b.lastActivityAt?.getTime() ?? 0),
  months: (a, b) => b.monthsOnPlatform - a.monthsOnPlatform,
};

const SORT_LABELS: Record<SortKey, string> = {
  balance: "Outstanding balance",
  inactivity: "Inactivity",
  months: "Months on platform",
};

const COLUMNS = [
  { key: "institute", header: "Institute" },
  { key: "status", header: "Status" },
  { key: "students", header: "Students (active/inactive)" },
  { key: "balance", header: "Outstanding balance" },
  { key: "lastActivity", header: "Last activity" },
  { key: "months", header: "Months on platform" },
];

export default async function InstituteHealthPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const sortKey: SortKey = sort === "inactivity" || sort === "months" ? sort : "balance";

  const health = await listInstituteHealth();

  const totalOutstanding = health.reduce((sum, row) => sum + row.overdueFeeTotal, 0);
  const inactiveCount = health.filter((row) => row.isInactive).length;

  const sorted = [...health].sort(SORTERS[sortKey]);

  const rows: DataTableRow[] = sorted.map((row) => ({
    key: row.id,
    searchValue: `${row.name} ${row.code} ${row.status}`,
    cells: [
      <Link key="name" href={`/institutes/${row.id}`} className="font-medium hover:underline">
        {row.name} ({row.code})
      </Link>,
      <Badge key="status" variant="secondary" className="capitalize">
        {row.status}
      </Badge>,
      `${row.activeStudents} / ${row.inactiveStudents}`,
      row.overdueFeeTotal.toFixed(2),
      row.lastActivityAt ? row.lastActivityAt.toLocaleDateString() : "Never",
      row.monthsOnPlatform,
    ],
  }));

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold">Institute health</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Outstanding balances, activity, and tenure across all institutes.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total outstanding balance"
          icon={Wallet}
          value={totalOutstanding.toFixed(2)}
          tone="warning"
        />
        <StatCard
          label="Institutes with no recent activity"
          icon={AlertTriangle}
          value={inactiveCount}
          tone="warning"
        />
        <StatCard label="Institutes" icon={Users} value={health.length} tone="primary" />
      </div>

      <div className="mt-6 flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Sort by:</span>
        {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
          <Link
            key={key}
            href={`/health?sort=${key}`}
            className={cn(
              "rounded-full px-3 py-1",
              sortKey === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {SORT_LABELS[key]}
          </Link>
        ))}
      </div>

      <div className="mt-4">
        <DataTableCard
          columns={COLUMNS}
          rows={rows}
          searchPlaceholder="Search institutes..."
          emptyTitle="No institutes yet."
        />
      </div>
    </div>
  );
}
