"use client";

import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/form-dialog";
import { AssignmentEditForm } from "./assignment-edit-form";

export function AssignmentEditDialog({
  assignmentId,
  courseId,
  title,
  instructions,
  dueAt,
  maxScore,
  attachmentKey,
  status,
}: {
  assignmentId: string;
  courseId: string;
  title: string;
  instructions: string;
  dueAt: string;
  maxScore: number;
  attachmentKey: string;
  status: "draft" | "published";
}) {
  const router = useRouter();

  return (
    <FormDialog
      trigger="Edit details"
      triggerVariant="outline"
      triggerSize="sm"
      title="Edit assignment"
      tone="edit"
      size="lg"
    >
      {({ close, resetKey }) => (
        <AssignmentEditForm
          key={resetKey}
          assignmentId={assignmentId}
          courseId={courseId}
          title={title}
          instructions={instructions}
          dueAt={dueAt}
          maxScore={maxScore}
          attachmentKey={attachmentKey}
          status={status}
          onSuccess={() => {
            close();
            router.refresh();
          }}
        />
      )}
    </FormDialog>
  );
}
