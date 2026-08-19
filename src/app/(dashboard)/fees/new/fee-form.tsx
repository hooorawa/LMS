"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import type { z } from "zod";
import { createFee, type CreateFeeState } from "@/lib/actions/fee.actions";
import { createFeeSchema } from "@/lib/validation/fee.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

const initialState: CreateFeeState = {};

type CreateFeeInput = z.input<typeof createFeeSchema>;

export function FeeForm({
  classes,
  students,
  onDone,
  onCreateAnother,
}: {
  classes: { id: string; name: string; section?: string }[];
  students: { id: string; name: string }[];
  onDone?: () => void;
  onCreateAnother?: () => void;
}) {
  const [state, formAction, pending] = useActionState(createFee, initialState);

  const form = useForm<CreateFeeInput>({
    resolver: zodResolver(createFeeSchema),
    defaultValues: {
      title: "",
      amount: 0,
      dueDate: "",
      academicYear: "",
      frequency: "one-time",
      classId: "",
      studentId: "",
    },
  });

  useEffect(() => {
    if (state.error) toast.error("Could not create fee", state.error);
  }, [state.error]);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <p className="font-medium">&ldquo;{state.success.title}&rdquo; created.</p>
        <div className="flex gap-2">
          <Button type="button" onClick={onDone}>
            Done
          </Button>
          <Button type="button" variant="outline" onClick={onCreateAnother}>
            Add another
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
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
                <Input {...field} placeholder="e.g. Tuition fee" />
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
                <Input {...field} placeholder="e.g. 2026-2027" />
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
          {pending ? "Saving..." : "Create fee"}
        </Button>
      </form>
    </Form>
  );
}
