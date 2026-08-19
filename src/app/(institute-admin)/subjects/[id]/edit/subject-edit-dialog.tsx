"use client";

import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/form-dialog";
import { SubjectEditForm } from "./subject-edit-form";

export function SubjectEditDialog({
  subjectId,
  name,
  code,
  teacherId,
  classIds,
  teachers,
  classes,
}: {
  subjectId: string;
  name: string;
  code: string;
  teacherId: string;
  classIds: string[];
  teachers: { id: string; name: string }[];
  classes: { id: string; label: string }[];
}) {
  const router = useRouter();

  return (
    <FormDialog trigger="Edit" triggerVariant="outline" triggerSize="sm" title="Edit subject" tone="edit" size="lg">
      {({ close, resetKey }) => (
        <SubjectEditForm
          key={resetKey}
          subjectId={subjectId}
          name={name}
          code={code}
          teacherId={teacherId}
          classIds={classIds}
          teachers={teachers}
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
