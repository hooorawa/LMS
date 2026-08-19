"use client";

import * as React from "react";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import type { z } from "zod";
import { recordPayment, type RecordPaymentState } from "@/lib/actions/payment.actions";
import { recordPaymentSchema } from "@/lib/validation/payment.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

const initialState: RecordPaymentState = {};

type RecordPaymentInput = z.input<typeof recordPaymentSchema>;

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank-transfer", label: "Bank transfer" },
  { value: "card", label: "Card" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
] as const;

export function PaymentForm({
  studentId,
  fees,
}: {
  studentId: string;
  fees: { id: string; title: string; balance: number }[];
}) {
  const [state, formAction, pending] = useActionState(recordPayment, initialState);

  const form = useForm<RecordPaymentInput>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      studentId,
      feeId: "",
      amount: 0,
      paymentMethod: "cash",
      paymentDate: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    },
  });

  React.useEffect(() => {
    if (state.error) toast.error("Could not record payment", state.error);
    if (state.success) {
      toast.success("Payment recorded", `Receipt ${state.success.receiptNumber}`);
      form.reset({
        studentId,
        feeId: "",
        amount: 0,
        paymentMethod: "cash",
        paymentDate: format(new Date(), "yyyy-MM-dd"),
        notes: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, String(value ?? ""));
    });
    React.startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="feeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fee</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ad-hoc payment (not tied to a fee)" />
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="">Ad-hoc payment (not tied to a fee)</SelectItem>
                    {fees.map((fee) => (
                      <SelectItem key={fee.id} value={fee.id}>
                        {fee.title} (balance: {fee.balance.toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input {...field} value={field.value as number} type="number" min="1" step="0.01" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment method</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment date</FormLabel>
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Optional" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {state.success ? (
          <p className="text-sm text-success">
            Payment recorded (receipt {state.success.receiptNumber}).{" "}
            <a
              href={`/api/reports/receipt/${state.success.paymentId}`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              View receipt
            </a>
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Recording..." : "Record payment"}
        </Button>
      </form>
    </Form>
  );
}
