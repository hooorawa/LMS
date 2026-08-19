"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import type { z } from "zod";
import { updateFee, type UpdateFeeState } from "@/lib/actions/fee.actions";
import { updateFeeSchema } from "@/lib/validation/fee.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

const initialState: UpdateFeeState = {};

type UpdateFeeInput = z.input<typeof updateFeeSchema>;

export function FeeEditForm({
  feeId,
  title,
  amount,
  dueDate,
  academicYear,
  frequency,
  classId,
  studentId,
  classes,
  students,
  onSuccess,
}: {
  feeId: string;
  title: string;
  amount: number;
  dueDate: string;
  academicYear: string;
  frequency: string;
  classId: string;
  studentId: string;
  classes: { id: string; name: string; section?: string }[];
  students: { id: string; name: string }[];
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateFee, initialState);

  const form = useForm<UpdateFeeInput>({
    resolver: zodResolver(updateFeeSchema),
    defaultValues: {
      title,
      amount,
      dueDate,
      academicYear,
      frequency: frequency === "monthly" || frequency === "term" ? frequency : "one-time",
      classId,
      studentId,
    },
  });

  useEffect(() => {
    if (state.error) toast.error("Could not update fee", state.error);
  }, [state.error]);

  useEffect(() => {
    if (state.success) {
      toast.success(`"${state.success.title}" updated`);
      onSuccess?.();
    }
  }, [state.success, onSuccess]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("id", feeId);
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, String(value ?? ""));
    });
    startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fee title</FormLabel>
              <FormControl>
                <Input {...field} />
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
          name="dueDate"
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
        <FormField
          control={form.control}
          name="academicYear"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Academic year</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frequency</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="one-time">One-time</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="term">Per term</SelectItem>
                  </SelectPopup>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="classId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class (optional)</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All classes (institute-wide)" />
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="">All classes (institute-wide)</SelectItem>
                    {classes.map((klass) => (
                      <SelectItem key={klass.id} value={klass.id}>
                        {klass.name}
                        {klass.section ? ` - ${klass.section}` : ""}
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
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student override (optional)</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Not student-specific" />
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="">Not student-specific</SelectItem>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </Form>
  );
}
