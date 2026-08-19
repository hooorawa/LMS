"use client";

import { FormDialog } from "@/components/form-dialog";
import { PlanForm } from "../plan-form";

export function PlanFormDialog() {
  return (
    <FormDialog trigger="New plan" title="New plan" tone="create" size="lg">
      {({ resetKey }) => <PlanForm key={resetKey} />}
    </FormDialog>
  );
}
