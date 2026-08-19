"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bulkEnrollStudents, type BulkEnrollState } from "@/lib/actions/enrollment.actions";
import { bulkEnrollSchema, type BulkEnrollInput } from "@/lib/validation/enrollment.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const initialState: BulkEnrollState = {};

export function BulkEnrollForm({
  classes,
  courses,
}: {
  classes: { id: string; label: string }[];
  courses: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(bulkEnrollStudents, initialState);

  const form = useForm<BulkEnrollInput>({
    resolver: zodResolver(bulkEnrollSchema),
    defaultValues: { classId: "", courseId: "" },
  });

  useEffect(() => {
    if (state.error) toast.error("Could not enroll class", state.error);
  }, [state.error]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("classId", values.classId);
    formData.append("courseId", values.courseId);
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
            name="classId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectPopup>
                    {classes.map((klass) => (
                      <SelectItem key={klass.id} value={klass.id}>
                        {klass.label}
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
            name="courseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectPopup>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.label}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {state.success ? (
          <p className="text-sm text-muted-foreground">
            Enrolled {state.success.enrolledCount} student(s) from &ldquo;{state.success.className}
            &rdquo; into &ldquo;{state.success.courseTitle}&rdquo;.
            {state.success.alreadyEnrolledCount > 0
              ? ` ${state.success.alreadyEnrolledCount} were already enrolled.`
              : ""}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Enrolling..." : "Enroll class into course"}
        </Button>
      </form>
    </Form>
  );
}
