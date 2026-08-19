import { BadgeCheck, Layers3, Plus, UsersRound } from "lucide-react";
import { getPlanDistribution, listPlans } from "@/lib/data/subscription.data";
import { Badge } from "@/components/ui/badge";
import { DataTableCard, type DataTableRow } from "@/components/data-table/data-table-card";
import { StatCard } from "@/components/dashboard-shell/stat-card";
import { PlanFormDialog } from "./new/plan-form-dialog";
import { PlanManagementDialog } from "./plan-management-dialog";

const COLUMNS = [
  { key: "plan", header: "Plan", sortable: true },
  { key: "price", header: "Price", sortable: true },
  { key: "adoption", header: "Adoption", sortable: true },
  { key: "entitlements", header: "Entitlements" },
  { key: "status", header: "Status", sortable: true },
];

export default async function PlansPage() {
  const [plans, distribution] = await Promise.all([listPlans(), getPlanDistribution()]);
  const subscribersByPlan = new Map(distribution.map((item) => [String(item.planId), item.count]));
  const totalSubscribers = distribution.reduce((total, item) => total + item.count, 0);
  const activePlans = plans.filter((plan) => plan.isActive).length;
  const publicPlans = plans.filter((plan) => plan.isPublic).length;

  const rows: DataTableRow[] = plans.map((plan) => ({
    key: String(plan._id),
    searchValue: `${plan.name} ${plan.slug}`,
    sortValues: [plan.name, plan.price, subscribersByPlan.get(String(plan._id)) ?? 0, null, plan.isActive ? "active" : "inactive"],
    filterValues: { status: plan.isActive ? "active" : "inactive", visibility: plan.isPublic ? "public" : "private" },
    cells: [
      <PlanManagementDialog key="plan" plan={{ id: String(plan._id), name: plan.name, slug: plan.slug, description: plan.description ?? undefined, price: plan.price, currency: plan.currency, billingInterval: plan.billingInterval, limits: plan.limits ?? {}, features: plan.features ?? [], isActive: plan.isActive, isPublic: plan.isPublic, sortOrder: plan.sortOrder, subscribers: subscribersByPlan.get(String(plan._id)) ?? 0 }} trigger={<span className="block min-w-44"><span className="font-semibold hover:text-primary">{plan.name}</span><span className="mt-0.5 block text-xs text-muted-foreground">/{plan.slug} · {plan.description || "No description"}</span></span>} />,
      <div key="price"><p className="font-medium">{plan.currency} {plan.price.toFixed(2)}</p><p className="text-xs capitalize text-muted-foreground">per {plan.billingInterval === "yearly" ? "year" : "month"}</p></div>,
      <div key="adoption"><p className="font-medium tabular-nums">{subscribersByPlan.get(String(plan._id)) ?? 0} institutes</p><p className="text-xs text-muted-foreground">Currently subscribed</p></div>,
      <div key="entitlements" className="max-w-56"><p className="text-sm">{plan.features?.slice(0, 2).join(" · ") || "Core learning tools"}</p><p className="mt-1 text-xs text-muted-foreground">{plan.limits?.maxStudents ? `Up to ${plan.limits.maxStudents} students` : "Unlimited students"}</p></div>,
      <div key="status" className="flex flex-wrap gap-1.5"><Badge variant={plan.isActive ? "success" : "secondary"}>{plan.isActive ? "Active" : "Inactive"}</Badge><Badge variant="secondary">{plan.isPublic ? "Public" : "Private"}</Badge></div>,
    ],
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-[28px] border border-primary/15 bg-[linear-gradient(120deg,color-mix(in_oklch,var(--primary),transparent_91%),transparent_55%),var(--card)] px-5 py-6 sm:px-7 sm:py-8">
        <div className="absolute -top-16 -right-10 size-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-eyebrow text-primary">Commercial catalog</p><h1 className="text-heading mt-2 text-3xl">Plans built for growth.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Shape the packages institutes see, then monitor adoption and entitlement clarity from one place.</p></div><PlanFormDialog /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Plan catalog" icon={Layers3} value={plans.length} sub="Configured packages" tone="primary" /><StatCard label="Active offers" icon={BadgeCheck} value={activePlans} sub={`${publicPlans} visible publicly`} tone="success" /><StatCard label="Subscribed institutes" icon={UsersRound} value={totalSubscribers} sub="Across every plan" tone="info" /><StatCard label="Unpublished plans" icon={Plus} value={plans.length - publicPlans} sub="Internal or private offers" tone="warning" /></div>
      <DataTableCard title="Plan catalog" sub="Edit a plan to refine its pricing, limits, or included features." columns={COLUMNS} rows={rows} searchPlaceholder="Search plans or slugs..." emptyTitle="No plans yet." emptyDescription="Create a plan to start packaging the platform." pageSize={12} filters={[{ key: "status", label: "Status", options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] }, { key: "visibility", label: "Visibility", options: [{ value: "public", label: "Public" }, { value: "private", label: "Private" }] }]} />
    </div>
  );
}
