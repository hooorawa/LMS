import Link from "next/link";
import { notFound } from "next/navigation";
import { getStaffById } from "@/lib/data/user.data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PermissionsForm } from "./permissions-form";
import { SalaryForm } from "./salary-form";
import { CommissionForm } from "./commission-form";

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await getStaffById(id);

  if (!staff) {
    notFound();
  }

  const commissions = staff.staffMeta?.monthlyCommissions ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{staff.name}</h1>
          <p className="text-sm text-muted-foreground">{staff.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={staff.status === "active" ? "success" : "secondary"} className="capitalize">
            {staff.status}
          </Badge>
          <Link href="/staff" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Back to staff
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <PermissionsForm
            staffId={String(staff._id)}
            permissions={staff.staffMeta?.permissions ?? {}}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Salary</CardTitle>
        </CardHeader>
        <CardContent>
          <SalaryForm staffId={String(staff._id)} basicSalary={staff.staffMeta?.basicSalary ?? 0} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly commissions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CommissionForm staffId={String(staff._id)} />
          {commissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No commissions recorded yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {commissions
                .slice()
                .reverse()
                .map((entry: { month?: string; amount?: number }, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span>{entry.month}</span>
                    <span className="font-medium">{(entry.amount ?? 0).toFixed(2)}</span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
