"use client";

import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/form-dialog";
import { ExamEditForm } from "./exam-edit-form";

export function ExamEditDialog({
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
}) {
  const router = useRouter();

  return (
    <FormDialog trigger="Edit" triggerVariant="outline" triggerSize="sm" title="Edit exam" tone="edit" size="lg">
      {({ close, resetKey }) => (
        <ExamEditForm
          key={resetKey}
          examId={examId}
          title={title}
          subjectId={subjectId}
          classId={classId}
          examDate={examDate}
          maxMarks={maxMarks}
          term={term}
          academicYear={academicYear}
          subjects={subjects}
          classes={classes}
          onSuccess={() => {
            close();
            router.refresh();
          }}
        />
      )}
    </FormDialog>
  );
}
