"use client";

import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/form-dialog";
import { ClassEditForm } from "./class-edit-form";

export function ClassEditDialog({
  classId,
  name,
  section,
  academicYear,
  classTeacherId,
  status,
  teachers,
}: {
  classId: string;
  name: string;
  section: string;
  academicYear: string;
  classTeacherId: string;
  status: string;
  teachers: { id: string; name: string }[];
}) {
  const router = useRouter();

  return (
    <FormDialog
      trigger="Edit"
      triggerVariant="outline"
      triggerSize="sm"
      title="Edit class"
      tone="edit"
    >
      {({ close, resetKey }) => (
        <ClassEditForm
          key={resetKey}
          classId={classId}
          name={name}
          section={section}
          academicYear={academicYear}
          classTeacherId={classTeacherId}
          status={status}
          teachers={teachers}
          onSuccess={() => {
            close();
            router.refresh();
          }}
        />
      )}
    </FormDialog>
  );
}
