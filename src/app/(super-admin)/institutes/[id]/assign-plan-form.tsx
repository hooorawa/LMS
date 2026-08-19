"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assignPlan, type AssignPlanState } from "@/lib/actions/subscription.actions";
import { assignPlanSchema, type AssignPlanInput } from "@/lib/validation/subscription.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const initialState: AssignPlanState = {};

type AssignPlanFormProps = {
  instituteId: string;
  plans: { id: string; name: string }[];
  currentPlanId?: string;
};

export function AssignPlanForm({ instituteId, plans, currentPlanId }: AssignPlanFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(assignPlan, initialState);

  const form = useForm<Pick<AssignPlanInput, "instituteId" | "planId">>({
    resolver: zodResolver(assignPlanSchema.pick({ instituteId: true, planId: true })),
    defaultValues: { instituteId, planId: currentPlanId ?? "" },
  });

  useEffect(() => {
    if (state.error) toast.error("Could not assign plan", state.error);
    if (state.success) router.refresh();
  }, [state.error, state.success, router]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("instituteId", values.instituteId);
    formData.append("planId", values.planId);
    startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <FormField
          control={form.control}
          name="planId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plan</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                </FormControl>
                <SelectPopup>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Assigning..." : currentPlanId ? "Change plan" : "Assign plan"}
        </Button>
      </form>
    </Form>
  );
}
