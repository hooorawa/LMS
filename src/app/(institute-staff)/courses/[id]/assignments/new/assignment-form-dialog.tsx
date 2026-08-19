"use client";

import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/form-dialog";
import { AssignmentForm } from "./assignment-form";

export function AssignmentFormDialog({ courseId }: { courseId: string }) {
  const router = useRouter();

  return (
    <FormDialog trigger="New assignment" title="New assignment" tone="create" size="lg">
      {({ close, resetKey }) => (
        <AssignmentForm
          key={resetKey}
          courseId={courseId}
          onDone={() => {
            close();
            router.refresh();
          }}
        />
      )}
    </FormDialog>
  );
}
