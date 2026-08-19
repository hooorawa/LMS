"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { markAttendance, type MarkAttendanceState } from "@/lib/actions/attendance.actions";
import { markAttendanceSchema, type MarkAttendanceInput } from "@/lib/validation/attendance.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { cn } from "@/lib/utils";

const STATUSES = ["present", "absent", "late", "excused"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_STYLES: Record<Status, string> = {
  present: "data-[checked=true]:bg-success/15 data-[checked=true]:text-success",
  absent: "data-[checked=true]:bg-destructive/15 data-[checked=true]:text-destructive",
  late: "data-[checked=true]:bg-warning/15 data-[checked=true]:text-warning",
  excused: "data-[checked=true]:bg-muted data-[checked=true]:text-foreground",
};

const initialState: MarkAttendanceState = {};

export function AttendanceGrid({
  classId,
  subjectId,
  date,
  students,
}: {
  classId: string;
  subjectId: string;
  date: string;
  students: { id: string; name: string; rollNumber: string; status: string }[];
}) {
  const [state, formAction, pending] = useActionState(markAttendance, initialState);

  const form = useForm<MarkAttendanceInput>({
    resolver: zodResolver(markAttendanceSchema),
    defaultValues: {
      classId,
      subjectId,
      date,
      records: students.map((student) => ({
        studentId: student.id,
        status: student.status as Status,
      })),
    },
  });

  const { fields } = useFieldArray({ control: form.control, name: "records" });

  useEffect(() => {
    if (state.error) toast.error("Could not save attendance", state.error);
    if (state.success) toast.success("Attendance saved");
  }, [state.error, state.success]);

  if (students.length === 0) {
    return <p className="text-sm text-muted-foreground">No students enrolled in this class yet.</p>;
  }

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("classId", classId);
    formData.append("subjectId", subjectId);
    formData.append("date", date);
    formData.append("records", JSON.stringify(values.records));
    startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {fields.map((rowField, index) => (
            <div
              key={rowField.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{students[index].name}</p>
                {students[index].rollNumber ? (
                  <p className="text-xs text-muted-foreground">Roll no. {students[index].rollNumber}</p>
                ) : null}
              </div>
              <FormField
                control={form.control}
                name={`records.${index}.status`}
                render={({ field }) => (
                  <div className="flex gap-1">
                    {STATUSES.map((status) => (
                      <button
                        key={status}
                        type="button"
                        data-checked={field.value === status}
                        onClick={() => field.onChange(status)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium capitalize text-muted-foreground hover:bg-muted",
                          STATUS_STYLES[status]
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>
          ))}
        </div>

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Saving..." : "Save attendance"}
        </Button>
      </form>
    </Form>
  );
}
