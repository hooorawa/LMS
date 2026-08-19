"use client";

import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/form-dialog";
import { PlanForm } from "../plan-form";

type PlanFormPlan = NonNullable<Parameters<typeof PlanForm>[0]["plan"]>;

export function PlanEditDialog({ plan }: { plan: PlanFormPlan }) {
  const router = useRouter();

  return (
    <FormDialog trigger="Edit plan" triggerVariant="outline" title="Edit plan" tone="edit" size="lg">
      {({ close, resetKey }) => (
        <PlanForm
          key={resetKey}
          plan={plan}
          onSuccess={() => {
            close();
            router.refresh();
          }}
        />
      )}
    </FormDialog>
  );
}
