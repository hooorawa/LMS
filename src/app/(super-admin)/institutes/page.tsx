import { Building2, CircleAlert, Plus, UsersRound } from "lucide-react";
import { getInstituteDirectory } from "@/lib/data/institute.data";
import { listPlans } from "@/lib/data/subscription.data";
import { Badge } from "@/components/ui/badge";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { InstituteFormDialog } from "./new/institute-form-dialog";
import { InstituteManagementDialog } from "./institute-management-dialog";

const COLUMNS = [
  { key: "institute", header: "Institute", sortable: true },
  { key: "account", header: "Account", sortable: true },
  { key: "community", header: "Community", sortable: true },
  { key: "learning", header: "Learning space", sortable: true },
  { key: "joined", header: "Joined", sortable: true },
  { key: "manage", header: "", headerClassName: "w-24" },
];

const statusVariant = {
  active: "success",
  trial: "secondary",
  past_due: "warning",
  suspended: "destructive",
  cancelled: "destructive",
} as const;

const attentionCopy = {
  healthy: null,
  "trial-ending": "Trial ending soon",
  "needs-admin": "No admin assigned",
  "past-due": "Payment needs review",
  suspended: "Account restricted",
  unconfigured: "Plan not assigned",
} as const;

export default async function InstitutesPage() {
  const [{ institutes, summary }, plans] = await Promise.all([getInstituteDirectory(), listPlans()]);
  const planOptions = plans.map((plan) => ({ id: String(plan._id), name: plan.name }));

  const rows: DataTableRow[] = institutes.map((institute) => ({
    key: institute.id,
    searchValue: `${institute.name} ${institute.code} ${institute.contactEmail ?? ""} ${institute.planName ?? ""}`,
    sortValues: [
      institute.name,
      institute.status,
      institute.students + institute.staff,
      institute.classes,
      institute.createdAt ? new Date(institute.createdAt).getTime() : null,
    ],
    filterValues: { status: institute.status, attention: institute.attention },
    cells: [
      <InstituteManagementDialog key="institute" institute={institute} plans={planOptions} trigger={
        <span className="group flex min-w-48 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-subtle font-heading text-sm font-bold text-primary">
            {institute.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold group-hover:text-primary">{institute.name}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{institute.code} {institute.contactEmail ? `| ${institute.contactEmail}` : ""}</span>
          </span>
        </span>
      } />,
      <div key="account" className="flex min-w-36 flex-col items-start gap-1.5">
        <Badge variant={statusVariant[institute.status]} className="capitalize">{institute.status.replace("_", " ")}</Badge>
        <span className="text-xs text-muted-foreground">{institute.planName ?? "No plan assigned"}</span>
        {attentionCopy[institute.attention] ? <span className="text-xs font-medium text-warning">{attentionCopy[institute.attention]}</span> : null}
      </div>,
      <div key="community" className="min-w-32">
        <p className="font-medium tabular-nums">{institute.students.toLocaleString()} students</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{institute.staff} staff · {institute.admins} admin{institute.admins === 1 ? "" : "s"}</p>
      </div>,
      <div key="learning" className="min-w-28">
        <p className="font-medium tabular-nums">{institute.classes} classes</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{institute.subscriptionStatus ? `${institute.subscriptionStatus.replace("_", " ")} subscription` : "Subscription pending"}</p>
      </div>,
      institute.createdAt ? new Date(institute.createdAt).toLocaleDateString() : "-",
      <InstituteManagementDialog key="manage" institute={institute} plans={planOptions} />,
    ],
  }));

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-[28px] border border-primary/15 bg-[linear-gradient(120deg,color-mix(in_oklch,var(--primary),transparent_91%),transparent_55%),linear-gradient(180deg,var(--card),color-mix(in_oklch,var(--muted),var(--card)_52%))] px-5 py-6 sm:px-7 sm:py-8">
        <div className="absolute -top-16 -right-10 size-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-eyebrow text-primary">Platform directory</p>
            <h1 className="text-heading mt-2 text-3xl sm:text-4xl">Every institute, clearly in view.</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Monitor account health, subscriptions, and learning activity before opening an institute&apos;s full operational record.</p>
          </div>
          <InstituteFormDialog />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DirectoryStat label="All institutes" value={summary.total} detail="Across the platform" icon={Building2} tone="primary" />
        <DirectoryStat label="Active accounts" value={summary.active} detail="Currently operational" icon={UsersRound} tone="success" />
        <DirectoryStat label="In trial" value={summary.trial} detail="Converting to paid plans" icon={Plus} tone="info" />
        <DirectoryStat label="Needs attention" value={summary.needsAttention} detail="Review billing, access, or setup" icon={CircleAlert} tone="warning" />
      </section>

      <DataTableCard
        title="Institute directory"
        sub={`${summary.totalStudents.toLocaleString()} students represented across all institute accounts.`}
        columns={COLUMNS}
        rows={rows}
        searchPlaceholder="Search by institute, code, contact, or plan..."
        emptyTitle="No institutes yet."
        emptyDescription="Create the first institute to start building your platform directory."
        pageSize={12}
        filters={[
          { key: "status", label: "Status", options: [
            { value: "active", label: "Active" }, { value: "trial", label: "Trial" }, { value: "past_due", label: "Past due" }, { value: "suspended", label: "Suspended" }, { value: "cancelled", label: "Cancelled" },
          ] },
          { key: "attention", label: "Account health", allLabel: "All account health", options: [
            { value: "healthy", label: "Healthy" }, { value: "trial-ending", label: "Trial ending soon" }, { value: "needs-admin", label: "No admin" }, { value: "past-due", label: "Payment review" }, { value: "suspended", label: "Restricted" }, { value: "unconfigured", label: "Plan not assigned" },
          ] },
        ]}
      />
    </div>
  );
}

function DirectoryStat({ label, value, detail, icon: Icon, tone }: { label: string; value: number; detail: string; icon: typeof Building2; tone: "primary" | "success" | "info" | "warning" }) {
  const tones = {
    primary: "bg-primary-subtle text-primary",
    success: "bg-success/12 text-success",
    info: "bg-info/12 text-info",
    warning: "bg-warning/14 text-warning",
  };
  return (
    <Card className="gap-3 py-4">
      <CardContent className="flex items-center gap-3">
        <span className={cn("flex size-10 items-center justify-center rounded-xl", tones[tone])}><Icon className="size-4.5" /></span>
        <div>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{value.toLocaleString()}</p>
          <p className="text-sm font-medium">{label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}
