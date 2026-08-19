"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

function Sheet(props: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger(props: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetPortal(props: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetClose(props: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetBackdrop({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-backdrop"
      className={cn(
        "fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
        className
      )}
      {...props}
    />
  );
}

const sheetVariants = cva(
  "shadow-modal fixed z-50 flex flex-col overflow-y-auto border-border bg-card p-6 text-card-foreground outline-none transition-transform",
  {
    variants: {
      side: {
        right:
          "inset-y-0 right-0 h-full w-full max-w-sm border-l data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full",
        left: "inset-y-0 left-0 h-full w-full max-w-sm border-r data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full",
        top: "inset-x-0 top-0 max-h-[85vh] w-full rounded-b-(--radius-4xl) border-b data-[ending-style]:-translate-y-full data-[starting-style]:-translate-y-full",
        bottom:
          "inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-(--radius-4xl) border-t data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
);

function SheetContent({
  className,
  children,
  side = "right",
  showClose = true,
  ...props
}: SheetPrimitive.Popup.Props &
  VariantProps<typeof sheetVariants> & { showClose?: boolean }) {
  return (
    <SheetPortal>
      <SheetBackdrop />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {children}
        {showClose ? (
          <SheetClose className="absolute top-4 right-4 rounded-md text-muted-foreground transition-colors hover:text-foreground">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </SheetClose>
        ) : null}
      </SheetPrimitive.Popup>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="sheet-header" className={cn("flex flex-col gap-1.5 pr-6", className)} {...props} />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="sheet-footer" className={cn("mt-auto flex justify-end gap-2 pt-6", className)} {...props} />
  );
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-base font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetPortal,
  SheetClose,
  SheetBackdrop,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
