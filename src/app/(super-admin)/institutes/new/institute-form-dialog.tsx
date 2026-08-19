"use client";

import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/form-dialog";
import { InstituteForm } from "./institute-form";

export function InstituteFormDialog() {
  const router = useRouter();

  return (
    <FormDialog trigger="New institute" title="New institute" tone="create" size="lg">
      {({ close, resetKey, resetForm }) => (
        <InstituteForm
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
