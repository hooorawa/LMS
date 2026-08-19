"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateClass, type UpdateClassState } from "@/lib/actions/class.actions";
import { updateClassSchema, type UpdateClassInput } from "@/lib/validation/class.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/ui/select";

const initialState: UpdateClassState = {};

export function ClassEditForm({
  classId,
  name,
  section,
  academicYear,
  classTeacherId,
  status,
  teachers,
  onSuccess,
}: {
  classId: string;
  name: string;
  section: string;
  academicYear: string;
  classTeacherId: string;
  status: string;
  teachers: { id: string; name: string }[];
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateClass, initialState);

  const form = useForm<UpdateClassInput>({
    resolver: zodResolver(updateClassSchema),
    defaultValues: {
      name,
      section,
      academicYear,
      classTeacherId,
      status: status === "archived" ? "archived" : "active",
    },
  });

  useEffect(() => {
    if (state.error) toast.error("Could not update class", state.error);
  }, [state.error]);

  useEffect(() => {
    if (state.success) {
      toast.success(`"${state.success.name}" updated`);
      onSuccess?.();
    }
  }, [state.success, onSuccess]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("id", classId);
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
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectPopup>
                </Select>
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
