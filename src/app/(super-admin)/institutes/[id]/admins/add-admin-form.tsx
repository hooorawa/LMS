"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createInstituteAdmin,
  type CreateInstituteAdminState,
} from "@/lib/actions/institute.actions";
import {
  createInstituteAdminSchema,
  type CreateInstituteAdminInput,
} from "@/lib/validation/institute-admin.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const initialState: CreateInstituteAdminState = {};

export function AddAdminForm({ instituteId }: { instituteId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createInstituteAdmin, initialState);

  const form = useForm<CreateInstituteAdminInput>({
    resolver: zodResolver(createInstituteAdminSchema),
    defaultValues: { instituteId, name: "", email: "", phone: "" },
  });

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
    if (state.error) {
      toast.error("Could not add admin", state.error);
    }
  }, [state.success, state.error, router]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, String(value ?? ""));
    });
    startTransition(() => {
      formAction(formData);
    });
  });

  if (state.success) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <div>
          <p className="font-medium">Admin added.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Share these one-time credentials with the new admin. They will be forced to set a new
            password on first login.
          </p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Admin email</dt>
          <dd className="font-mono">{state.success.adminEmail}</dd>
          <dt className="text-muted-foreground">Temp password</dt>
          <dd className="font-mono">{state.success.tempPassword}</dd>
        </dl>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => setOpen(false)}
        >
          Close
        </Button>
      </div>
    );
  }

  if (!open) {
    return (
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        Add admin
      </Button>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-end sm:flex-wrap"
      >
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
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Adding..." : "Add admin"}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
