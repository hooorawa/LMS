"use client";

import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/form-dialog";
import { QuizEditForm } from "./quiz-edit-form";

export function QuizEditDialog({
  quizId,
  title,
  instructions,
  timeLimitMinutes,
  status,
}: {
  quizId: string;
  title: string;
  instructions: string;
  timeLimitMinutes: number;
  status: "draft" | "published";
}) {
  const router = useRouter();

  return (
    <FormDialog trigger="Edit details" triggerVariant="outline" triggerSize="sm" title="Edit quiz" tone="edit">
      {({ close, resetKey }) => (
        <QuizEditForm
          key={resetKey}
          quizId={quizId}
          title={title}
          instructions={instructions}
          timeLimitMinutes={timeLimitMinutes}
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
