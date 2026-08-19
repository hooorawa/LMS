"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClass, type CreateClassState } from "@/lib/actions/class.actions";
import { createClassSchema, type CreateClassInput } from "@/lib/validation/class.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/ui/select";

const initialState: CreateClassState = {};

export function ClassForm({
  teachers,
  onDone,
  onCreateAnother,
}: {
  teachers: { id: string; name: string }[];
  onDone?: () => void;
  onCreateAnother?: () => void;
}) {
  const [state, formAction, pending] = useActionState(createClass, initialState);

  const form = useForm<CreateClassInput>({
    resolver: zodResolver(createClassSchema),
    defaultValues: { name: "", section: "", academicYear: "", classTeacherId: "", timetableDay: "", timetableStart: "", timetableEnd: "", timetableRoom: "" },
  });

  useEffect(() => {
    if (state.error) toast.error("Could not create class", state.error);
  }, [state.error]);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <p className="font-medium">&ldquo;{state.success.name}&rdquo; created.</p>
        <div className="flex gap-2">
          <Button type="button" onClick={onDone}>
            Done
          </Button>
          <Button type="button" variant="outline" onClick={onCreateAnother}>
            Create another
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, String(value ?? ""));
    });
    startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Grade 10" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/25 p-4 sm:grid-cols-2">
          <p className="sm:col-span-2 text-sm font-semibold">Weekly timetable <span className="font-normal text-muted-foreground">(optional)</span></p>
          <FormField control={form.control} name="timetableDay" render={({ field }) => <FormItem><FormLabel>Day</FormLabel><FormControl><select {...field} className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"><option value="">No schedule yet</option>{["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].map((day) => <option key={day} value={day}>{day[0].toUpperCase() + day.slice(1)}</option>)}</select></FormControl></FormItem>} />
          <FormField control={form.control} name="timetableRoom" render={({ field }) => <FormItem><FormLabel>Room</FormLabel><FormControl><Input {...field} placeholder="e.g. Room 12" /></FormControl></FormItem>} />
          <FormField control={form.control} name="timetableStart" render={({ field }) => <FormItem><FormLabel>Starts</FormLabel><FormControl><Input {...field} type="time" /></FormControl></FormItem>} />
          <FormField control={form.control} name="timetableEnd" render={({ field }) => <FormItem><FormLabel>Ends</FormLabel><FormControl><Input {...field} type="time" /></FormControl></FormItem>} />
        </div>
        <FormField
          control={form.control}
          name="section"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Section</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. A" />
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
                <Input {...field} placeholder="e.g. 2026-2027" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="classTeacherId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class teacher</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="">Unassigned</SelectItem>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Creating..." : "Create class"}
        </Button>
      </form>
    </Form>
  );
}
