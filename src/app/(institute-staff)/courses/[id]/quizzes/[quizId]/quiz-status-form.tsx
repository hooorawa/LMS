import { Button } from "@/components/ui/button";
import { setQuizStatus } from "@/lib/actions/quiz.actions";
import type { QuizStatus } from "@/models/Quiz";

const TRANSITIONS: Record<QuizStatus, { label: string; status: QuizStatus }> = {
  draft: { label: "Publish", status: "published" },
  published: { label: "Move to draft", status: "draft" },
};

export function QuizStatusForm({ quizId, status }: { quizId: string; status: QuizStatus }) {
  const transition = TRANSITIONS[status];

  return (
    <form action={setQuizStatus}>
      <input type="hidden" name="id" value={quizId} />
      <input type="hidden" name="status" value={transition.status} />
      <Button type="submit" variant="outline" size="sm">
        {transition.label}
      </Button>
    </form>
  );
}
