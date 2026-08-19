"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createLesson, type CreateLessonState } from "@/lib/actions/lesson.actions";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FileUploader } from "@/components/shared/file-uploader";

const initialState: CreateLessonState = {};

// Flattened for the form's conditional-field UX; createLessonSchema's discriminated union remains
// the server-side source of truth in the action.
const lessonFormSchema = z
  .object({
    title: z.string().trim().min(1, "Lesson title is required."),
    type: z.enum(["video", "pdf", "text", "link"]),
    textBody: z.string().trim().optional(),
    contentUrl: z.string().trim().optional(),
    durationSeconds: z.union([z.coerce.number().int().positive(), z.literal("")]).optional(),
    isPreview: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "text" && !data.textBody?.trim()) {
      ctx.addIssue({ code: "custom", message: "Lesson text is required.", path: ["textBody"] });
    }
    if (data.type === "video" && !data.contentUrl?.trim()) {
      ctx.addIssue({ code: "custom", message: "Upload a video before saving.", path: ["contentUrl"] });
    }
    if (data.type === "pdf" && !data.contentUrl?.trim()) {
      ctx.addIssue({ code: "custom", message: "Upload a PDF before saving.", path: ["contentUrl"] });
    }
    if (data.type === "link" && !/^https?:\/\/.+/.test(data.contentUrl ?? "")) {
      ctx.addIssue({ code: "custom", message: "Enter a valid URL.", path: ["contentUrl"] });
    }
  });

type LessonFormInput = z.input<typeof lessonFormSchema>;

export function AddLessonForm({ moduleId, courseId }: { moduleId: string; courseId: string }) {
  const [state, formAction, pending] = useActionState(createLesson, initialState);

  const form = useForm<LessonFormInput>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
      title: "",
      type: "text",
      textBody: "",
      contentUrl: "",
      durationSeconds: "",
      isPreview: false,
    },
  });

  const [type, isPreview] = useWatch({
    control: form.control,
    name: ["type", "isPreview"],
  });

  useEffect(() => {
    if (state.error) toast.error("Could not add lesson", state.error);
    if (state.success) form.reset();
  }, [state.error, state.success, form]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("moduleId", moduleId);
    formData.append("title", values.title);
    formData.append("type", values.type);
    if (values.type === "text") formData.append("textBody", values.textBody ?? "");
    if (values.type === "link" || values.type === "video" || values.type === "pdf") {
      formData.append("contentUrl", values.contentUrl ?? "");
    }
    if (values.type === "video" && values.durationSeconds !== "" && values.durationSeconds !== undefined) {
      formData.append("durationSeconds", String(values.durationSeconds));
    }
    if (values.isPreview) formData.append("isPreview", "on");
    startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson title</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Introduction" />
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
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                  </SelectPopup>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {type === "text" ? (
          <FormField
            control={form.control}
            name="textBody"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson content</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={4} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        {type === "link" ? (
          <FormField
            control={form.control}
            name="contentUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        {type === "video" ? (
          <>
            <FormField
              control={form.control}
              name="contentUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FileUploader
                      courseId={courseId}
                      name="contentUrl"
                      label="Video file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onUploaded={(key) => field.onChange(key)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="durationSeconds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (seconds)</FormLabel>
                  <FormControl>
                    <Input {...field} value={(field.value as number | string) ?? ""} type="number" min={1} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        ) : null}

        {type === "pdf" ? (
          <FormField
            control={form.control}
            name="contentUrl"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FileUploader
                    courseId={courseId}
                    name="contentUrl"
                    label="PDF file"
                    accept="application/pdf"
                    onUploaded={(key) => field.onChange(key)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <Label className="flex items-center gap-2 font-normal text-sm">
          <Checkbox
            checked={Boolean(isPreview)}
            onCheckedChange={(next) => form.setValue("isPreview", Boolean(next))}
          />
          Allow free preview (visible without enrollment)
        </Label>

        <Button type="submit" size="sm" disabled={pending} className="self-start">
          {pending ? "Adding..." : "Add lesson"}
        </Button>
      </form>
    </Form>
  );
}
