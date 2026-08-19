import Link from "next/link";
import { notFound } from "next/navigation";
import {
  GraduationCap,
  Users,
  BookOpen,
  ClipboardCheck,
  Wallet,
  TrendingDown,
  PiggyBank,
} from "lucide-react";
import { getInstituteById, getInstituteSummary } from "@/lib/data/institute.data";
import { getInstituteSubscription, listPlans } from "@/lib/data/subscription.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard-shell/stat-card";
import { cn } from "@/lib/utils";
import { AssignPlanForm } from "./assign-plan-form";
import { InstituteLifecycleActions } from "./institute-lifecycle-actions";

export default async function InstituteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const institute = await getInstituteById(id);

  if (!institute) {
    notFound();
  }

  const summary = await getInstituteSummary(id);
  const [subscription, plans] = await Promise.all([getInstituteSubscription(id), listPlans()]);
  const subscribedPlan = subscription?.planId as unknown as
    | { _id: string; name: string }
    | null
    | undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto w-full max-w-lg">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <CardTitle>{institute.name}</CardTitle>
            <div className="flex items-center gap-2">
              <a
                href={`/api/platform-reports/institute-backup?id=${id}`}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Download backup
              </a>
              <Link href={`/institutes/${id}/admins`} className={cn(buttonVariants({ variant: "outline" }))}>
                View admins
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Code</dt>
              <dd>{institute.code}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="capitalize">{institute.status}</dd>
              <dt className="text-muted-foreground">Contact email</dt>
              <dd>{institute.contactEmail || "-"}</dd>
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{institute.phone || "-"}</dd>
              <dt className="text-muted-foreground">Address</dt>
              <dd>{institute.address || "-"}</dd>
              <dt className="text-muted-foreground">Created</dt>
              <dd>
                {institute.createdAt ? new Date(institute.createdAt).toLocaleString() : "-"}
              </dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="mx-auto w-full max-w-lg">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Subscription</CardTitle>
            {subscription ? (
              <Badge variant="secondary" className="capitalize">
                {subscription.status}
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Plan</dt>
              <dd>{subscribedPlan?.name ?? "No plan assigned"}</dd>
              <dt className="text-muted-foreground">Trial ends</dt>
              <dd>
                {subscription?.trialEndsAt
                  ? new Date(subscription.trialEndsAt).toLocaleDateString()
                  : "-"}
              </dd>
              <dt className="text-muted-foreground">Current period end</dt>
              <dd>
                {subscription?.currentPeriodEnd
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                  : "-"}
              </dd>
            </dl>
            <AssignPlanForm
              instituteId={id}
              plans={plans.map((plan) => ({ id: String(plan._id), name: plan.name }))}
              currentPlanId={subscribedPlan ? String(subscribedPlan._id) : undefined}
            />
            <hr className="border-border" />
            <InstituteLifecycleActions instituteId={id} status={institute.status} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Staff" icon={GraduationCap} value={summary.staff} tone="primary" />
        <StatCard label="Students" icon={Users} value={summary.students} tone="info" />
        <StatCard label="Classes" icon={BookOpen} value={summary.classes} tone="success" />
        <StatCard label="Subjects" icon={ClipboardCheck} value={summary.subjects} tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total revenue"
          icon={Wallet}
          value={summary.totalRevenue.toFixed(2)}
          sub={`+${summary.totalExtraIncome.toFixed(2)} extra income`}
          tone="info"
        />
        <StatCard
          label="Expenses"
          icon={TrendingDown}
          value={summary.totalExpenses.toFixed(2)}
          tone="warning"
        />
        <StatCard label="Salary" icon={Wallet} value={summary.totalSalary.toFixed(2)} tone="warning" />
        <StatCard
          label="Net income"
          icon={PiggyBank}
          value={summary.netIncome.toFixed(2)}
          tone="primary"
        />
      </div>
    </div>
  );
}
