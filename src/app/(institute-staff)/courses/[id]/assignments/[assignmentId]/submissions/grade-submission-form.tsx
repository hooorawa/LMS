"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { gradeSubmission, type GradeSubmissionState } from "@/lib/actions/submission.actions";
import { gradeSubmissionSchema } from "@/lib/validation/submission.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const initialState: GradeSubmissionState = {};

type GradeSubmissionInput = z.input<typeof gradeSubmissionSchema>;

export function GradeSubmissionForm({
  submissionId,
  maxScore,
  score,
  feedback,
}: {
  submissionId: string;
  maxScore: number;
  score?: number;
  feedback?: string;
}) {
  const [state, formAction, pending] = useActionState(gradeSubmission, initialState);

  const form = useForm<GradeSubmissionInput>({
    resolver: zodResolver(gradeSubmissionSchema),
    defaultValues: { score: score ?? "", feedback: feedback ?? "" },
  });

  useEffect(() => {
    if (state.error) toast.error("Could not save grade", state.error);
    if (state.success) toast.success("Grade saved");
  }, [state.error, state.success]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("submissionId", submissionId);
    formData.append("score", String(values.score));
    formData.append("feedback", values.feedback ?? "");
    startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <FormField
          control={form.control}
          name="score"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Score (out of {maxScore})</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={(field.value as number | string) ?? ""}
                  type="number"
                  min={0}
                  max={maxScore}
                  step="any"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="feedback"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feedback (optional)</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending} size="sm" className="self-start">
          {pending ? "Saving..." : "Save grade"}
        </Button>
      </form>
    </Form>
  );
}
