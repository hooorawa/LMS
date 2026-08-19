"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateStudentRecord, type UpdateStaffState } from "@/lib/actions/user.actions";
import { updateStudentRecordSchema, type UpdateStudentRecordFormInput } from "@/lib/validation/user.schema";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const initialState: UpdateStaffState = {};

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

const PAYMENT_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank-transfer", label: "Bank transfer" },
  { value: "other", label: "Other" },
] as const;

export function StudentRecordForm({
  studentId,
  defaults,
  classes,
}: {
  studentId: string;
  defaults: UpdateStudentRecordFormInput;
  classes: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(updateStudentRecord, initialState);

  const form = useForm<UpdateStudentRecordFormInput>({
    resolver: zodResolver(updateStudentRecordSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (state.error) toast.error("Could not update student", state.error);
    if (state.success) toast.success("Student record updated");
  }, [state.error, state.success]);

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    formData.append("studentId", studentId);
    Object.entries(values).forEach(([key, value]) => {
      if (typeof value === "boolean") {
        if (value) formData.append(key, "on");
        return;
      }
      formData.append(key, String(value ?? ""));
    });
    startTransition(() => {
      formAction(formData);
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectPopup>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="rollNumber" render={({ field }) => (
            <FormItem><FormLabel>Roll number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="classId" render={({ field }) => (
            <FormItem>
              <FormLabel>Class</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="">Unassigned</SelectItem>
                    {classes.map((klass) => <SelectItem key={klass.id} value={klass.id}>{klass.label}</SelectItem>)}
                  </SelectPopup>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="gender" render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Not specified" /></SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="">Not specified</SelectItem>
                    {GENDER_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                  </SelectPopup>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="birthday" render={({ field }) => (
            <FormItem>
              <FormLabel>Birthday</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value ? new Date(field.value) : null}
                  onChange={(date) => field.onChange(date.toISOString().slice(0, 10))}
                  dateFormat="yyyy-MM-dd"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="registrationDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Registration date</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value ? new Date(field.value) : null}
                  onChange={(date) => field.onChange(date.toISOString().slice(0, 10))}
                  dateFormat="yyyy-MM-dd"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="paymentType" render={({ field }) => (
            <FormItem>
              <FormLabel>Registration payment type</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Not recorded" /></SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="">Not recorded</SelectItem>
                    {PAYMENT_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                  </SelectPopup>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="guardianName" render={({ field }) => (
            <FormItem><FormLabel>Guardian name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="guardianRelation" render={({ field }) => (
            <FormItem><FormLabel>Guardian relation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="guardianPhone" render={({ field }) => (
            <FormItem><FormLabel>Guardian phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="guardianEmail" render={({ field }) => (
            <FormItem><FormLabel>Guardian email</FormLabel><FormControl><Input {...field} type="email" /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <FormField control={form.control} name="hasSpecialNeeds" render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-2">
              <FormControl>
                <Checkbox checked={Boolean(field.value)} onCheckedChange={(next) => field.onChange(Boolean(next))} />
              </FormControl>
              <FormLabel>Student has special needs</FormLabel>
            </div>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="specialNeedsDetails" render={({ field }) => (
          <FormItem><FormLabel>Special needs details</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem><FormLabel>Registration notes</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Saving..." : "Save student record"}
        </Button>
      </form>
    </Form>
  );
}
