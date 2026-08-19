"use client";

import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/form-dialog";
import { CourseForm } from "./course-form";

export function CourseFormDialog({
  subjects,
  classes,
}: {
  subjects: { id: string; name: string }[];
  classes: { id: string; label: string }[];
}) {
  const router = useRouter();

  return (
    <FormDialog trigger="New course" title="New course" tone="create" size="lg">
      {({ close, resetKey }) => (
        <CourseForm
          key={resetKey}
          subjects={subjects}
          classes={classes}
          onDone={() => {
            close();
            router.refresh();
          }}
        />
      )}
    </FormDialog>
  );
}
