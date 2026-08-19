"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createInstitute, type CreateInstituteState } from "@/lib/actions/institute.actions";
import { createInstituteSchema, type CreateInstituteInput } from "@/lib/validation/institute.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const initialState: CreateInstituteState = {};

export function InstituteForm({
  onDone,
  onCreateAnother,
}: {
  onDone?: () => void;
  onCreateAnother?: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createInstitute, initialState);

  const form = useForm<CreateInstituteInput>({
    resolver: zodResolver(createInstituteSchema),
    defaultValues: {
      name: "",
      code: "",
      contactEmail: "",
      phone: "",
      address: "",
      adminName: "",
      adminEmail: "",
    },
  });

  useEffect(() => {
    if (state.error) toast.error("Could not create institute", state.error);
  }, [state.error]);

  if (state.success) {
    const { instituteId, instituteName, adminEmail, tempPassword } = state.success;
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <div>
          <p className="font-medium">
            &ldquo;{instituteName}&rdquo; created.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Share these one-time credentials with the institute-admin. They will be forced to set a
            new password on first login.
          </p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Admin email</dt>
          <dd className="font-mono">{adminEmail}</dd>
          <dt className="text-muted-foreground">Temp password</dt>
          <dd className="font-mono">{tempPassword}</dd>
        </dl>
        <div className="flex gap-2">
          <Button type="button" onClick={() => router.push(`/institutes/${instituteId}`)}>
            View institute
          </Button>
          <Button type="button" variant="outline" onClick={onCreateAnother}>
            Create another
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
              <FormLabel>Institute name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Institute code</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. GREENWOOD" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact email</FormLabel>
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
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <hr className="border-border" />
        <FormField
          control={form.control}
          name="adminName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First institute-admin name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="adminEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First institute-admin email</FormLabel>
              <FormControl>
                <Input {...field} type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Creating..." : "Create institute"}
        </Button>
      </form>
    </Form>
  );
}
