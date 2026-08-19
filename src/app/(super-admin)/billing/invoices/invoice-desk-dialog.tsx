"use client";

import { useState, type ReactNode } from "react";
import { ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogHeader, DialogPopup, DialogTitle } from "@/components/ui/dialog";

export function InvoiceDeskDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <Dialog open={open} onOpenChange={setOpen}><Button type="button" onClick={() => setOpen(true)}>Manage invoices <ReceiptText className="size-4" /></Button><DialogPopup size="xl" tone="edit" className="sm:max-h-[88vh]"><DialogHeader><DialogTitle className="text-xl">Invoice desk</DialogTitle><DialogDescription>Open an invoice to record payment or void it without leaving billing.</DialogDescription></DialogHeader><div className="mt-5">{children}</div></DialogPopup></Dialog>;
}
