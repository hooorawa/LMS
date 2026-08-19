"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { gradeShortAnswer, type GradeShortAnswerState } from "@/lib/actions/quiz-attempt.actions";
import { gradeShortAnswerSchema } from "@/lib/validation/quiz-attempt.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const initialState: GradeShortAnswerState = {};

type GradeShortAnswerInput = z.input<typeof gradeShortAnswerSchema>;

export function GradeShortAnswerForm({
  attemptId,
  questionId,
  maxPoints,
  pointsAwarded,
  graded,
}: {
  attemptId: string;
  questionId: string;
  maxPoints: number;
  pointsAwarded: number;
  graded: boolean;
}) {
  const [state, formAction, pending] = useActionState(gradeShortAnswer, initialState);

  const form = useForm<GradeShortAnswerInput>({
    resolver: zodResolver(gradeShortAnswerSchema),
    defaultValues: { points: graded ? pointsAwarded : "" },
  });

  useEffect(() => {
    if (state.error) toast.error("Could not save points", state.error);
    if (state.success) toast.success("Saved");
  }, [state.error, state.success]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("attemptId", attemptId);
    formData.append("questionId", questionId);
    formData.append("points", String(values.points));
    startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex items-end gap-3">
        <FormField
          control={form.control}
          name="points"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Points (out of {maxPoints})</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={(field.value as number | string) ?? ""}
                  type="number"
                  min={0}
                  max={maxPoints}
                  step="any"
                  className="w-32"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Saving..." : graded ? "Update" : "Award points"}
        </Button>
      </form>
    </Form>
  );
}
