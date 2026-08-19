"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  suspendInstitute,
  reactivateInstitute,
  cancelInstitute,
} from "@/lib/actions/subscription.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";

function ReasonAction({
  instituteId,
  action,
  label,
  pendingLabel,
  variant,
}: {
  instituteId: string;
  action: typeof suspendInstitute | typeof cancelInstitute;
  label: string;
  pendingLabel: string;
  variant: "destructive" | "outline";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await action({}, formData);
      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <Button type="button" variant={variant} size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <input type="hidden" name="instituteId" value={instituteId} />
      <Label htmlFor={`reason-${label}`}>Reason</Label>
      <Input id={`reason-${label}`} name="reason" required placeholder="Why?" />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" variant={variant} size="sm" disabled={pending}>
          {pending ? pendingLabel : `Confirm ${label.toLowerCase()}`}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ReactivateAction({ instituteId }: { instituteId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await reactivateInstitute({}, formData);
      if (result.success) {
        router.refresh();
      } else {
        toast.error("Could not reactivate institute", result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-2">
      <input type="hidden" name="instituteId" value={instituteId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Reactivating..." : "Reactivate"}
      </Button>
    </form>
  );
}

export function InstituteLifecycleActions({
  instituteId,
  status,
}: {
  instituteId: string;
  status: string;
}) {
  if (status === "cancelled") {
    return <p className="text-sm text-muted-foreground">This institute is cancelled.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "suspended" ? (
        <ReactivateAction instituteId={instituteId} />
      ) : (
        <ReasonAction
          instituteId={instituteId}
          action={suspendInstitute}
          label="Suspend"
          pendingLabel="Suspending..."
          variant="outline"
        />
      )}
      <ReasonAction
        instituteId={instituteId}
        action={cancelInstitute}
        label="Cancel"
        pendingLabel="Cancelling..."
        variant="destructive"
      />
    </div>
  );
}
