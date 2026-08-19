"use client";

import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/form-dialog";
import { SubjectForm } from "./subject-form";

export function SubjectFormDialog({
  teachers,
  classes,
}: {
  teachers: { id: string; name: string }[];
  classes: { id: string; label: string }[];
}) {
  const router = useRouter();

  return (
    <FormDialog trigger="New subject" title="New subject" tone="create" size="lg">
      {({ close, resetKey, resetForm }) => (
        <SubjectForm
          key={resetKey}
          teachers={teachers}
          classes={classes}
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
