"use client";

import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/form-dialog";
import { QuizQuestionEditForm } from "./quiz-question-edit-form";

export function QuizQuestionEditDialog({
  questionId,
  type,
  prompt,
  points,
  options,
  correctOptionIndex,
  correctBoolean,
  sampleAnswer,
}: {
  questionId: string;
  type: "mcq" | "truefalse" | "short";
  prompt: string;
  points: number;
  options: string[];
  correctOptionIndex: number | null;
  correctBoolean: boolean | null;
  sampleAnswer: string;
}) {
  const router = useRouter();

  return (
    <FormDialog trigger="Edit" triggerVariant="outline" triggerSize="xs" title="Edit question" tone="edit" size="lg">
      {({ close, resetKey }) => (
        <QuizQuestionEditForm
          key={resetKey}
          questionId={questionId}
          type={type}
          prompt={prompt}
          points={points}
          options={options}
          correctOptionIndex={correctOptionIndex}
          correctBoolean={correctBoolean}
          sampleAnswer={sampleAnswer}
          onSuccess={() => {
            close();
            router.refresh();
          }}
        />
      )}
    </FormDialog>
  );
}
