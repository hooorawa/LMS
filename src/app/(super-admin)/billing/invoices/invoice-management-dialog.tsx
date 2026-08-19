"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogHeader, DialogPopup, DialogTitle } from "@/components/ui/dialog";
import { InvoiceActions } from "./[id]/invoice-actions";

type InvoiceDialogData = {
  id: string;
  invoiceNumber: string;
  instituteName: string;
  planName?: string;
  amount: number;
  currency: string;
  status: string;
  dueAt: string;
  issuedAt: string;
  paidAt?: string;
  paymentMethod?: string;
  notes?: string;
};

export function InvoiceManagementDialog({ invoice, trigger = "Manage" }: { invoice: InvoiceDialogData; trigger?: string }) {
  const [open, setOpen] = useState(false);
  const displayStatus = invoice.status === "pending" && new Date(invoice.dueAt) < new Date() ? "overdue" : invoice.status;
  const statusVariant = displayStatus === "paid" ? "success" : displayStatus === "overdue" ? "destructive" : "secondary";
  return <Dialog open={open} onOpenChange={setOpen}><Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>{trigger}</Button><DialogPopup size="lg" tone="edit" className="sm:max-h-[88vh]"><DialogHeader><div className="flex items-start gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary-subtle text-primary"><CreditCard className="size-4" /></span><div><DialogTitle className="text-xl">{invoice.invoiceNumber}</DialogTitle><DialogDescription className="mt-1">{invoice.instituteName} · {invoice.planName ?? "No plan snapshot"}</DialogDescription></div></div></DialogHeader><div className="mt-5 flex items-center justify-between rounded-xl bg-muted/60 p-4"><div><p className="text-2xl font-semibold">{invoice.currency} {invoice.amount.toFixed(2)}</p><p className="mt-1 text-xs text-muted-foreground">Issued {new Date(invoice.issuedAt).toLocaleDateString()} · Due {new Date(invoice.dueAt).toLocaleDateString()}</p></div><Badge variant={statusVariant} className="capitalize">{displayStatus}</Badge></div><dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-sm"><dt className="text-muted-foreground">Institute</dt><dd>{invoice.instituteName}</dd><dt className="text-muted-foreground">Plan</dt><dd>{invoice.planName ?? "-"}</dd>{invoice.paidAt ? <><dt className="text-muted-foreground">Paid</dt><dd>{new Date(invoice.paidAt).toLocaleDateString()} via {invoice.paymentMethod?.replace("-", " ")}</dd></> : null}{invoice.notes ? <><dt className="text-muted-foreground">Notes</dt><dd className="whitespace-pre-wrap">{invoice.notes}</dd></> : null}</dl><div className="mt-5"><InvoiceActions invoiceId={invoice.id} status={invoice.status} /></div></DialogPopup></Dialog>;
}
