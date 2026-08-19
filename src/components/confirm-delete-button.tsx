"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "@/lib/toast";

export function ConfirmDeleteButton({
  action,
  hiddenFields,
  itemLabel,
  triggerLabel = "Delete",
  size = "sm",
  title,
}: {
  action: (formData: FormData) => void | Promise<void>;
  hiddenFields: Record<string, string>;
  itemLabel: string;
  triggerLabel?: React.ReactNode;
  size?: VariantProps<typeof buttonVariants>["size"];
  title?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function handleConfirm(formData: FormData) {
    startTransition(async () => {
      try {
        await action(formData);
        setOpen(false);
        toast.success(`${itemLabel} deleted`);
      } catch {
        toast.error(`Couldn't delete ${itemLabel.toLowerCase()}`, "Please try again.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="destructive"
        size={size}
        title={title}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>
      <DialogPopup tone="danger">
        <DialogHeader>
          <DialogTitle>Delete {itemLabel}?</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose className={buttonVariants({ variant: "outline", size: "sm" })}>
            Cancel
          </DialogClose>
          <form action={handleConfirm}>
            {Object.entries(hiddenFields).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <Button type="submit" variant="destructive" size="sm" disabled={pending}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Delete
            </Button>
          </form>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
