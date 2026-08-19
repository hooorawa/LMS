"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateQuizQuestion, type UpdateQuizQuestionState } from "@/lib/actions/quiz-question.actions";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const initialState: UpdateQuizQuestionState = {};

type QuestionType = "mcq" | "truefalse" | "short";

// Flattened for the form's conditional-field UX; updateQuizQuestionSchema's discriminated union
// remains the server-side source of truth in the action.
const questionFormSchema = z
  .object({
    prompt: z.string().trim().min(1, "Prompt is required."),
    type: z.enum(["mcq", "truefalse", "short"]),
    points: z.coerce.number().int().positive(),
    options: z.array(z.object({ value: z.string().trim() })),
    correctOptionIndex: z.union([z.coerce.number().int().nonnegative(), z.literal("")]).optional(),
    correctBoolean: z.boolean(),
    sampleAnswer: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "mcq") {
      const filled = data.options.filter((option) => option.value.trim().length > 0);
      if (filled.length < 2) {
        ctx.addIssue({ code: "custom", message: "Provide at least two options.", path: ["options"] });
      }
      if (data.correctOptionIndex === "" || data.correctOptionIndex === undefined) {
        ctx.addIssue({ code: "custom", message: "Select the correct option.", path: ["correctOptionIndex"] });
      } else if (data.correctOptionIndex >= data.options.length) {
        ctx.addIssue({
          code: "custom",
          message: "Correct option index is out of range.",
          path: ["correctOptionIndex"],
        });
      }
    }
  });

type QuestionFormInput = z.input<typeof questionFormSchema>;

export function QuizQuestionEditForm({
  questionId,
  type: initialType,
  prompt,
  points,
  options,
  correctOptionIndex,
  correctBoolean,
  sampleAnswer,
  onSuccess,
}: {
  questionId: string;
  type: QuestionType;
  prompt: string;
  points: number;
  options: string[];
  correctOptionIndex: number | null;
  correctBoolean: boolean | null;
  sampleAnswer: string;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateQuizQuestion, initialState);

  const form = useForm<QuestionFormInput>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      prompt,
      type: initialType,
      points,
      options: (options.length > 0 ? options : ["", ""]).map((value) => ({ value })),
      correctOptionIndex: correctOptionIndex ?? "",
      correctBoolean: correctBoolean ?? true,
      sampleAnswer,
    },
  });

  const { fields, append } = useFieldArray({ control: form.control, name: "options" });
  const type = useWatch({ control: form.control, name: "type" });

  useEffect(() => {
    if (state.error) toast.error("Could not update question", state.error);
  }, [state.error]);

  useEffect(() => {
    if (state.success) {
      toast.success("Question updated");
      onSuccess?.();
    }
  }, [state.success, onSuccess]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("id", questionId);
    formData.append("prompt", values.prompt);
    formData.append("type", values.type);
    formData.append("points", String(values.points));
    if (values.type === "mcq") {
      values.options.forEach((option) => formData.append("options", option.value));
      formData.append("correctOptionIndex", String(values.correctOptionIndex));
    }
    if (values.type === "truefalse") {
      formData.append("correctBoolean", values.correctBoolean ? "true" : "false");
    }
    if (values.type === "short") {
      formData.append("sampleAnswer", values.sampleAnswer ?? "");
    }
    startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prompt</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={2} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectPopup>
                    <SelectItem value="mcq">Multiple choice</SelectItem>
                    <SelectItem value="truefalse">True / False</SelectItem>
                    <SelectItem value="short">Short answer</SelectItem>
                  </SelectPopup>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="points"
          render={({ field }) => (
            <FormItem className="max-w-24">
              <FormLabel>Points</FormLabel>
              <FormControl>
                <Input {...field} value={field.value as number} type="number" min={1} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {type === "mcq" ? (
          <div className="flex flex-col gap-2">
            <FormLabel>Options</FormLabel>
            {fields.map((optionField, index) => (
              <FormField
                key={optionField.id}
                control={form.control}
                name={`options.${index}.value`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} placeholder={`Option ${index + 1}`} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => append({ value: "" })}
            >
              Add option
            </Button>
            <FormField
              control={form.control}
              name="correctOptionIndex"
              render={({ field }) => (
                <FormItem className="max-w-24">
                  <FormLabel>Correct option (index, starting at 0)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={(field.value as number | string) ?? ""}
                      type="number"
                      min={0}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : null}

        {type === "truefalse" ? (
          <FormField
            control={form.control}
            name="correctBoolean"
            render={({ field }) => (
              <FormItem className="max-w-32">
                <FormLabel>Correct answer</FormLabel>
                <Select
                  value={field.value ? "true" : "false"}
                  onValueChange={(value) => field.onChange(value === "true")}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectPopup>
                    <SelectItem value="true">True</SelectItem>
                    <SelectItem value="false">False</SelectItem>
                  </SelectPopup>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        {type === "short" ? (
          <FormField
            control={form.control}
            name="sampleAnswer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sample answer (reference only, not auto-graded)</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={2} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </Form>
  );
}
