"use client";

import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/form-dialog";
import { StaffForm } from "./staff-form";

export function StaffFormDialog() {
  const router = useRouter();

  return (
    <FormDialog trigger="New staff member" title="New staff member" tone="create" size="lg">
      {({ close, resetKey, resetForm }) => (
        <StaffForm
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
