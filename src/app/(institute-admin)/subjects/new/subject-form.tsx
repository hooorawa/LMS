"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSubject, type CreateSubjectState } from "@/lib/actions/subject.actions";
import { createSubjectSchema, type CreateSubjectInput } from "@/lib/validation/subject.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/ui/select";

const initialState: CreateSubjectState = {};

export function SubjectForm({
  teachers,
  classes,
  onDone,
  onCreateAnother,
}: {
  teachers: { id: string; name: string }[];
  classes: { id: string; label: string }[];
  onDone?: () => void;
  onCreateAnother?: () => void;
}) {
  const [state, formAction, pending] = useActionState(createSubject, initialState);

  const form = useForm<CreateSubjectInput>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: { name: "", code: "", teacherId: "", classIds: [] },
  });

  useEffect(() => {
    if (state.error) toast.error("Could not create subject", state.error);
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
    formData.append("name", values.name);
    formData.append("code", values.code);
    formData.append("teacherId", values.teacherId ?? "");
    (values.classIds ?? []).forEach((id) => formData.append("classIds", id));
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
              <FormLabel>Subject name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Mathematics" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject code</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. MATH10" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="teacherId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teacher</FormLabel>
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
          name="classIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Classes</FormLabel>
              <FormControl>
                {classes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No classes yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {classes.map((klass) => {
                      const checked = (field.value ?? []).includes(klass.id);
                      return (
                        <Label key={klass.id} className="flex items-center gap-2 font-normal">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(next) => {
                              const current = field.value ?? [];
                              field.onChange(
                                next ? [...current, klass.id] : current.filter((id) => id !== klass.id)
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
          {pending ? "Creating..." : "Create subject"}
        </Button>
      </form>
    </Form>
  );
}
