"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { updateStaffSalary } from "@/lib/actions/user.actions";
import { updateStaffSalarySchema } from "@/lib/validation/user.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type UpdateStaffSalaryInput = z.input<typeof updateStaffSalarySchema>;

export function SalaryForm({ staffId, basicSalary }: { staffId: string; basicSalary: number }) {
  const [state, formAction, pending] = useActionState(updateStaffSalary, {});

  const form = useForm<UpdateStaffSalaryInput>({
    resolver: zodResolver(updateStaffSalarySchema),
    defaultValues: { basicSalary },
  });

  useEffect(() => {
    if (state.error) toast.error("Could not update salary", state.error);
    if (state.success) toast.success("Salary updated");
  }, [state.error, state.success]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("staffId", staffId);
    formData.append("basicSalary", String(values.basicSalary));
    startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="basicSalary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Basic salary</FormLabel>
              <FormControl>
                <Input {...field} value={field.value as number} type="number" min="0" step="0.01" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Saving..." : "Update salary"}
        </Button>
      </form>
    </Form>
  );
}
