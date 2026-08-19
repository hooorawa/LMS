"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createModule, type CreateModuleState } from "@/lib/actions/module.actions";
import { createModuleSchema, type CreateModuleInput } from "@/lib/validation/module.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

const initialState: CreateModuleState = {};

export function AddModuleForm({ courseId }: { courseId: string }) {
  const [state, formAction, pending] = useActionState(createModule, initialState);

  const form = useForm<CreateModuleInput>({
    resolver: zodResolver(createModuleSchema),
    defaultValues: { title: "" },
  });

  useEffect(() => {
    if (state.error) toast.error("Could not add module", state.error);
    if (state.success) form.reset({ title: "" });
  }, [state.error, state.success, form]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("courseId", courseId);
    formData.append("title", values.title);
    startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex items-start gap-2">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input {...field} placeholder="New module title" className="max-w-xs" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Adding..." : "Add module"}
        </Button>
      </form>
    </Form>
  );
}
