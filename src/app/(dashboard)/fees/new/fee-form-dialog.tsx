"use client";

import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/form-dialog";
import { FeeForm } from "./fee-form";

export function FeeFormDialog({
  classes,
  students,
}: {
  classes: { id: string; name: string; section?: string }[];
  students: { id: string; name: string }[];
}) {
  const router = useRouter();

  return (
    <FormDialog trigger="New fee" title="New fee" tone="create" size="lg">
      {({ close, resetKey, resetForm }) => (
        <FeeForm
          key={resetKey}
          classes={classes}
          students={students}
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
