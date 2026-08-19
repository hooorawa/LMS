"use client";

import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/form-dialog";
import { AnnouncementForm } from "./announcement-form";

export function AnnouncementFormDialog({
  allowInstitute,
  classes,
  courses,
}: {
  allowInstitute: boolean;
  classes: { id: string; name: string; section?: string }[];
  courses: { id: string; title: string }[];
}) {
  const router = useRouter();

  return (
    <FormDialog trigger="New announcement" title="New announcement" tone="create" size="lg">
      {({ close, resetKey, resetForm }) => (
        <AnnouncementForm
          key={resetKey}
          allowInstitute={allowInstitute}
          classes={classes}
          courses={courses}
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
