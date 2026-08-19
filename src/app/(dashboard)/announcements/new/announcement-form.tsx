"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createAnnouncement,
  type CreateAnnouncementState,
} from "@/lib/actions/announcement.actions";
import {
  createAnnouncementSchema,
  type CreateAnnouncementInput,
} from "@/lib/validation/announcement.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const initialState: CreateAnnouncementState = {};

export function AnnouncementForm({
  allowInstitute,
  classes,
  courses,
  onDone,
  onCreateAnother,
}: {
  allowInstitute: boolean;
  classes: { id: string; name: string; section?: string }[];
  courses: { id: string; title: string }[];
  onDone?: () => void;
  onCreateAnother?: () => void;
}) {
  const [state, formAction, pending] = useActionState(createAnnouncement, initialState);

  const form = useForm<CreateAnnouncementInput>({
    resolver: zodResolver(createAnnouncementSchema),
    defaultValues: {
      audience: allowInstitute ? "institute" : "class",
      classId: "",
      courseId: "",
      title: "",
      body: "",
    },
  });

  const audience = useWatch({ control: form.control, name: "audience" });

  useEffect(() => {
    if (state.error) toast.error("Could not post announcement", state.error);
  }, [state.error]);

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <p className="font-medium">
          Announcement posted to {state.success.recipientCount} recipient
          {state.success.recipientCount === 1 ? "" : "s"}.
        </p>
        <div className="flex gap-2">
          <Button type="button" onClick={onDone}>
            Done
          </Button>
          <Button type="button" variant="outline" onClick={onCreateAnother}>
            Post another
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("audience", values.audience);
    formData.append("classId", values.classId ?? "");
    formData.append("courseId", values.courseId ?? "");
    formData.append("title", values.title);
    formData.append("body", values.body);
    startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="audience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Audience</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectPopup>
                  {allowInstitute ? <SelectItem value="institute">Entire institute</SelectItem> : null}
                  <SelectItem value="class">A class</SelectItem>
                  <SelectItem value="course">A course</SelectItem>
                </SelectPopup>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {audience === "class" ? (
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
        ) : null}

        {audience === "course" ? (
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
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Sports day postponed" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea {...field} rows={5} placeholder="Announcement details" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Posting..." : "Post announcement"}
        </Button>
      </form>
    </Form>
  );
}
