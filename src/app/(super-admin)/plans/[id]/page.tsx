import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlanById, getInstitutesOnPlan } from "@/lib/data/subscription.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlanEditDialog } from "./plan-edit-dialog";

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plan = await getPlanById(id);

  if (!plan) {
    notFound();
  }

  const subscriptions = await getInstitutesOnPlan(id);

  const planFormData = {
    id: String(plan._id),
    name: plan.name,
    slug: plan.slug,
    description: plan.description ?? undefined,
    price: plan.price,
    currency: plan.currency,
    billingInterval: plan.billingInterval,
    limits: plan.limits ?? {},
    features: plan.features ?? [],
    isActive: plan.isActive,
    isPublic: plan.isPublic,
    sortOrder: plan.sortOrder,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto w-full max-w-lg">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{plan.name}</CardTitle>
            <PlanEditDialog plan={planFormData} />
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <p className="text-muted-foreground">{plan.description || "No description."}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={plan.isActive ? "success" : "secondary"}>
                {plan.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="secondary" className="capitalize">
                {plan.billingInterval}
              </Badge>
              <span className="font-medium">
                {plan.currency} {plan.price.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mx-auto w-full max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Institutes on this plan</CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No institutes are on this plan yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {subscriptions.map((sub) => {
                  const institute = sub.instituteId as unknown as {
                    _id: string;
                    name: string;
                  } | null;
                  if (!institute) return null;
                  return (
                    <li key={String(sub._id)} className="flex items-center justify-between text-sm">
                      <Link href={`/institutes/${institute._id}`} className="font-medium hover:underline">
                        {institute.name}
                      </Link>
                      <Badge variant="secondary" className="capitalize">
                        {sub.status}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
