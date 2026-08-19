"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { createStaff, type CreateUserState } from "@/lib/actions/user.actions";
import { createStaffSchema } from "@/lib/validation/user.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const initialState: CreateUserState = {};

type CreateStaffInput = z.input<typeof createStaffSchema>;

export function StaffForm({
  onDone,
  onCreateAnother,
}: {
  onDone?: () => void;
  onCreateAnother?: () => void;
}) {
  const [state, formAction, pending] = useActionState(createStaff, initialState);

  const form = useForm<CreateStaffInput>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      employeeCode: "",
      basicSalary: undefined,
    },
  });

  useEffect(() => {
    if (state.error) toast.error("Could not create staff member", state.error);
  }, [state.error]);

  if (state.success) {
    const { name, email, tempPassword } = state.success;
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <div>
          <p className="font-medium">&ldquo;{name}&rdquo; added as staff.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Share these one-time credentials. They will be forced to set a new password on first
            login.
          </p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="font-mono">{email}</dd>
          <dt className="text-muted-foreground">Temp password</dt>
          <dd className="font-mono">{tempPassword}</dd>
        </dl>
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="employeeCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employee code</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="basicSalary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Basic salary</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={(field.value as number | string | undefined) ?? ""}
                  type="number"
                  min="0"
                  step="0.01"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Creating..." : "Create staff member"}
        </Button>
      </form>
    </Form>
  );
}
