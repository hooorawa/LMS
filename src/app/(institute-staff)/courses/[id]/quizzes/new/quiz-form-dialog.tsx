"use client";

import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/form-dialog";
import { QuizForm } from "./quiz-form";

export function QuizFormDialog({ courseId }: { courseId: string }) {
  const router = useRouter();

  return (
    <FormDialog trigger="New quiz" title="New quiz" tone="create">
      {({ close, resetKey }) => (
        <QuizForm
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
