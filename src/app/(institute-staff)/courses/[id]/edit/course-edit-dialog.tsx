"use client";

import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/form-dialog";
import { CourseEditForm } from "./course-edit-form";

export function CourseEditDialog({
  courseId,
  title,
  description,
  subjectId,
  classIds,
  status,
  subjects,
  classes,
}: {
  courseId: string;
  title: string;
  description: string;
  subjectId: string;
  classIds: string[];
  status: string;
  subjects: { id: string; name: string }[];
  classes: { id: string; label: string }[];
}) {
  const router = useRouter();

  return (
    <FormDialog
      trigger="Edit details"
      triggerVariant="outline"
      triggerSize="sm"
      title="Edit course"
      tone="edit"
      size="lg"
    >
      {({ close, resetKey }) => (
        <CourseEditForm
          key={resetKey}
          courseId={courseId}
          title={title}
          description={description}
          subjectId={subjectId}
          classIds={classIds}
          status={status}
          subjects={subjects}
          classes={classes}
          onSuccess={() => {
            close();
            router.refresh();
          }}
        />
      )}
    </FormDialog>
  );
}
