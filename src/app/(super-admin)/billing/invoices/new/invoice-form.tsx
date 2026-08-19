"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import type { z } from "zod";
import { createInvoice, type InvoiceActionState } from "@/lib/actions/platform-invoice.actions";
import { createPlatformInvoiceSchema } from "@/lib/validation/platform-invoice.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const initialState: InvoiceActionState = {};

type CreatePlatformInvoiceInput = z.input<typeof createPlatformInvoiceSchema>;

export function InvoiceForm({
  institutes,
  onDone,
}: {
  institutes: { id: string; name: string; code: string }[];
  onDone?: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createInvoice, initialState);
  const today = new Date().toISOString().slice(0, 10);

  const form = useForm<CreatePlatformInvoiceInput>({
    resolver: zodResolver(createPlatformInvoiceSchema),
    defaultValues: {
      instituteId: "",
      periodStart: today,
      periodEnd: today,
      amount: 0,
      currency: "USD",
      issuedAt: today,
      dueAt: today,
      notes: "",
      discountAmount: undefined,
      discountReason: "",
    },
  });

  useEffect(() => {
    if (state.error) toast.error("Could not create invoice", state.error);
  }, [state.error]);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4">
        <p className="font-medium">Invoice {state.success.invoiceNumber} created.</p>
        <div className="flex gap-2">
          <Button type="button" onClick={() => router.push(`/billing/invoices/${state.success!.invoiceId}`)}>
            View invoice
          </Button>
          <Button type="button" variant="outline" onClick={onDone}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("instituteId", values.instituteId);
    formData.append("periodStart", values.periodStart);
    formData.append("periodEnd", values.periodEnd);
    formData.append("amount", String(values.amount));
    formData.append("currency", values.currency);
    formData.append("issuedAt", values.issuedAt);
    formData.append("dueAt", values.dueAt);
    formData.append("notes", values.notes ?? "");
    if (values.discountAmount !== undefined) formData.append("discountAmount", String(values.discountAmount));
    formData.append("discountReason", values.discountReason ?? "");
    startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="instituteId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Institute</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an institute" />
                  </SelectTrigger>
                </FormControl>
                <SelectPopup>
                  {institutes.map((institute) => (
                    <SelectItem key={institute.id} value={institute.id}>
                      {institute.name} ({institute.code})
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="periodStart"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Period start</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value ? new Date(field.value) : null}
                    onChange={(date) => field.onChange(format(date, "yyyy-MM-dd"))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="periodEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Period end</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value ? new Date(field.value) : null}
                    onChange={(date) => field.onChange(format(date, "yyyy-MM-dd"))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value as number} type="number" min="0" step="0.01" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <FormControl>
                  <Input {...field} maxLength={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="issuedAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issue date</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value ? new Date(field.value) : null}
                    onChange={(date) => field.onChange(format(date, "yyyy-MM-dd"))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due date</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value ? new Date(field.value) : null}
                    onChange={(date) => field.onChange(format(date, "yyyy-MM-dd"))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="discountAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount amount (optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={(field.value as number | undefined) ?? ""}
                    type="number"
                    min="0"
                    step="0.01"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="discountReason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount reason (optional)</FormLabel>
                <FormControl>
                  <Input {...field} maxLength={500} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Creating..." : "Create invoice"}
        </Button>
      </form>
    </Form>
  );
}
