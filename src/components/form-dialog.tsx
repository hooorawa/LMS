"use client";

import * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  type DialogTone,
  type DialogSize,
} from "@/components/ui/dialog";

export type FormDialogRenderProps = {
  close: () => void;
  resetKey: number;
  resetForm: () => void;
};

export function FormDialog({
  trigger,
  triggerVariant = "default",
  triggerSize = "sm",
  title,
  tone = "create",
  size = "default",
  children,
}: {
  trigger: React.ReactNode;
  triggerVariant?: VariantProps<typeof buttonVariants>["variant"];
  triggerSize?: VariantProps<typeof buttonVariants>["size"];
  title: string;
  tone?: DialogTone;
  size?: DialogSize;
  children: (helpers: FormDialogRenderProps) => React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [resetKey, setResetKey] = React.useState(0);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setResetKey((key) => key + 1);
      }}
    >
      <Button type="button" variant={triggerVariant} size={triggerSize} onClick={() => setOpen(true)}>
        {trigger}
      </Button>
      <DialogPopup tone={tone} size={size}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children({
          close: () => setOpen(false),
          resetKey,
          resetForm: () => setResetKey((key) => key + 1),
        })}
      </DialogPopup>
    </Dialog>
  );
}
