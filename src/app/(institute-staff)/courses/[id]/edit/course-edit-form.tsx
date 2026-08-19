"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateCourse, type UpdateCourseState } from "@/lib/actions/course.actions";
import { updateCourseSchema, type UpdateCourseInput } from "@/lib/validation/course.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const initialState: UpdateCourseState = {};

export function CourseEditForm({
  courseId,
  title,
  description,
  subjectId,
  classIds,
  status,
  subjects,
  classes,
  onSuccess,
}: {
  courseId: string;
  title: string;
  description: string;
  subjectId: string;
  classIds: string[];
  status: string;
  subjects: { id: string; name: string }[];
  classes: { id: string; label: string }[];
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateCourse, initialState);

  const form = useForm<UpdateCourseInput>({
    resolver: zodResolver(updateCourseSchema),
    defaultValues: {
      title,
      description,
      subjectId,
      classIds,
      status: status as UpdateCourseInput["status"],
    },
  });

  useEffect(() => {
    if (state.error) toast.error("Could not update course", state.error);
  }, [state.error]);

  useEffect(() => {
    if (state.success) {
      toast.success(`"${state.success.title}" updated`);
      onSuccess?.();
    }
  }, [state.success, onSuccess]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("id", courseId);
    formData.append("title", values.title);
    formData.append("description", values.description ?? "");
    formData.append("subjectId", values.subjectId ?? "");
    values.classIds.forEach((id) => formData.append("classIds", id));
    formData.append("status", values.status);
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
              <FormLabel>Course title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subjectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Not linked to a subject" />
                  </SelectTrigger>
                </FormControl>
                <SelectPopup>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="classIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Classes</FormLabel>
              <FormControl>
                {classes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No classes yet.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {classes.map((klass) => {
                      const checked = field.value.includes(klass.id);
                      return (
                        <Label key={klass.id} className="flex items-center gap-2 font-normal">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(next) => {
                              field.onChange(
                                next
                                  ? [...field.value, klass.id]
                                  : field.value.filter((id) => id !== klass.id)
                              );
                            }}
                          />
                          {klass.label}
                        </Label>
                      );
                    })}
                  </div>
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectPopup>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectPopup>
              </Select>
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
