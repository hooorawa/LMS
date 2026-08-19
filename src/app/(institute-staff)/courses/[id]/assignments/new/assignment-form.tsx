"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createAssignment, type CreateAssignmentState } from "@/lib/actions/assignment.actions";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FileUploader } from "@/components/shared/file-uploader";

const initialState: CreateAssignmentState = {};

// dueAt kept as a raw datetime-local string client-side; createAssignmentSchema's z.coerce.date()
// remains the server-side source of truth in the action.
const assignmentFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  instructions: z.string().trim().optional(),
  dueAt: z.string().trim().min(1, "Due date is required."),
  maxScore: z.coerce.number().int().positive(),
  attachmentKey: z.string().trim().optional(),
});

type AssignmentFormInput = z.input<typeof assignmentFormSchema>;

export function AssignmentForm({
  courseId,
  onDone,
}: {
  courseId: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createAssignment, initialState);

  const form = useForm<AssignmentFormInput>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: { title: "", instructions: "", dueAt: "", maxScore: 100, attachmentKey: "" },
  });

  useEffect(() => {
    if (state.error) toast.error("Could not create assignment", state.error);
  }, [state.error]);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <p className="font-medium">&ldquo;{state.success.title}&rdquo; created.</p>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => router.push(`/courses/${courseId}/assignments/${state.success!.assignmentId}`)}
          >
            View assignment
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
    formData.append("dueAt", values.dueAt);
    formData.append("maxScore", String(values.maxScore));
    formData.append("attachmentKey", values.attachmentKey ?? "");
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
                <Input {...field} placeholder="e.g. Problem Set 1" />
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
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="dueAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due</FormLabel>
                <FormControl>
                  <Input {...field} type="datetime-local" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max score</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value as number} type="number" min={1} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="attachmentKey"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FileUploader
                  courseId={courseId}
                  name="attachmentKey"
                  label="Reference attachment (optional)"
                  accept="application/pdf,image/png,image/jpeg,.doc,.docx,.zip"
                  onUploaded={(key) => field.onChange(key)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Creating..." : "Create assignment"}
        </Button>
      </form>
    </Form>
  );
}
