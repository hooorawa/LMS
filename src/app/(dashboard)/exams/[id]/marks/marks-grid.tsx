"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { enterMarks, type EnterMarksState } from "@/lib/actions/marks.actions";
import { enterMarksSchema } from "@/lib/validation/marks.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

const initialState: EnterMarksState = {};

type EnterMarksInput = z.input<typeof enterMarksSchema>;

export function MarksGrid({
  examId,
  maxMarks,
  students,
}: {
  examId: string;
  maxMarks: number;
  students: { id: string; name: string; rollNumber: string; marksObtained: number | null; remarks: string }[];
}) {
  const [state, formAction, pending] = useActionState(enterMarks, initialState);

  const form = useForm<EnterMarksInput>({
    resolver: zodResolver(enterMarksSchema),
    defaultValues: {
      examId,
      entries: students.map((student) => ({
        studentId: student.id,
        marksObtained: student.marksObtained ?? 0,
        remarks: student.remarks,
      })),
    },
  });

  const { fields } = useFieldArray({ control: form.control, name: "entries" });

  useEffect(() => {
    if (state.error) toast.error("Could not save marks", state.error);
    if (state.success) toast.success("Marks saved");
  }, [state.error, state.success]);

  if (students.length === 0) {
    return <p className="text-sm text-muted-foreground">No students enrolled in this class yet.</p>;
  }

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("examId", examId);
    formData.append("entries", JSON.stringify(values.entries));
    startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{students[index].name}</p>
                {students[index].rollNumber ? (
                  <p className="text-xs text-muted-foreground">Roll no. {students[index].rollNumber}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name={`entries.${index}.marksObtained`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value as number}
                          type="number"
                          min="0"
                          max={maxMarks}
                          className="h-8 w-20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <span className="text-xs text-muted-foreground">/ {maxMarks}</span>
              </div>
            </div>
          ))}
        </div>

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Saving..." : "Save marks"}
        </Button>
      </form>
    </Form>
  );
}
