"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { markInvoicePaid, voidInvoice, type InvoiceActionState } from "@/lib/actions/platform-invoice.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: InvoiceActionState = {};
export function InvoiceActions({ invoiceId, status }: { invoiceId: string; status: string }) {
  const router = useRouter();
  const [paidState, paidAction, paying] = useActionState(markInvoicePaid, initialState);
  const [voidState, voidAction, voiding] = useActionState(voidInvoice, initialState);
  useEffect(() => { if (paidState.success || voidState.success) router.refresh(); }, [paidState.success, voidState.success, router]);
  if (status === "paid" || status === "void") return null;
  const today = new Date().toISOString().slice(0, 10);
  return <div className="grid gap-6 md:grid-cols-2"><form action={paidAction} className="flex flex-col gap-3 rounded-lg border p-4"><h2 className="font-medium">Mark paid</h2><input type="hidden" name="invoiceId" value={invoiceId} /><div className="grid gap-2"><Label htmlFor="paymentMethod">Payment method</Label><select id="paymentMethod" name="paymentMethod" required className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"><option value="bank-transfer">Bank transfer</option><option value="cash">Cash</option><option value="cheque">Cheque</option><option value="card-manual">Card (manual)</option><option value="other">Other</option></select></div><div className="grid gap-2"><Label htmlFor="paidAt">Payment date</Label><Input id="paidAt" name="paidAt" type="date" defaultValue={today} required /></div><div className="grid gap-2"><Label htmlFor="receiptNumber">Receipt number</Label><Input id="receiptNumber" name="receiptNumber" /></div>{paidState.error ? <p className="text-sm text-destructive">{paidState.error}</p> : null}<Button disabled={paying}>{paying ? "Saving..." : "Mark paid"}</Button></form><form action={voidAction} className="flex flex-col gap-3 rounded-lg border border-destructive/40 p-4"><h2 className="font-medium">Void invoice</h2><input type="hidden" name="invoiceId" value={invoiceId} /><div className="grid gap-2"><Label htmlFor="reason">Reason</Label><Input id="reason" name="reason" required /></div>{voidState.error ? <p className="text-sm text-destructive">{voidState.error}</p> : null}<Button variant="destructive" disabled={voiding}>{voiding ? "Voiding..." : "Void invoice"}</Button></form></div>;
}
