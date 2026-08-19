import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { deleteQuizQuestion, moveQuizQuestion } from "@/lib/actions/quiz-question.actions";
import { QuizQuestionEditDialog } from "./questions/[questionId]/edit/quiz-question-edit-dialog";

const TYPE_LABEL: Record<string, string> = {
  mcq: "Multiple choice",
  truefalse: "True/False",
  short: "Short answer",
};

type QuestionSummary = {
  _id: unknown;
  prompt: string;
  type: string;
  points: number;
  options?: string[];
  correctOptionIndex?: number | null;
  correctBoolean?: boolean | null;
  sampleAnswer?: string;
};

export function QuestionList({
  questions,
}: {
  questions: QuestionSummary[];
}) {
  if (questions.length === 0) {
    return <p className="text-sm text-muted-foreground">No questions yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {questions.map((question, index) => {
        const questionId = String(question._id);
        return (
          <li
            key={questionId}
            className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{question.prompt}</span>
              <Badge variant="secondary">{TYPE_LABEL[question.type] ?? question.type}</Badge>
              <Badge variant="secondary">
                {question.points} pt{question.points === 1 ? "" : "s"}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <form action={moveQuizQuestion}>
                <input type="hidden" name="id" value={questionId} />
                <input type="hidden" name="direction" value="up" />
                <Button
                  type="submit"
                  variant="outline"
                  size="icon-sm"
                  disabled={index === 0}
                  title="Move up"
                >
                  ↑
                </Button>
              </form>
              <form action={moveQuizQuestion}>
                <input type="hidden" name="id" value={questionId} />
                <input type="hidden" name="direction" value="down" />
                <Button
                  type="submit"
                  variant="outline"
                  size="icon-sm"
                  disabled={index === questions.length - 1}
                  title="Move down"
                >
                  ↓
                </Button>
              </form>
              <QuizQuestionEditDialog
                questionId={questionId}
                type={question.type as "mcq" | "truefalse" | "short"}
                prompt={question.prompt}
                points={question.points}
                options={question.options ?? []}
                correctOptionIndex={question.correctOptionIndex ?? null}
                correctBoolean={question.correctBoolean ?? null}
                sampleAnswer={question.sampleAnswer ?? ""}
              />
              <ConfirmDeleteButton
                action={deleteQuizQuestion}
                hiddenFields={{ id: questionId }}
                itemLabel="question"
                triggerLabel="×"
                size="icon-sm"
                title="Delete"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
