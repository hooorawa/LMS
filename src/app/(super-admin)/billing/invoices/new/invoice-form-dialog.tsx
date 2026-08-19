"use client";

import { useRouter } from "next/navigation";
import { FormDialog } from "@/components/form-dialog";
import { InvoiceForm } from "./invoice-form";

export function InvoiceFormDialog({
  institutes,
}: {
  institutes: { id: string; name: string; code: string }[];
}) {
  const router = useRouter();

  return (
    <FormDialog trigger="New invoice" title="Create platform invoice" tone="create" size="xl">
      {({ close, resetKey }) => (
        <InvoiceForm
          key={resetKey}
          institutes={institutes}
          onDone={() => {
            close();
            router.refresh();
          }}
        />
      )}
    </FormDialog>
  );
}
