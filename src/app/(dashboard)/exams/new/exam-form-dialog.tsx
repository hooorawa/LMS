"use client";

import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/form-dialog";
import { ExamForm } from "./exam-form";

export function ExamFormDialog({
  subjects,
  classes,
}: {
  subjects: { id: string; name: string }[];
  classes: { id: string; name: string; section?: string }[];
}) {
  const router = useRouter();

  return (
    <FormDialog trigger="Schedule exam" title="Schedule exam" tone="create" size="lg">
      {({ close, resetKey, resetForm }) => (
        <ExamForm
          key={resetKey}
          subjects={subjects}
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
