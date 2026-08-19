"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { createQuiz, type CreateQuizState } from "@/lib/actions/quiz.actions";
import { createQuizSchema } from "@/lib/validation/quiz.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const initialState: CreateQuizState = {};

type CreateQuizInput = z.input<typeof createQuizSchema>;

export function QuizForm({ courseId, onDone }: { courseId: string; onDone?: () => void }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createQuiz, initialState);

  const form = useForm<CreateQuizInput>({
    resolver: zodResolver(createQuizSchema),
    defaultValues: { title: "", instructions: "", timeLimitMinutes: 30 },
  });

  useEffect(() => {
    if (state.error) toast.error("Could not create quiz", state.error);
  }, [state.error]);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <p className="font-medium">&ldquo;{state.success.title}&rdquo; created.</p>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => router.push(`/courses/${courseId}/quizzes/${state.success!.quizId}`)}
          >
            View quiz
          </Button>
          <Button type="button" variant="outline" onClick={onDone}>
            Back to list
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("courseId", courseId);
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
                <Input {...field} placeholder="e.g. Chapter 1 Quiz" />
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
          {pending ? "Creating..." : "Create quiz"}
        </Button>
      </form>
    </Form>
  );
}
