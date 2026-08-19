"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitAssignment, type SubmitAssignmentState } from "@/lib/actions/submission.actions";
import {
  submitAssignmentSchema,
  type SubmitAssignmentInput,
} from "@/lib/validation/submission.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FileUploader } from "@/components/shared/file-uploader";

const initialState: SubmitAssignmentState = {};

export function SubmissionForm({
  assignmentId,
  textResponse,
  attachmentKey,
}: {
  assignmentId: string;
  textResponse: string;
  attachmentKey: string;
}) {
  const [state, formAction, pending] = useActionState(submitAssignment, initialState);

  const form = useForm<SubmitAssignmentInput>({
    resolver: zodResolver(submitAssignmentSchema),
    defaultValues: { textResponse, attachmentKey },
  });

  useEffect(() => {
    if (state.error) toast.error("Could not save submission", state.error);
    if (state.success) toast.success("Submission saved");
  }, [state.error, state.success]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("assignmentId", assignmentId);
    formData.append("textResponse", values.textResponse ?? "");
    formData.append("attachmentKey", values.attachmentKey ?? "");
    startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-4 rounded-xl border border-border p-4"
      >
        <FormField
          control={form.control}
          name="textResponse"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your response</FormLabel>
              <FormControl>
                <Textarea {...field} rows={6} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="attachmentKey"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FileUploader
                  name="attachmentKey"
                  label="Attachment (optional)"
                  accept="application/pdf,image/png,image/jpeg,.doc,.docx,.zip"
                  defaultKey={attachmentKey}
                  endpoint="/api/uploads/submissions/sign"
                  extraFields={{ assignmentId }}
                  onUploaded={(key) => field.onChange(key)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Submitting..." : attachmentKey || textResponse ? "Update submission" : "Submit"}
        </Button>
      </form>
    </Form>
  );
}
