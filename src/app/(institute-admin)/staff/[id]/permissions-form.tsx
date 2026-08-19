"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { updateStaffPermissions } from "@/lib/actions/user.actions";
import { updateStaffPermissionsSchema } from "@/lib/validation/user.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Form } from "@/components/ui/form";

type UpdateStaffPermissionsInput = z.input<typeof updateStaffPermissionsSchema>;

const PERMISSION_FIELDS: { key: keyof UpdateStaffPermissionsInput; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "staff", label: "Staff" },
  { key: "students", label: "Students" },
  { key: "subjects", label: "Subjects" },
  { key: "classes", label: "Classes" },
  { key: "expenses", label: "Expenses" },
  { key: "salary", label: "Salary" },
  { key: "income", label: "Income" },
];

export function PermissionsForm({
  staffId,
  permissions,
}: {
  staffId: string;
  permissions: Record<string, boolean | undefined>;
}) {
  const [state, formAction, pending] = useActionState(updateStaffPermissions, {});

  const form = useForm<UpdateStaffPermissionsInput>({
    resolver: zodResolver(updateStaffPermissionsSchema),
    defaultValues: PERMISSION_FIELDS.reduce(
      (acc, { key }) => ({ ...acc, [key]: Boolean(permissions?.[key]) }),
      {} as UpdateStaffPermissionsInput
    ),
  });
  const watchedPermissions = useWatch({ control: form.control });

  useEffect(() => {
    if (state.error) toast.error("Could not update permissions", state.error);
    if (state.success) toast.success("Permissions updated");
  }, [state.error, state.success]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("staffId", staffId);
    PERMISSION_FIELDS.forEach(({ key }) => {
      if (values[key]) formData.append(key, "on");
    });
    startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PERMISSION_FIELDS.map(({ key, label }) => (
            <Label key={key} className="flex items-center gap-2 font-normal">
              <Checkbox
                checked={Boolean(watchedPermissions?.[key])}
                disabled={key === "dashboard"}
                onCheckedChange={(next) => form.setValue(key, Boolean(next))}
              />
              {label}
            </Label>
          ))}
        </div>
        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Saving..." : "Save permissions"}
        </Button>
      </form>
    </Form>
  );
}
