"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronsUpDown, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

function Select<Value>(props: SelectPrimitive.Root.Props<Value>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectValue(props: SelectPrimitive.Value.Props) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  children,
  size = "default",
  ...props
}: SelectPrimitive.Trigger.Props & { size?: "default" | "sm" }) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "shadow-hairline flex w-full items-center justify-between gap-2 rounded-xl border border-input bg-background/92 px-3.5 py-2 text-base text-foreground transition-[border-color,box-shadow,background-color] outline-none data-[size=default]:h-11 data-[size=sm]:h-9 data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-ring/15 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectPortal(props: SelectPrimitive.Portal.Props) {
  return <SelectPrimitive.Portal data-slot="select-portal" {...props} />;
}

function SelectPositioner({ className, ...props }: SelectPrimitive.Positioner.Props) {
  return (
    <SelectPrimitive.Positioner
      data-slot="select-positioner"
      sideOffset={6}
      className={cn("z-50 outline-none", className)}
      {...props}
    />
  );
}

function SelectScrollUpArrow({ className, ...props }: SelectPrimitive.ScrollUpArrow.Props) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-arrow"
      className={cn("flex h-6 w-full cursor-default items-center justify-center text-muted-foreground", className)}
      {...props}
    >
      <ChevronUp className="size-4" />
    </SelectPrimitive.ScrollUpArrow>
  );
}

function SelectScrollDownArrow({ className, ...props }: SelectPrimitive.ScrollDownArrow.Props) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-arrow"
      className={cn("flex h-6 w-full cursor-default items-center justify-center text-muted-foreground", className)}
      {...props}
    >
      <ChevronDown className="size-4" />
    </SelectPrimitive.ScrollDownArrow>
  );
}

function SelectPopup({ className, children, ...props }: SelectPrimitive.Popup.Props) {
  return (
    <SelectPortal>
      <SelectPositioner>
        <SelectPrimitive.Popup
          data-slot="select-popup"
          className={cn(
            "shadow-panel max-h-[min(24rem,var(--available-height))] min-w-[var(--anchor-width)] origin-[var(--transform-origin)] overflow-y-auto rounded-2xl border border-border bg-card/95 p-1 text-card-foreground outline-none backdrop-blur-sm transition-[transform,scale,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            className
          )}
          {...props}
        >
          <SelectScrollUpArrow />
          {children}
          <SelectScrollDownArrow />
        </SelectPrimitive.Popup>
      </SelectPositioner>
    </SelectPortal>
  );
}

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-lg py-2 pr-8 pl-2.5 text-sm text-foreground outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2.5 flex items-center">
        <Check className="size-4" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function SelectGroup(props: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectGroupLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-group-label"
      className={cn("px-2.5 py-1.5 text-xs font-semibold text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Select,
  SelectValue,
  SelectTrigger,
  SelectPortal,
  SelectPositioner,
  SelectPopup,
  SelectItem,
  SelectGroup,
  SelectGroupLabel,
};
