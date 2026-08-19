"use client";

import * as React from "react";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  updateSystemSettings,
  type UpdateSystemSettingsState,
} from "@/lib/actions/system-settings.actions";
import { updateSystemSettingsSchema } from "@/lib/validation/system-settings.schema";

type UpdateSystemSettingsInput = z.input<typeof updateSystemSettingsSchema>;
import type { SystemSettingsData } from "@/lib/data/system-settings.data";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const initialState: UpdateSystemSettingsState = {};

function ColorSwatchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const isValidHex = /^#[0-9a-fA-F]{6}$/.test(value);

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-input">
        <input
          type="color"
          value={isValidHex ? value : "#0f172a"}
          onChange={(event) => onChange(event.target.value)}
          className="size-14 cursor-pointer border-none bg-transparent p-0"
          aria-label="Pick primary color"
        />
      </div>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="#0f172a"
        className="flex-1"
      />
    </div>
  );
}

export function PlatformSettingsForm({ settings }: { settings: SystemSettingsData }) {
  const [state, formAction, pending] = useActionState(updateSystemSettings, initialState);

  const form = useForm<UpdateSystemSettingsInput>({
    resolver: zodResolver(updateSystemSettingsSchema),
    defaultValues: {
      systemName: settings.systemName ?? "",
      tagline: settings.tagline ?? "",
      logoUrl: settings.logoUrl ?? "",
      supportEmail: settings.supportEmail ?? "",
      defaultTrialDays: settings.defaultTrialDays ?? 0,
      primaryColor: settings.primaryColor ?? "",
      privacyPolicy: settings.privacyPolicy ?? "",
      termsOfUse: settings.termsOfUse ?? "",
      helpCenterContent: settings.helpCenterContent ?? "",
    },
  });

  React.useEffect(() => {
    if (state.success) toast.success("Settings saved");
    if (state.error) toast.error("Could not save settings", state.error);
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
      <form onSubmit={onSubmit} className="flex flex-col gap-7">
        <section className="grid gap-4 rounded-2xl border border-border/70 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><p className="font-medium">Brand identity</p><p className="mt-1 text-sm text-muted-foreground">The name and visual cue shown across your platform.</p></div>
        <FormField
          control={form.control}
          name="systemName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>System name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tagline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tagline</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo URL</FormLabel>
              <FormControl>
                <Input {...field} placeholder="https://..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        </section>
        <section className="grid gap-4 rounded-2xl border border-border/70 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><p className="font-medium">Onboarding & support</p><p className="mt-1 text-sm text-muted-foreground">Set the default trial window and the place customers can reach you.</p></div>
        <FormField
          control={form.control}
          name="supportEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Support email</FormLabel>
              <FormControl>
                <Input {...field} type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="defaultTrialDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default trial days</FormLabel>
              <FormControl>
                <Input {...field} value={field.value as number} type="number" min={0} max={365} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="primaryColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary color</FormLabel>
              <FormControl>
                <ColorSwatchInput value={field.value ?? ""} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        </section>
        <section className="grid gap-4 rounded-2xl border border-border/70 p-4">
          <div><p className="font-medium">Public policies</p><p className="mt-1 text-sm text-muted-foreground">This copy is ready for public-facing policy and support pages.</p></div>
        <FormField
          control={form.control}
          name="privacyPolicy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Privacy policy</FormLabel>
              <FormControl>
                <Textarea {...field} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="termsOfUse"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Terms of use</FormLabel>
              <FormControl>
                <Textarea {...field} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="helpCenterContent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Help center content</FormLabel>
              <FormControl>
                <Textarea {...field} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        </section>
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </Form>
  );
}
