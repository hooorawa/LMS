"use client";

import { useState, type ReactNode } from "react";
import { Layers3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogHeader, DialogPopup, DialogTitle } from "@/components/ui/dialog";
import { PlanEditDialog } from "./[id]/plan-edit-dialog";

type PlanData = {
  id: string; name: string; slug: string; description?: string; price: number; currency: string; billingInterval: string;
  limits: { maxStudents?: number | null; maxStaff?: number | null; maxClasses?: number | null; maxSubjects?: number | null; storageMb?: number | null };
  features: string[]; isActive: boolean; isPublic: boolean; sortOrder: number; subscribers: number;
};

export function PlanManagementDialog({ plan, trigger }: { plan: PlanData; trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <Dialog open={open} onOpenChange={setOpen}>{trigger ? <button type="button" onClick={() => setOpen(true)} className="block w-full text-left">{trigger}</button> : <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>Manage</Button>}<DialogPopup size="lg" tone="edit" className="sm:max-h-[88vh]"><DialogHeader><div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary-subtle text-primary"><Layers3 className="size-4" /></span><div><DialogTitle className="text-xl">{plan.name}</DialogTitle><DialogDescription className="mt-1">/{plan.slug} · {plan.description || "No plan description"}</DialogDescription></div></div><PlanEditDialog plan={plan} /></div></DialogHeader><div className="mt-5 flex items-center justify-between rounded-xl bg-muted/60 p-4"><div><p className="text-2xl font-semibold">{plan.currency} {plan.price.toFixed(2)}</p><p className="mt-1 text-xs capitalize text-muted-foreground">per {plan.billingInterval === "yearly" ? "year" : "month"} · {plan.subscribers} subscribed institutes</p></div><div className="flex gap-1.5"><Badge variant={plan.isActive ? "success" : "secondary"}>{plan.isActive ? "Active" : "Inactive"}</Badge><Badge variant="secondary">{plan.isPublic ? "Public" : "Private"}</Badge></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-border/70 p-4"><p className="text-sm font-semibold">Included features</p><ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">{plan.features.length ? plan.features.map((feature) => <li key={feature}>{feature}</li>) : <li>Core learning tools</li>}</ul></div><div className="rounded-xl border border-border/70 p-4"><p className="text-sm font-semibold">Plan limits</p><dl className="mt-3 grid grid-cols-[1fr_auto] gap-y-2 text-sm"><dt className="text-muted-foreground">Students</dt><dd>{plan.limits.maxStudents ?? "Unlimited"}</dd><dt className="text-muted-foreground">Staff</dt><dd>{plan.limits.maxStaff ?? "Unlimited"}</dd><dt className="text-muted-foreground">Classes</dt><dd>{plan.limits.maxClasses ?? "Unlimited"}</dd><dt className="text-muted-foreground">Storage</dt><dd>{plan.limits.storageMb ? `${plan.limits.storageMb} MB` : "Unlimited"}</dd></dl></div></div></DialogPopup></Dialog>;
}
