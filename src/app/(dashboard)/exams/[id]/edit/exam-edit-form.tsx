"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import type { z } from "zod";
import { updateExam, type UpdateExamState } from "@/lib/actions/exam.actions";
import { updateExamSchema } from "@/lib/validation/exam.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

const initialState: UpdateExamState = {};

type UpdateExamInput = z.input<typeof updateExamSchema>;

export function ExamEditForm({
  examId,
  title,
  subjectId,
  classId,
  examDate,
  maxMarks,
  term,
  academicYear,
  subjects,
  classes,
  onSuccess,
}: {
  examId: string;
  title: string;
  subjectId: string;
  classId: string;
  examDate: string;
  maxMarks: number;
  term: string;
  academicYear: string;
  subjects: { id: string; name: string }[];
  classes: { id: string; name: string; section?: string }[];
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateExam, initialState);

  const form = useForm<UpdateExamInput>({
    resolver: zodResolver(updateExamSchema),
    defaultValues: { title, subjectId, classId, examDate, maxMarks, term, academicYear },
  });

  useEffect(() => {
    if (state.error) toast.error("Could not update exam", state.error);
  }, [state.error]);

  useEffect(() => {
    if (state.success) {
      toast.success(`"${state.success.title}" updated`);
      onSuccess?.();
    }
  }, [state.success, onSuccess]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("id", examId);
    formData.append("title", values.title);
    formData.append("subjectId", values.subjectId);
    formData.append("classId", values.classId);
    formData.append("examDate", values.examDate);
    formData.append("maxMarks", String(values.maxMarks));
    formData.append("term", values.term ?? "");
    formData.append("academicYear", values.academicYear);
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
              <FormLabel>Exam title</FormLabel>
              <FormControl>
                <Input {...field} />
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
                    <SelectValue />
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
          name="classId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectPopup>
                  {classes.map((klass) => (
                    <SelectItem key={klass.id} value={klass.id}>
                      {klass.name}
                      {klass.section ? ` - ${klass.section}` : ""}
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
          name="examDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exam date</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value ? new Date(field.value) : null}
                  onChange={(date) => field.onChange(format(date, "yyyy-MM-dd"))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="maxMarks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max marks</FormLabel>
              <FormControl>
                <Input {...field} value={field.value as number} type="number" min="1" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="term"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Term</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Term 1" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="academicYear"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Academic year</FormLabel>
              <FormControl>
                <Input {...field} />
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
