"use client";

import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/form-dialog";
import { ClassForm } from "./class-form";

export function ClassFormDialog({ teachers }: { teachers: { id: string; name: string }[] }) {
  const router = useRouter();

  return (
    <FormDialog trigger="New class" title="New class" tone="create">
      {({ close, resetKey, resetForm }) => (
        <ClassForm
          key={resetKey}
          teachers={teachers}
          onDone={() => {
            close();
            router.refresh();
          }}
          onCreateAnother={resetForm}
        />
      )}
    </FormDialog>
  );
}
