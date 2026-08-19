"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCourse, type CreateCourseState } from "@/lib/actions/course.actions";
import { createCourseSchema, type CreateCourseInput } from "@/lib/validation/course.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const initialState: CreateCourseState = {};

export function CourseForm({
  subjects,
  classes,
  onDone,
}: {
  subjects: { id: string; name: string }[];
  classes: { id: string; label: string }[];
  onDone?: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createCourse, initialState);

  const form = useForm<CreateCourseInput>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: { title: "", description: "", subjectId: "", classIds: [] },
  });

  useEffect(() => {
    if (state.error) toast.error("Could not create course", state.error);
  }, [state.error]);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <p className="font-medium">&ldquo;{state.success.title}&rdquo; created.</p>
        <div className="flex gap-2">
          <Button type="button" onClick={() => router.push(`/courses/${state.success!.courseId}`)}>
            Build course
          </Button>
          <Button type="button" variant="outline" onClick={onDone}>
            View courses
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("description", values.description ?? "");
    formData.append("subjectId", values.subjectId ?? "");
    values.classIds.forEach((id) => formData.append("classIds", id));
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
                <Input {...field} placeholder="e.g. Algebra Foundations" />
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
                <Textarea {...field} rows={3} placeholder="What will students learn in this course?" />
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
        <Button type="submit" disabled={pending}>
          {pending ? "Creating..." : "Create course"}
        </Button>
      </form>
    </Form>
  );
}
