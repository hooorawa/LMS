"use client";

import { Textarea } from "@/components/ui/textarea";

export type StudentQuestion = {
  _id: string;
  type: "mcq" | "truefalse" | "short";
  prompt: string;
  points: number;
  options?: string[];
};

export type AnswerValue =
  | { type: "mcq"; selectedOptionIndex?: number }
  | { type: "truefalse"; selectedBoolean?: boolean }
  | { type: "short"; textAnswer?: string };

export function QuestionRenderer({
  question,
  index,
  answer,
  onChange,
}: {
  question: StudentQuestion;
  index: number;
  answer: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="mb-3 text-sm font-medium">
        {index + 1}. {question.prompt}{" "}
        <span className="text-xs font-normal text-muted-foreground">
          ({question.points} pt{question.points === 1 ? "" : "s"})
        </span>
      </p>

      {question.type === "mcq" ? (
        <div className="flex flex-col gap-2">
          {(question.options ?? []).map((option, optionIndex) => (
            <label key={optionIndex} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`question-${question._id}`}
                checked={answer?.type === "mcq" && answer.selectedOptionIndex === optionIndex}
                onChange={() => onChange({ type: "mcq", selectedOptionIndex: optionIndex })}
                className="h-4 w-4"
              />
              {option}
            </label>
          ))}
        </div>
      ) : null}

      {question.type === "truefalse" ? (
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={`question-${question._id}`}
              checked={answer?.type === "truefalse" && answer.selectedBoolean === true}
              onChange={() => onChange({ type: "truefalse", selectedBoolean: true })}
              className="h-4 w-4"
            />
            True
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={`question-${question._id}`}
              checked={answer?.type === "truefalse" && answer.selectedBoolean === false}
              onChange={() => onChange({ type: "truefalse", selectedBoolean: false })}
              className="h-4 w-4"
            />
            False
          </label>
        </div>
      ) : null}

      {question.type === "short" ? (
        <Textarea
          rows={3}
          value={answer?.type === "short" ? (answer.textAnswer ?? "") : ""}
          onChange={(event) => onChange({ type: "short", textAnswer: event.target.value })}
        />
      ) : null}
    </div>
  );
}
