"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfile, type UpdateProfileState } from "@/lib/actions/profile.actions";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validation/profile.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const initialState: UpdateProfileState = {};

export function ProfileForm({
  name,
  email,
  phone,
  avatarUrl,
}: {
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name, phone, avatarUrl },
  });

  useEffect(() => {
    if (state.error) toast.error("Could not update profile", state.error);
    if (state.success) toast.success("Profile updated");
  }, [state.error, state.success]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("phone", values.phone ?? "");
    formData.append("avatarUrl", values.avatarUrl ?? "");
    startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2"><FormLabel>Email address</FormLabel><Input value={email} disabled /><p className="text-xs text-muted-foreground">Email changes must be made by your institute administrator.</p></div>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        /></div>
        <div className="grid gap-5 sm:grid-cols-2">
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
          name="avatarUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile photo URL</FormLabel>
              <FormControl>
                <Input {...field} placeholder="https://..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        /></div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-5">
          <p className="text-xs text-muted-foreground">Changes are saved only to your personal account.</p>
          <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
