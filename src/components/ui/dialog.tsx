"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

function Dialog(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal(props: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogBackdrop({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-backdrop"
      className={cn(
        "fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
        className
      )}
      {...props}
    />
  );
}

export type DialogTone = "default" | "danger" | "assign" | "edit" | "create";
export type DialogSize = "sm" | "default" | "lg" | "xl";

const DIALOG_SIZE_CLASS: Record<DialogSize, string> = {
  sm: "sm:max-w-sm",
  default: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-2xl",
};

const DIALOG_TONE_HEADER: Record<DialogTone, string> = {
  default: "",
  danger: "bg-gradient-to-b from-destructive/10 to-transparent",
  assign: "bg-gradient-to-b from-chart-5/10 to-transparent",
  edit: "bg-gradient-to-b from-primary/10 to-transparent",
  create: "bg-gradient-to-b from-success/10 to-transparent",
};

const DIALOG_TONE_CHIP: Record<DialogTone, string> = {
  default: "",
  danger: "text-destructive",
  assign: "text-chart-5",
  edit: "text-primary",
  create: "text-success",
};

const DIALOG_TONE_LABEL: Record<Exclude<DialogTone, "default">, string> = {
  danger: "Danger zone",
  assign: "Assign",
  edit: "Edit",
  create: "Create",
};

function DialogPopup({
  className,
  children,
  showClose = true,
  tone = "default",
  size = "default",
  ...props
}: DialogPrimitive.Popup.Props & { showClose?: boolean; tone?: DialogTone; size?: DialogSize }) {
  return (
    <DialogPortal>
      <DialogBackdrop />
      <DialogPrimitive.Popup
        data-slot="dialog-popup"
        className={cn(
          "shadow-modal fixed inset-x-0 bottom-0 top-auto z-50 max-h-[85vh] w-full translate-x-0 translate-y-0 overflow-y-auto rounded-t-(--radius-4xl) rounded-b-none border-t border-border bg-card p-6 text-card-foreground outline-none transition-all data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full",
          "sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-none sm:w-full sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-(--radius-4xl) sm:border sm:data-[ending-style]:translate-y-0 sm:data-[ending-style]:scale-95 sm:data-[ending-style]:opacity-0 sm:data-[starting-style]:translate-y-0 sm:data-[starting-style]:scale-95 sm:data-[starting-style]:opacity-0",
          DIALOG_SIZE_CLASS[size],
          className
        )}
        {...props}
      >
        {tone !== "default" ? (
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-24 rounded-t-(--radius-4xl)",
              DIALOG_TONE_HEADER[tone]
            )}
          />
        ) : null}
        <div className="relative">
          {tone !== "default" ? (
            <span
              className={cn(
                "mb-1.5 inline-block text-[11px] font-bold tracking-[0.08em] uppercase",
                DIALOG_TONE_CHIP[tone]
              )}
            >
              {DIALOG_TONE_LABEL[tone]}
            </span>
          ) : null}
          {children}
        </div>
        {showClose ? (
          <DialogClose className="absolute top-4 right-4 rounded-md text-muted-foreground transition-colors hover:text-foreground">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        ) : null}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="dialog-header" className={cn("flex flex-col gap-1.5 pr-6", className)} {...props} />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="dialog-footer" className={cn("mt-6 flex justify-end gap-2", className)} {...props} />
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-base font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogBackdrop,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
