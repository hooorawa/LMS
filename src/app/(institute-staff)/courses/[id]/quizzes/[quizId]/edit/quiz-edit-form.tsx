"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { updateQuiz, type UpdateQuizState } from "@/lib/actions/quiz.actions";
import { updateQuizSchema } from "@/lib/validation/quiz.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const initialState: UpdateQuizState = {};

type UpdateQuizInput = z.input<typeof updateQuizSchema>;

export function QuizEditForm({
  quizId,
  title,
  instructions,
  timeLimitMinutes,
  status,
  onSuccess,
}: {
  quizId: string;
  title: string;
  instructions: string;
  timeLimitMinutes: number;
  status: "draft" | "published";
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateQuiz, initialState);

  const form = useForm<UpdateQuizInput>({
    resolver: zodResolver(updateQuizSchema),
    defaultValues: { title, instructions, timeLimitMinutes, status },
  });

  useEffect(() => {
    if (state.error) toast.error("Could not update quiz", state.error);
  }, [state.error]);

  useEffect(() => {
    if (state.success) {
      toast.success(`"${state.success.title}" updated`);
      onSuccess?.();
    }
  }, [state.success, onSuccess]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("id", quizId);
    formData.append("status", status);
    formData.append("title", values.title);
    formData.append("instructions", values.instructions ?? "");
    formData.append("timeLimitMinutes", String(values.timeLimitMinutes));
    startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructions</FormLabel>
              <FormControl>
                <Textarea {...field} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="timeLimitMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time limit (minutes)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value as number} type="number" min={1} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </Form>
  );
}
