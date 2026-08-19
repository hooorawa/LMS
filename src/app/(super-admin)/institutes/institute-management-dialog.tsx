"use client";

import Link from "next/link";
import { type ReactNode, useState } from "react";
import { ArrowUpRight, Building2, Download, ShieldCheck, UsersRound } from "lucide-react";
import { AssignPlanForm } from "./[id]/assign-plan-form";
import { InstituteLifecycleActions } from "./[id]/institute-lifecycle-actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type InstituteManagementDialogProps = {
  institute: {
    id: string;
    name: string;
    code: string;
    status: string;
    contactEmail?: string;
    phone?: string;
    students: number;
    staff: number;
    admins: number;
    classes: number;
    planId?: string;
    planName?: string;
    subscriptionStatus?: string;
    trialEndsAt?: Date;
    currentPeriodEnd?: Date;
  };
  plans: { id: string; name: string }[];
  trigger?: ReactNode;
};

const statusVariant: Record<string, "success" | "secondary" | "warning" | "destructive"> = {
  active: "success",
  trial: "secondary",
  past_due: "warning",
  suspended: "destructive",
  cancelled: "destructive",
};

export function InstituteManagementDialog({ institute, plans, trigger }: InstituteManagementDialogProps) {
  const [open, setOpen] = useState(false);
  const subscriptionDate = institute.trialEndsAt ?? institute.currentPeriodEnd;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <button type="button" onClick={() => setOpen(true)} className="block w-full text-left">
          {trigger}
        </button>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          Manage
        </Button>
      )}
      <DialogPopup size="xl" tone="edit" className="sm:max-h-[88vh]">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-subtle font-heading text-sm font-bold text-primary">
              {institute.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <DialogTitle className="text-xl">{institute.name}</DialogTitle>
              <DialogDescription className="mt-1">{institute.code} · Manage this institute without leaving the directory.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Overview label="Students" value={institute.students} icon={UsersRound} />
          <Overview label="Team" value={institute.staff + institute.admins} detail={`${institute.admins} admin${institute.admins === 1 ? "" : "s"}`} icon={ShieldCheck} />
          <Overview label="Classes" value={institute.classes} icon={Building2} />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="gap-3 py-4">
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">Subscription & access</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Update the plan or control account access.</p>
                </div>
                <Badge variant={statusVariant[institute.status] ?? "secondary"} className="capitalize">{institute.status.replace("_", " ")}</Badge>
              </div>
              <div className="mt-4 rounded-xl bg-muted/60 p-3 text-sm">
                <p className="font-medium">{institute.planName ?? "No plan assigned"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {subscriptionDate
                    ? `${institute.subscriptionStatus === "trialing" ? "Trial ends" : "Period ends"} ${new Date(subscriptionDate).toLocaleDateString()}`
                    : "No subscription period recorded"}
                </p>
              </div>
              <div className="mt-4"><AssignPlanForm instituteId={institute.id} plans={plans} currentPlanId={institute.planId} /></div>
              <div className="mt-4 border-t border-border/70 pt-4"><InstituteLifecycleActions instituteId={institute.id} status={institute.status} /></div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card className="gap-3 py-4">
              <CardContent>
                <p className="text-sm font-semibold">Contact & ownership</p>
                <dl className="mt-3 grid gap-2 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Email</dt><dd className="truncate text-right">{institute.contactEmail ?? "Not provided"}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Phone</dt><dd>{institute.phone ?? "Not provided"}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Subscription</dt><dd className="capitalize">{institute.subscriptionStatus?.replace("_", " ") ?? "Not configured"}</dd></div>
                </dl>
              </CardContent>
            </Card>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              <Link href={`/institutes/${institute.id}/admins`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "justify-between")}>
                Admins <ArrowUpRight className="size-3.5" />
              </Link>
              <a href={`/api/platform-reports/institute-backup?id=${institute.id}`} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "justify-between")}>
                Download backup <Download className="size-3.5" />
              </a>
              <Link href={`/institutes/${institute.id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "justify-between")}>
                Full record <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  );
}

function Overview({ label, value, detail, icon: Icon }: { label: string; value: number; detail?: string; icon: typeof UsersRound }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/35 p-3.5">
      <Icon className="size-4 text-primary" />
      <p className="mt-2 text-xl font-semibold tabular-nums">{value.toLocaleString()}</p>
      <p className="text-xs font-medium text-muted-foreground">{label}{detail ? ` · ${detail}` : ""}</p>
    </div>
  );
}
