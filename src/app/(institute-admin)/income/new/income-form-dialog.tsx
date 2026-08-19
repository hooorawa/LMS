"use client";

import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/form-dialog";
import { IncomeForm } from "./income-form";

export function IncomeFormDialog() {
  const router = useRouter();

  return (
    <FormDialog trigger="New income" title="New income" tone="create">
      {({ close, resetKey, resetForm }) => (
        <IncomeForm
          key={resetKey}
          onDone={() => {
            close();
            router.refresh();
          }}
          onCreateAnother={resetForm}
        />
      )}
    </FormDialog>
  );
}
