"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { addMonthlyCommission } from "@/lib/actions/user.actions";
import { addMonthlyCommissionSchema } from "@/lib/validation/user.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type AddMonthlyCommissionInput = z.input<typeof addMonthlyCommissionSchema>;

export function CommissionForm({ staffId }: { staffId: string }) {
  const [state, formAction, pending] = useActionState(addMonthlyCommission, {});

  const form = useForm<AddMonthlyCommissionInput>({
    resolver: zodResolver(addMonthlyCommissionSchema),
    defaultValues: { month: MONTHS[0], amount: 0 },
  });

  useEffect(() => {
    if (state.error) toast.error("Could not add commission", state.error);
    if (state.success) toast.success("Commission added");
  }, [state.error, state.success]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("staffId", staffId);
    formData.append("month", values.month);
    formData.append("amount", String(values.amount));
    startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
        <FormField
          control={form.control}
          name="month"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Month</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectPopup>
                  {MONTHS.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
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
                <Input {...field} value={field.value as number} type="number" min="0" step="0.01" className="w-32" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Adding..." : "Add commission"}
        </Button>
      </form>
    </Form>
  );
}
