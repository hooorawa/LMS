"use client";

import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/form-dialog";
import { FeeEditForm } from "./fee-edit-form";

export function FeeEditDialog({
  feeId,
  title,
  amount,
  dueDate,
  academicYear,
  frequency,
  classId,
  studentId,
  classes,
  students,
}: {
  feeId: string;
  title: string;
  amount: number;
  dueDate: string;
  academicYear: string;
  frequency: string;
  classId: string;
  studentId: string;
  classes: { id: string; name: string; section?: string }[];
  students: { id: string; name: string }[];
}) {
  const router = useRouter();

  return (
    <FormDialog trigger="Edit" triggerVariant="outline" triggerSize="sm" title="Edit fee" tone="edit" size="lg">
      {({ close, resetKey }) => (
        <FeeEditForm
          key={resetKey}
          feeId={feeId}
          title={title}
          amount={amount}
          dueDate={dueDate}
          academicYear={academicYear}
          frequency={frequency}
          classId={classId}
          studentId={studentId}
          classes={classes}
          students={students}
          onSuccess={() => {
            close();
            router.refresh();
          }}
        />
      )}
    </FormDialog>
  );
}
