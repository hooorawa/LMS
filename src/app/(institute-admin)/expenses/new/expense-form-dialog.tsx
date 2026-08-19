"use client";

import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/form-dialog";
import { ExpenseForm } from "./expense-form";

export function ExpenseFormDialog() {
  const router = useRouter();

  return (
    <FormDialog trigger="New expense" title="New expense" tone="create">
      {({ close, resetKey, resetForm }) => (
        <ExpenseForm
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
