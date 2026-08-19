"use client";

import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/form-dialog";
import { LessonEditForm } from "./lesson-edit-form";

export function LessonEditDialog({
  lessonId,
  courseId,
  title,
  type,
  contentUrl,
  textBody,
  durationSeconds,
  isPreview,
}: {
  lessonId: string;
  courseId: string;
  title: string;
  type: "video" | "pdf" | "text" | "link";
  contentUrl: string;
  textBody: string;
  durationSeconds: number | null;
  isPreview: boolean;
}) {
  const router = useRouter();

  return (
    <FormDialog
      trigger="Edit"
      triggerVariant="outline"
      triggerSize="xs"
      title="Edit lesson"
      tone="edit"
      size="lg"
    >
      {({ close, resetKey }) => (
        <LessonEditForm
          key={resetKey}
          lessonId={lessonId}
          courseId={courseId}
          title={title}
          type={type}
          contentUrl={contentUrl}
          textBody={textBody}
          durationSeconds={durationSeconds}
          isPreview={isPreview}
          onSuccess={() => {
            close();
            router.refresh();
          }}
        />
      )}
    </FormDialog>
  );
}
