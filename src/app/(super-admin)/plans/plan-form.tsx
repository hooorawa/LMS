"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createPlan, updatePlan, type PlanFormState } from "@/lib/actions/subscription.actions";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const initialState: PlanFormState = {};

// Mirrors createSubscriptionPlanSchema's constraints, flattened to match the form's field layout
// (limits are nested server-side, individual inputs client-side). Server action remains the source of truth.
const planFormSchema = z.object({
  name: z.string().trim().min(2, "Plan name must be at least 2 characters."),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters.")
    .max(40, "Slug must be at most 40 characters.")
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens."),
  description: z.string().trim().optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Price cannot be negative."),
  currency: z.string().trim().min(3).max(3),
  billingInterval: z.enum(["monthly", "yearly"]),
  maxStudents: z.union([z.coerce.number().int().positive(), z.literal("")]).optional(),
  maxStaff: z.union([z.coerce.number().int().positive(), z.literal("")]).optional(),
  maxClasses: z.union([z.coerce.number().int().positive(), z.literal("")]).optional(),
  maxSubjects: z.union([z.coerce.number().int().positive(), z.literal("")]).optional(),
  storageMb: z.union([z.coerce.number().int().positive(), z.literal("")]).optional(),
  features: z.string().optional(),
  isActive: z.boolean(),
  isPublic: z.boolean(),
  sortOrder: z.coerce.number().int(),
});

type PlanFormInput = z.input<typeof planFormSchema>;

type PlanFormProps = {
  plan?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price: number;
    currency: string;
    billingInterval: string;
    limits: {
      maxStudents?: number | null;
      maxStaff?: number | null;
      maxClasses?: number | null;
      maxSubjects?: number | null;
      storageMb?: number | null;
    };
    features: string[];
    isActive: boolean;
    isPublic: boolean;
    sortOrder: number;
  };
  onSuccess?: () => void;
};

export function PlanForm({ plan, onSuccess }: PlanFormProps) {
  const router = useRouter();
  const action = plan ? updatePlan : createPlan;
  const [state, formAction, pending] = useActionState(action, initialState);

  const form = useForm<PlanFormInput>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: plan?.name ?? "",
      slug: plan?.slug ?? "",
      description: plan?.description ?? "",
      price: plan?.price ?? 0,
      currency: plan?.currency ?? "USD",
      billingInterval: (plan?.billingInterval as "monthly" | "yearly") ?? "monthly",
      maxStudents: plan?.limits.maxStudents ?? "",
      maxStaff: plan?.limits.maxStaff ?? "",
      maxClasses: plan?.limits.maxClasses ?? "",
      maxSubjects: plan?.limits.maxSubjects ?? "",
      storageMb: plan?.limits.storageMb ?? "",
      features: plan?.features.join("\n") ?? "",
      isActive: plan?.isActive ?? true,
      isPublic: plan?.isPublic ?? true,
      sortOrder: plan?.sortOrder ?? 0,
    },
  });
  const [isActive, isPublic] = useWatch({
    control: form.control,
    name: ["isActive", "isPublic"],
  });

  useEffect(() => {
    if (state.error) toast.error("Could not save plan", state.error);
  }, [state.error]);

  useEffect(() => {
    if (state.success) {
      if (plan) {
        toast.success(`"${plan.name}" updated`);
        onSuccess?.();
      } else {
        router.push(`/plans/${state.planId}`);
      }
    }
  }, [state.success, state.planId, plan, onSuccess, router]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    if (plan) formData.append("id", plan.id);
    formData.append("name", values.name);
    formData.append("slug", values.slug);
    formData.append("description", values.description ?? "");
    formData.append("price", String(values.price));
    formData.append("currency", values.currency);
    formData.append("billingInterval", values.billingInterval);
    formData.append("maxStudents", String(values.maxStudents ?? ""));
    formData.append("maxStaff", String(values.maxStaff ?? ""));
    formData.append("maxClasses", String(values.maxClasses ?? ""));
    formData.append("maxSubjects", String(values.maxSubjects ?? ""));
    formData.append("storageMb", String(values.storageMb ?? ""));
    formData.append("features", values.features ?? "");
    if (values.isActive) formData.append("isActive", "on");
    if (values.isPublic) formData.append("isPublic", "on");
    formData.append("sortOrder", String(values.sortOrder));
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
              <FormLabel>Plan name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. pro" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value as number} type="number" step="0.01" min="0" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <FormControl>
                  <Input {...field} maxLength={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="billingInterval"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Billing interval</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectPopup>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectPopup>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <hr className="border-border" />
        <p className="text-sm font-medium">Limits (blank = unlimited)</p>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="maxStudents"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max students</FormLabel>
                <FormControl>
                  <Input {...field} value={(field.value as number | string | undefined) ?? ""} type="number" min="1" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxStaff"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max staff</FormLabel>
                <FormControl>
                  <Input {...field} value={(field.value as number | string | undefined) ?? ""} type="number" min="1" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxClasses"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max classes</FormLabel>
                <FormControl>
                  <Input {...field} value={(field.value as number | string | undefined) ?? ""} type="number" min="1" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxSubjects"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max subjects</FormLabel>
                <FormControl>
                  <Input {...field} value={(field.value as number | string | undefined) ?? ""} type="number" min="1" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="storageMb"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Storage (MB)</FormLabel>
                <FormControl>
                  <Input {...field} value={(field.value as number | string | undefined) ?? ""} type="number" min="1" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="features"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Features (one per line)</FormLabel>
              <FormControl>
                <Textarea {...field} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sortOrder"
          render={({ field }) => (
            <FormItem className="w-fit">
              <FormLabel>Sort order</FormLabel>
              <FormControl>
                <Input {...field} value={field.value as number} type="number" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-4">
          <Label className="flex items-center gap-2 font-normal">
            <Checkbox
              checked={Boolean(isActive)}
              onCheckedChange={(next) => form.setValue("isActive", Boolean(next))}
            />
            Active
          </Label>
          <Label className="flex items-center gap-2 font-normal">
            <Checkbox
              checked={Boolean(isPublic)}
              onCheckedChange={(next) => form.setValue("isPublic", Boolean(next))}
            />
            Public
          </Label>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : plan ? "Save changes" : "Create plan"}
        </Button>
      </form>
    </Form>
  );
}
